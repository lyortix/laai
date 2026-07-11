import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface PlatformStats {
  totalUsers: number;
  totalAudits: number;
  avgScore: number | null;
}

export interface FeaturedFeedback {
  id: string;
  message: string;
  rating: number | null;
  display_name: string | null;
}

/**
 * Aggregate platform counts for the homepage trust band. Uses a
 * SECURITY DEFINER RPC so anonymous visitors get counts without table access.
 * Falls back to zeroes if the DB/migration isn't ready — never throws.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const empty: PlatformStats = { totalUsers: 0, totalAudits: 0, avgScore: null };
  if (!isSupabaseConfigured()) return empty;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("platform_stats").single();
    if (error || !data) return empty;
    const row = data as { total_users: number; total_audits: number; avg_score: number | null };
    return {
      totalUsers: Number(row.total_users) || 0,
      totalAudits: Number(row.total_audits) || 0,
      avgScore: row.avg_score === null ? null : Number(row.avg_score),
    };
  } catch {
    return empty;
  }
}

/** Admin-curated testimonials pulled from real user feedback. */
export async function getFeaturedFeedback(limit = 3): Promise<FeaturedFeedback[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("feedback")
      .select("id, message, rating, display_name")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as FeaturedFeedback[];
  } catch {
    return [];
  }
}
