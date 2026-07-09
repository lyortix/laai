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

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
}
