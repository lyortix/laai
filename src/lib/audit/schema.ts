import { z } from "zod";

const score = z.number().min(0).max(100);

export const sectionReviewSchema = z.object({
  score,
  verdict: z.string().min(1),
  strengths: z.array(z.string()).min(1).max(5),
  issues: z.array(z.string()).min(1).max(5),
  recommendations: z.array(z.string()).min(1).max(5),
});

export const auditReportSchema = z.object({
  overallScore: score,
  summary: z.string().min(1),
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
  improvements: z
    .array(
      z.object({
        title: z.string(),
        impact: z.enum(["high", "medium", "low"]),
        effort: z.enum(["low", "medium", "high"]),
        description: z.string(),
      })
    )
    .min(5)
    .max(10),
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
      .min(2)
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

export const SECTION_META: Record<
  keyof AuditReport["sections"],
  { label: string; description: string }
> = {
  hero: { label: "Hero Section", description: "First impression, headline clarity, value proposition" },
  cta: { label: "Call to Action", description: "Button copy, placement, visual prominence" },
  trust: { label: "Trust & Social Proof", description: "Testimonials, logos, guarantees, credibility signals" },
  typography: { label: "Typography", description: "Hierarchy, readability, font pairing" },
  color: { label: "Color & Contrast", description: "Palette cohesion, contrast, accessibility" },
  conversion: { label: "Conversion Flow", description: "Friction, persuasion structure, objection handling" },
  seo: { label: "SEO", description: "Meta tags, headings, semantics, indexability" },
  mobile: { label: "Mobile Experience", description: "Responsive layout, tap targets, mobile performance" },
};
