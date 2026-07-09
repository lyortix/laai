import { getAiClient } from "@/lib/ai/client";
import { buildMockReport } from "@/lib/ai/mock";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { auditReportSchema, type AuditReport } from "@/lib/audit/schema";
import { scrapePage, type PageSnapshot } from "@/lib/audit/scrape";
import { env } from "@/lib/env";

export class AnalysisError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message);
    this.name = "AnalysisError";
  }
}

/** Strips markdown fences some models wrap around JSON despite instructions. */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

async function requestCompletion(snapshot: PageSnapshot, useJsonMode: boolean) {
  const client = getAiClient();
  return client.chat.completions.create({
    model: env.aiModel,
    temperature: 0.4,
    max_tokens: 6_000,
    ...(useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(snapshot) },
    ],
  });
}

function parseReport(raw: string): AuditReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new AnalysisError("Model returned invalid JSON", "The AI produced an unreadable report. Please try again.");
  }

  const result = auditReportSchema.safeParse(parsed);
  if (!result.success) {
    throw new AnalysisError(
      `Report failed validation: ${result.error.message.slice(0, 500)}`,
      "The AI report was incomplete. Please try again."
    );
  }
  return result.data;
}

const MAX_ATTEMPTS = 2;

async function generateReport(snapshot: PageSnapshot): Promise<AuditReport> {
  if (env.mockAi) {
    // Simulate model latency so loading states are exercised in dev.
    await new Promise((r) => setTimeout(r, 2_500));
    return buildMockReport(snapshot);
  }

  // Not every OpenAI-compatible provider supports response_format; drop it
  // and rely on prompt discipline if the first call rejects it.
  let useJsonMode = true;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let raw: string | null | undefined;
    try {
      const completion = await requestCompletion(snapshot, useJsonMode);
      raw = completion.choices[0]?.message?.content;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (useJsonMode && /response_format/i.test(message)) {
        useJsonMode = false;
        attempt--; // provider capability probe, not a real failure
        continue;
      }
      continue; // transient provider error — retry
    }

    if (!raw) {
      lastError = new AnalysisError("Empty completion from model", "The AI returned an empty response. Please try again.");
      continue;
    }

    try {
      return parseReport(raw);
    } catch (err) {
      lastError = err; // malformed output — retry once
    }
  }

  if (lastError instanceof AnalysisError) throw lastError;
  throw new AnalysisError(
    `Model call failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    "The AI service is having trouble right now. Please try again in a minute."
  );
}

export interface RunAuditResult {
  report: AuditReport;
  snapshot: PageSnapshot;
}

/** Scrape → analyze. Throws ScrapeError / AnalysisError with user-safe messages. */
export async function runAudit(url: string): Promise<RunAuditResult> {
  const snapshot = await scrapePage(url);
  const report = await generateReport(snapshot);
  return { report, snapshot };
}
