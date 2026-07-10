import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit, AnalysisError } from "@/lib/audit/run";
import { checkRateLimits, confirmQuotaAfterInsert, getQuota } from "@/lib/audit/quota";
import { ScrapeError, normalizeUrl } from "@/lib/audit/scrape";
import { buildDetectedSignals } from "@/lib/audit/signals";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured, isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";
// Scrape + AI analysis fit comfortably in Vercel's 60s function window.
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().min(1, "URL is required").max(2048),
});

function jsonError(status: number, error: string, code?: string) {
  return NextResponse.json(code ? { error, code } : { error }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "Supabase is not configured. See .env.example.");
  }
  if (!isAiConfigured()) {
    return jsonError(503, "AI provider is not configured. Set GEMINI_API_KEY (or OPENAI_API_KEY / MOCK_AI=true).");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(401, "You must be signed in to run an audit.", "not_authenticated");
  }

  let url: string;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
    }
    url = normalizeUrl(parsed.data.url).toString();
  } catch (err) {
    if (err instanceof ScrapeError) {
      return jsonError(400, err.userMessage, err.code);
    }
    return jsonError(400, "Invalid request body.");
  }

  const [quota, rateLimit] = await Promise.all([
    getQuota(supabase, user.id),
    checkRateLimits(supabase, user.id),
  ]);

  if (!rateLimit.ok) {
    return jsonError(rateLimit.status, rateLimit.error, rateLimit.code);
  }
  if (quota.exceeded) {
    return jsonError(
      402,
      `You've used all ${quota.limit} audits on the free plan this month. Upgrade to Pro for unlimited audits.`,
      "quota_exceeded"
    );
  }

  // Create the audit row first so failures are visible in history too.
  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({ user_id: user.id, url, status: "running" })
    .select("id")
    .single();

  if (insertError || !audit) {
    console.error("[audits] insert failed:", insertError);
    return jsonError(500, "Could not start the audit. Please try again.", "start_failed");
  }

  // Close the check-then-insert race: with our row now counted, being over
  // the limit means a concurrent request beat us to the last slot.
  const withinQuota = await confirmQuotaAfterInsert(supabase, user.id, quota.limit);
  if (!withinQuota) {
    await supabase.from("audits").delete().eq("id", audit.id);
    return jsonError(
      402,
      `You've used all ${quota.limit} audits on the free plan this month. Upgrade to Pro for unlimited audits.`,
      "quota_exceeded"
    );
  }

  try {
    const locale = await getLocale();
    const { report, snapshot } = await runAudit(url, locale);
    // Ground-truth page facts computed by the scraper, not the model.
    report.detectedSignals = buildDetectedSignals(snapshot);

    const { error: updateError } = await supabase
      .from("audits")
      .update({
        status: "complete",
        report,
        overall_score: Math.round(report.overallScore),
        site_title: snapshot.title || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", audit.id);

    if (updateError) {
      console.error("[audits] update failed:", updateError);
      return jsonError(500, "The audit finished but could not be saved.", "save_failed");
    }

    return NextResponse.json({ id: audit.id }, { status: 201 });
  } catch (err) {
    const known = err instanceof ScrapeError || err instanceof AnalysisError;
    const userMessage = known ? err.userMessage : "Something went wrong while analyzing the page. Please try again.";
    const code = known ? err.code : "analysis_failed";

    console.error("[audits] run failed:", err);

    // Store the locale-independent code when we have one so the UI can render
    // the failure in whatever language the viewer uses later.
    await supabase
      .from("audits")
      .update({ status: "failed", error: code ?? userMessage, completed_at: new Date().toISOString() })
      .eq("id", audit.id);

    return NextResponse.json({ error: userMessage, code, id: audit.id }, { status: 422 });
  }
}
