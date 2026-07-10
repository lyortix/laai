import { buildMockReport } from "@/lib/ai/mock";
import { resolveProvider } from "@/lib/ai/provider";
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

  const provider = resolveProvider();
  const input = { system: SYSTEM_PROMPT, user: buildUserPrompt(snapshot) };
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let raw: string;
    try {
      raw = await provider.generateJson(input);
    } catch (err) {
      lastError = err; // transient provider error — retry
      continue;
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

  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(`[ai] ${(lastError as Error)?.name ?? "error"} from provider:`, lastError);

  // During the test phase, surface the provider's real reason so misconfig
  // (bad key, unavailable model, unsupported region) is diagnosable from the
  // UI. Set DEBUG_AI_ERRORS=false to hide it before a public launch.
  const showReason = process.env.DEBUG_AI_ERRORS !== "false";
  throw new AnalysisError(
    `Model call failed: ${reason}`,
    showReason
      ? `AI provider error: ${reason.slice(0, 300)}`
      : "The AI service is having trouble right now. Please try again in a minute."
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
