import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit, AnalysisError } from "@/lib/audit/run";
import { getQuota } from "@/lib/audit/quota";
import { ScrapeError, normalizeUrl } from "@/lib/audit/scrape";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured, isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";
// Scrape + AI analysis fit comfortably in Vercel's 60s function window.
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().min(1, "URL is required").max(2048),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. See .env.example." },
      { status: 503 }
    );
  }
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI provider is not configured. Set OPENAI_API_KEY or MOCK_AI=true." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to run an audit." }, { status: 401 });
  }

  let url: string;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    url = normalizeUrl(parsed.data.url).toString();
  } catch (err) {
    if (err instanceof ScrapeError) {
      return NextResponse.json({ error: err.userMessage }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const quota = await getQuota(supabase, user.id);
  if (quota.exceeded) {
    return NextResponse.json(
      {
        error: `You've used all ${quota.limit} audits on the free plan this month. Upgrade to Pro for unlimited audits.`,
        code: "quota_exceeded",
      },
      { status: 402 }
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
    return NextResponse.json({ error: "Could not start the audit. Please try again." }, { status: 500 });
  }

  try {
    const { report, snapshot } = await runAudit(url);

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
      return NextResponse.json({ error: "The audit finished but could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ id: audit.id }, { status: 201 });
  } catch (err) {
    const userMessage =
      err instanceof ScrapeError || err instanceof AnalysisError
        ? err.userMessage
        : "Something went wrong while analyzing the page. Please try again.";

    console.error("[audits] run failed:", err);

    await supabase
      .from("audits")
      .update({ status: "failed", error: userMessage, completed_at: new Date().toISOString() })
      .eq("id", audit.id);

    return NextResponse.json({ error: userMessage, id: audit.id }, { status: 422 });
  }
}
