import { createClient } from "@/lib/supabase/server";

export interface RoastComment {
  id: string;
  user_id: string;
  body: string;
  pinned: boolean;
  hidden: boolean;
  created_at: string;
  author_name: string;
  like_count: number;
  liked_by_me: boolean;
}

export interface RatingSummary {
  average: number | null;
  count: number;
  myRating: number | null;
}

export type CommentSort = "newest" | "most_liked" | "oldest";

/** Aggregate community rating for a roast, plus the current user's own rating. */
export async function getRatingSummary(
  auditId: string,
  userId: string | null
): Promise<RatingSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roast_ratings")
    .select("rating, user_id")
    .eq("audit_id", auditId);

  const rows = (data ?? []) as { rating: number; user_id: string }[];
  const count = rows.length;
  const average = count ? rows.reduce((s, r) => s + r.rating, 0) / count : null;
  const myRating = userId ? rows.find((r) => r.user_id === userId)?.rating ?? null : null;
  return { average, count, myRating };
}

/** Threaded-flat comments with author name, like counts, and liked-by-me. */
export async function getComments(
  auditId: string,
  userId: string | null,
  sort: CommentSort = "most_liked"
): Promise<RoastComment[]> {
  const supabase = await createClient();

  const { data: commentRows } = await supabase
    .from("roast_comments")
    .select("id, user_id, body, pinned, hidden, created_at")
    .eq("audit_id", auditId)
    .order("created_at", { ascending: false });

  const comments = (commentRows ?? []) as Omit<
    RoastComment,
    "author_name" | "like_count" | "liked_by_me"
  >[];
  if (comments.length === 0) return [];

  const ids = comments.map((c) => c.id);
  const authorIds = [...new Set(comments.map((c) => c.user_id))];

  const [{ data: likeRows }, { data: profileRows }] = await Promise.all([
    supabase.from("roast_comment_likes").select("comment_id, user_id").in("comment_id", ids),
    supabase.from("profiles").select("id, full_name, email").in("id", authorIds),
  ]);

  const likes = (likeRows ?? []) as { comment_id: string; user_id: string }[];
  const profiles = (profileRows ?? []) as { id: string; full_name: string | null; email: string | null }[];
  const nameOf = new Map(
    profiles.map((p) => [p.id, p.full_name || p.email?.split("@")[0] || "User"])
  );

  const enriched: RoastComment[] = comments.map((c) => {
    const commentLikes = likes.filter((l) => l.comment_id === c.id);
    return {
      ...c,
      author_name: nameOf.get(c.user_id) ?? "User",
      like_count: commentLikes.length,
      liked_by_me: userId ? commentLikes.some((l) => l.user_id === userId) : false,
    };
  });

  // Pinned always float to the top; the rest follow the requested sort.
  const rest = enriched.filter((c) => !c.pinned);
  const pinned = enriched.filter((c) => c.pinned);
  rest.sort((a, b) => {
    if (sort === "most_liked") return b.like_count - a.like_count;
    const at = new Date(a.created_at).getTime();
    const bt = new Date(b.created_at).getTime();
    return sort === "oldest" ? at - bt : bt - at;
  });
  return [...pinned, ...rest];
}
