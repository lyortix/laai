/**
 * Community data models — DORMANT.
 *
 * The tables exist (see supabase/migrations/0002) with admin-only RLS, so
 * nothing is exposed to users yet. These types are the single source of
 * truth for when comments, ratings, reviews, likes, replies, moderation and
 * spam detection ship as product surfaces.
 */

export type ModerationStatus = "pending" | "approved" | "rejected" | "spam";

export interface CommunityReview {
  id: string;
  user_id: string;
  /** Normalized hostname being reviewed (e.g. "stripe.com"). */
  site_host: string;
  rating: number; // 1..5
  title: string | null;
  body: string | null;
  status: ModerationStatus;
  /** 0..1 from automated spam detection; null until scored. */
  spam_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  user_id: string;
  review_id: string;
  /** Non-null for replies — threads are one level deep by convention. */
  parent_id: string | null;
  body: string;
  status: ModerationStatus;
  spam_score: number | null;
  created_at: string;
}

export interface CommunityLike {
  user_id: string;
  target_type: "review" | "comment";
  target_id: string;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string | null;
  target_type: "review" | "comment";
  target_id: string;
  action: "approve" | "reject" | "mark_spam" | "delete";
  reason: string | null;
  created_at: string;
}
