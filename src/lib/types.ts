import type { AuditReport } from "@/lib/audit/schema";

export type AuditStatus = "pending" | "running" | "complete" | "failed";
export type Plan = "free" | "pro";

export interface Audit {
  id: string;
  user_id: string;
  url: string;
  site_title: string | null;
  status: AuditStatus;
  overall_score: number | null;
  report: AuditReport | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Lean projection for audit lists — deliberately excludes the multi-KB
 * `report` JSONB so history/dashboard queries stay cheap.
 */
export type AuditListItem = Omit<Audit, "report" | "user_id" | "completed_at">;

export const AUDIT_LIST_COLUMNS =
  "id, url, site_title, status, overall_score, error, created_at";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  is_admin?: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  category: string | null;
  author_id: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedbackType = "suggestion" | "bug" | "feature" | "other";

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  rating: number | null;
  message: string;
  page: string | null;
  created_at: string;
}
