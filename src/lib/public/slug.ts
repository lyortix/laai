import type { SupabaseClient } from "@supabase/supabase-js";

/** "https://vercel.com/pricing" → "vercel-com-pricing". */
export function baseSlug(url: string): string {
  let host = url;
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    /* fall back to the raw string */
  }
  return (
    host
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "roast"
  );
}

/**
 * Unique, human-readable slug for a public roast. Appends a short random
 * suffix only when the base collides, so first-come URLs stay clean.
 */
export async function generateUniqueSlug(
  supabase: SupabaseClient,
  url: string
): Promise<string> {
  const base = baseSlug(url);
  const { data } = await supabase.from("audits").select("id").eq("slug", base).maybeSingle();
  if (!data) return base;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
