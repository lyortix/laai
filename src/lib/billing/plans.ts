import type { Plan } from "@/lib/types";

export interface PlanConfig {
  id: Plan;
  name: string;
  price: string;
  priceHint: string;
  auditsPerMonth: number | null; // null = unlimited
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: "free",
    name: "Starter",
    price: "$0",
    priceHint: "forever",
    auditsPerMonth: 3,
    features: [
      "3 audits per month",
      "Full 8-section report",
      "Rewritten hero & CTA copy",
      "Audit history",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$19",
    priceHint: "per month",
    auditsPerMonth: null,
    features: [
      "Unlimited audits",
      "Full 8-section report",
      "Rewritten hero & CTA copy",
      "Suggested pricing, FAQ & testimonials",
      "Audit history & re-runs",
      "Priority support",
    ],
  },
};

export function auditsAllowed(plan: Plan): number | null {
  return PLANS[plan].auditsPerMonth;
}
