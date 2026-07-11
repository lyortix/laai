import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { auditReportSchema, type AuditReport } from "@/lib/audit/schema";
import type { Audit, PublicRoast } from "@/lib/types";

const PUBLIC_COLUMNS =
  "id, slug, url, site_title, overall_score, report, view_count, public_at";

type PublicRow = {
  id: string;
  slug: string;
  url: string;
  site_title: string | null;
  overall_score: number | null;
  report: AuditReport | null;
  view_count: number;
  public_at: string | null;
};

function toPublicRoast(row: PublicRow): PublicRoast | null {
  if (!row.report || row.overall_score === null || !row.public_at) return null;
  return {
    id: row.id,
    slug: row.slug,
    url: row.url,
    site_title: row.site_title,
    overall_score: row.overall_score,
    hero_score: row.report.sections.hero.score,
    cta_score: row.report.sections.cta.score,
    seo_score: row.report.sections.seo.score,
    summary: row.report.summary,
    view_count: row.view_count,
    public_at: row.public_at,
  };
}

export interface FeedPage {
  roasts: PublicRoast[];
  nextCursor: string | null;
}

/** Cursor-paginated public feed, newest first. Cursor is the last public_at. */
export async function getPublicRoasts(cursor?: string, limit = 12): Promise<FeedPage> {
  if (!isSupabaseConfigured()) return { roasts: [], nextCursor: null };
  const supabase = await createClient();

  let query = supabase
    .from("audits")
    .select(PUBLIC_COLUMNS)
    .eq("is_public", true)
    .eq("status", "complete")
    .order("public_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt("public_at", cursor);

  const { data } = await query;
  const rows = (data ?? []) as PublicRow[];
  const roasts = rows.map(toPublicRoast).filter((r): r is PublicRoast => r !== null);

  const hasMore = roasts.length > limit;
  const page = hasMore ? roasts.slice(0, limit) : roasts;
  return {
    roasts: page,
    nextCursor: hasMore ? page[page.length - 1]?.public_at ?? null : null,
  };
}

export interface PublicRoastDetail {
  audit: Pick<Audit, "id" | "slug" | "url" | "site_title" | "overall_score" | "view_count" | "public_at" | "created_at">;
  report: AuditReport;
}

/** Full public roast by slug (report included). Returns null if not public. */
export async function getPublicRoastBySlug(slug: string): Promise<PublicRoastDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("audits")
    .select("id, slug, url, site_title, overall_score, report, view_count, public_at, created_at")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("status", "complete")
    .maybeSingle();

  if (!data?.report) return null;
  const parsed = auditReportSchema.safeParse(data.report);
  if (!parsed.success) return null;

  return {
    audit: {
      id: data.id,
      slug: data.slug,
      url: data.url,
      site_title: data.site_title,
      overall_score: data.overall_score,
      view_count: data.view_count,
      public_at: data.public_at,
      created_at: data.created_at,
    },
    report: parsed.data,
  };
}

/** Fire-and-forget view increment (atomic RPC). */
export async function recordRoastView(slug: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_audit_views", { audit_slug: slug });
  } catch {
    /* view counting is best-effort */
  }
}
