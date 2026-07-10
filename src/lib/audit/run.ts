import { buildMockReport } from "@/lib/ai/mock";
import { resolveProvider } from "@/lib/ai/provider";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import { auditReportSchema, type AuditReport } from "@/lib/audit/schema";
import { scrapePage, type PageSnapshot } from "@/lib/audit/scrape";
import { env } from "@/lib/env";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    /** Locale-independent code; the UI translates it (see errors.codes). */
    public readonly code?: string
  ) {
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
    throw new AnalysisError(
      "Model returned invalid JSON",
      "The AI produced an unreadable report. Please try again.",
      "ai_unreadable"
    );
  }

  const result = auditReportSchema.safeParse(parsed);
  if (!result.success) {
    throw new AnalysisError(
      `Report failed validation: ${result.error.message.slice(0, 500)}`,
      "The AI report was incomplete. Please try again.",
      "ai_incomplete"
    );
  }
  return result.data;
}

const MAX_ATTEMPTS = 2;
/**
 * Overall budget for AI generation. Kept below the platform's 60s function
 * limit so a slow model produces a clean, marked-failed audit (row not stuck
 * "running") instead of an opaque platform 504.
 */
const AI_DEADLINE_MS = 50_000;
/** Don't start another attempt unless at least this much budget remains. */
const MIN_RETRY_BUDGET_MS = 12_000;

const AI_TIMEOUT = Symbol("ai-timeout");

function raceDeadline<T>(promise: Promise<T>, ms: number): Promise<T | typeof AI_TIMEOUT> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<typeof AI_TIMEOUT>((resolve) => {
    timer = setTimeout(() => resolve(AI_TIMEOUT), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function generateReport(snapshot: PageSnapshot, locale: Locale): Promise<AuditReport> {
  if (env.mockAi) {
    // Simulate model latency so loading states are exercised in dev.
    await new Promise((r) => setTimeout(r, 2_500));
    return buildMockReport(snapshot);
  }

  const provider = resolveProvider();
  const input = { system: buildSystemPrompt(locale), user: buildUserPrompt(snapshot) };
  const deadline = Date.now() + AI_DEADLINE_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    if (attempt > 1 && remaining < MIN_RETRY_BUDGET_MS) break;

    let raw: string | typeof AI_TIMEOUT;
    try {
      raw = await raceDeadline(provider.generateJson(input), remaining);
    } catch (err) {
      lastError = err; // transient provider error — retry if budget allows
      continue;
    }

    if (raw === AI_TIMEOUT) {
      throw new AnalysisError(
        "AI generation exceeded the time budget",
        "The analysis took too long and was stopped. Please try again — it usually completes on a second attempt.",
        "ai_timeout"
      );
    }

    if (!raw) {
      lastError = new AnalysisError(
        "Empty completion from model",
        "The AI returned an empty response. Please try again.",
        "ai_empty"
      );
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
      : "The AI service is having trouble right now. Please try again in a minute.",
    showReason ? undefined : "ai_error"
  );
}

export interface RunAuditResult {
  report: AuditReport;
  snapshot: PageSnapshot;
}

/**
 * Scrape → analyze. The report's free text is written in `locale`.
 * Throws ScrapeError / AnalysisError with user-safe messages and codes.
 */
export async function runAudit(url: string, locale: Locale = defaultLocale): Promise<RunAuditResult> {
  const snapshot = await scrapePage(url);
  const report = await generateReport(snapshot, locale);
  return { report, snapshot };
}
