import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Post } from "@/lib/types";

export interface PostAuthor {
  id: string;
  full_name: string | null;
}

const POST_LIST_COLUMNS =
  "id, slug, title, excerpt, tags, category, author_id, published, published_at, created_at";

/** ~220 wpm is a fair average for technical marketing content. */
export function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export async function getPublishedPosts(): Promise<Omit<Post, "content" | "updated_at">[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_LIST_COLUMNS)
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Omit<Post, "content" | "updated_at">[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as Post) ?? null;
}

export async function getAuthor(authorId: string | null): Promise<PostAuthor | null> {
  if (!authorId || !isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", authorId)
    .maybeSingle();
  return (data as PostAuthor) ?? null;
}

export async function getPostsByAuthor(
  authorId: string
): Promise<Omit<Post, "content" | "updated_at">[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_LIST_COLUMNS)
    .eq("published", true)
    .eq("author_id", authorId)
    .order("published_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Omit<Post, "content" | "updated_at">[];
}

/** Related = shares a tag or the category; newest first; excludes itself. */
export async function getRelatedPosts(
  post: Pick<Post, "id" | "tags" | "category">,
  limit = 3
): Promise<Omit<Post, "content" | "updated_at">[]> {
  const all = await getPublishedPosts();
  return all
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag)).length;
      const sameCategory = post.category && candidate.category === post.category ? 1 : 0;
      return { candidate, score: sharedTags * 2 + sameCategory };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
