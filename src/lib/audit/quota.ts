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

/** Audits created since the start of the current calendar month (UTC). */
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

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());

  const used = count ?? 0;

  return {
    plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    exceeded: limit !== null && used >= limit,
  };
}
