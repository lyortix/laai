import { z } from "zod";

const score = z.number().min(0).max(100);

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const prioritySchema = z.enum(["critical", "high", "medium", "low"]);
export type Priority = z.infer<typeof prioritySchema>;

/** Impact scale — qualitative by design; we never fabricate percentages. */
export const impactSchema = z.enum(["very_high", "high", "medium", "low"]);
export type Impact = z.infer<typeof impactSchema>;

export const sectionReviewSchema = z.object({
  score,
  verdict: z.string().min(1),
  /** How certain the analysis is — lower for inferred-only dimensions. */
  confidence: confidenceSchema.optional(),
  /** Short observed facts from the page backing this section's score. */
  evidence: z.array(z.string()).max(6).optional(),
  strengths: z.array(z.string()).min(1).max(5),
  issues: z.array(z.string()).min(1).max(5),
  recommendations: z.array(z.string()).min(1).max(5),
});

/** Deterministic signals computed from the scraped page (not AI-generated). */
export const detectedSignalSchema = z.object({
  key: z.string(),
  present: z.boolean(),
});
export type DetectedSignal = z.infer<typeof detectedSignalSchema>;

export const improvementSchema = z.object({
  title: z.string(),
  impact: impactSchema,
  effort: z.enum(["low", "medium", "high"]),
  priority: prioritySchema.optional(),
  confidence: confidenceSchema.optional(),
  description: z.string(),
});
export type Improvement = z.infer<typeof improvementSchema>;

export const auditReportSchema = z.object({
  overallScore: score,
  summary: z.string().min(1),
  /**
   * Present when the page couldn't be fully analyzed (e.g. heavy client-side
   * rendering) — an honest statement of what the audit could not see.
   */
  analysisLimitations: z.string().nullable().optional(),
  /** Injected server-side from the scraper — ground-truth page facts. */
  detectedSignals: z.array(detectedSignalSchema).optional(),
  sections: z.object({
    hero: sectionReviewSchema,
    cta: sectionReviewSchema,
    trust: sectionReviewSchema,
    typography: sectionReviewSchema,
    color: sectionReviewSchema,
    conversion: sectionReviewSchema,
    seo: sectionReviewSchema,
    mobile: sectionReviewSchema,
  }),
  topProblems: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(["critical", "high", "medium"]),
        description: z.string(),
      })
    )
    .min(3)
    .max(5),
  improvements: z.array(improvementSchema).min(5).max(10),
  rewrittenHero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    rationale: z.string(),
  }),
  betterCta: z.object({
    primary: z.string(),
    secondary: z.string(),
    rationale: z.string(),
  }),
  pricingSection: z.object({
    strategy: z.string(),
    /** True when the page's existing pricing is already strong — no rewrite. */
    noChangesNeeded: z.boolean().optional(),
    tiers: z
      .array(
        z.object({
          name: z.string(),
          price: z.string(),
          description: z.string(),
          features: z.array(z.string()).min(2),
          highlighted: z.boolean(),
        })
      )
      .max(4),
  }),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .min(4)
    .max(8),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string(), role: z.string() }))
    .min(2)
    .max(4),
});

export type SectionReview = z.infer<typeof sectionReviewSchema>;
export type AuditReport = z.infer<typeof auditReportSchema>;
export type SectionKey = keyof AuditReport["sections"];

export const SECTION_KEYS: SectionKey[] = [
  "hero",
  "cta",
  "trust",
  "typography",
  "color",
  "conversion",
  "seo",
  "mobile",
];

/** Fallback priority for reports generated before the priority field existed. */
export function derivePriority(improvement: Improvement): Priority {
  if (improvement.priority) return improvement.priority;
  switch (improvement.impact) {
    case "very_high":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}
