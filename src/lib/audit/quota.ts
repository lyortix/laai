import type { SupabaseClient } from "@supabase/supabase-js";
import { auditsAllowed } from "@/lib/billing/plans";
import type { Plan } from "@/lib/types";

export interface QuotaState {
  plan: Plan;
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
  exceeded: boolean;
}

/** Abuse guard applied to every plan, including Pro. */
export const HOURLY_AUDIT_CAP = 10;
/** An audit stuck in "running" longer than this is considered dead. */
export const RUNNING_STALE_MS = 2 * 60 * 1000;

function monthStartIso() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Audits counted against the monthly plan limit. Failed audits are excluded —
 * users shouldn't pay quota for a page we couldn't analyze.
 */
export async function getQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaState> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const plan: Plan = profile?.plan === "pro" ? "pro" : "free";
  const limit = auditsAllowed(plan);

  const { count } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "failed")
    .gte("created_at", monthStartIso());

  const used = count ?? 0;

  return {
    plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    exceeded: limit !== null && used >= limit,
  };
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: number; error: string; code: string };

/**
 * DB-backed rate limiting that works across serverless instances:
 * - one audit at a time per user (ignoring stale "running" rows)
 * - a per-hour cap for everyone, Pro included
 */
export async function checkRateLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const staleCutoff = new Date(Date.now() - RUNNING_STALE_MS).toISOString();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [{ count: inFlight }, { count: lastHour }] = await Promise.all([
    supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "running")
      .gte("created_at", staleCutoff),
    supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", hourAgo),
  ]);

  if ((inFlight ?? 0) > 0) {
    return {
      ok: false,
      status: 409,
      error: "You already have an audit running. Wait for it to finish before starting another.",
      code: "audit_in_progress",
    };
  }
  if ((lastHour ?? 0) >= HOURLY_AUDIT_CAP) {
    return {
      ok: false,
      status: 429,
      error: `Rate limit reached (${HOURLY_AUDIT_CAP} audits per hour). Try again in a little while.`,
      code: "rate_limited",
    };
  }
  return { ok: true };
}

/**
 * Re-checks the monthly quota AFTER the audit row was inserted. Because the
 * count now includes our own row, "count > limit" means someone raced us past
 * the limit — the caller should mark this audit failed and return 402. This
 * closes the check-then-insert TOCTOU window without needing DB locks.
 */
export async function confirmQuotaAfterInsert(
  supabase: SupabaseClient,
  userId: string,
  limit: number | null
): Promise<boolean> {
  if (limit === null) return true;
  const { count } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "failed")
    .gte("created_at", monthStartIso());
  return (count ?? 0) <= limit;
}
