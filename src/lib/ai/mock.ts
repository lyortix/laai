import type { AuditReport } from "@/lib/audit/schema";
import type { PageSnapshot } from "@/lib/audit/scrape";

/**
 * Deterministic sample report used when MOCK_AI=true. Lets the whole product
 * be exercised locally without an AI provider key.
 */
export function buildMockReport(snapshot: PageSnapshot): AuditReport {
  const site = snapshot.title || new URL(snapshot.finalUrl).hostname;
  const section = (score: number, verdict: string) => ({
    score,
    verdict,
    confidence: "medium" as const,
    evidence: [
      "Sample evidence item observed on the page.",
      "Second observed fact from the snapshot.",
    ],
    strengths: [
      "Clear structural hierarchy detected in the markup.",
      "Content is present and reasonably scannable.",
    ],
    issues: [
      "Key message is diluted by competing elements.",
      "Missing signals that high-converting pages rely on.",
    ],
    recommendations: [
      "Lead with a single, specific outcome for the visitor.",
      "Remove or demote anything that doesn't support the primary action.",
    ],
  });

  return {
    overallScore: 64,
    summary: `${site} has solid bones but leaks conversions: the value proposition is vague above the fold, the primary CTA competes with secondary links, and trust signals arrive too late. Fixing the hero and CTA alone should move the needle. (Sample report — MOCK_AI is enabled.)`,
    analysisLimitations: null,
    sections: {
      hero: section(58, "The headline describes the product instead of the outcome the visitor gets."),
      cta: section(55, "The primary action is present but visually and verbally underpowered."),
      trust: section(60, "Credibility signals exist but are buried below the fold."),
      typography: section(72, "Hierarchy is functional though body copy runs long for scanning."),
      color: section(70, "Palette is coherent; contrast on secondary text likely fails WCAG AA."),
      conversion: section(59, "The page asks for commitment before establishing value."),
      seo: section(68, snapshot.metaDescription ? "Core meta tags exist; heading semantics could be tighter." : "Missing meta description is costing you click-through from search."),
      mobile: section(66, snapshot.viewport ? "Viewport is configured; tap targets and copy density need review." : "No viewport meta tag — the page is not mobile-optimized."),
    },
    topProblems: [
      { title: "Vague value proposition", severity: "critical", description: "A visitor can't tell within 5 seconds what they get and why it beats alternatives." },
      { title: "Weak primary CTA", severity: "high", description: "Generic button copy and low visual prominence make the next step forgettable." },
      { title: "Trust arrives too late", severity: "high", description: "Social proof and guarantees appear after the decision point instead of beside it." },
      { title: "No urgency or risk reversal", severity: "medium", description: "Nothing answers 'why now?' or removes the fear of committing." },
    ],
    improvements: [
      { title: "Rewrite the hero headline around the outcome", impact: "high", effort: "low", priority: "critical" as const, confidence: "high" as const, description: "State the transformation, not the tool. Specificity beats cleverness." },
      { title: "Make one CTA unmissable", impact: "high", effort: "low", priority: "critical" as const, confidence: "high" as const, description: "One high-contrast primary button above the fold; demote everything else." },
      { title: "Move social proof above the fold", impact: "high", effort: "low", priority: "critical" as const, confidence: "high" as const, description: "A logo strip or a single sharp testimonial next to the CTA lowers perceived risk." },
      { title: "Add a meta description", impact: "medium", effort: "low", priority: "medium" as const, confidence: "medium" as const, description: "Write a 150-character pitch for the search results page." },
      { title: "Compress body copy by 40%", impact: "medium", effort: "medium", priority: "medium" as const, confidence: "medium" as const, description: "Turn paragraphs into scannable benefit bullets." },
      { title: "Add an FAQ section", impact: "medium", effort: "low", priority: "medium" as const, confidence: "medium" as const, description: "Answer the 5 objections that stop people from converting." },
      { title: "Show pricing (or a path to it)", impact: "medium", effort: "medium", priority: "medium" as const, confidence: "medium" as const, description: "Hidden pricing reads as expensive. Anchor with a free tier if possible." },
      { title: "Audit color contrast", impact: "low", effort: "low", priority: "low" as const, confidence: "high" as const, description: "Ensure all text meets WCAG AA, especially muted secondary copy." },
    ],
    rewrittenHero: {
      headline: "Know exactly why visitors leave — and fix it today",
      subheadline: `${site} turns your landing page into a conversion machine with a concrete, prioritized action plan.`,
      rationale: "Leads with the visitor's outcome, adds urgency, and keeps the promise concrete and testable.",
    },
    betterCta: {
      primary: "Get my free audit",
      secondary: "See a sample report",
      rationale: "First-person, benefit-anchored copy with a zero-risk secondary path for hesitant visitors.",
    },
    pricingSection: {
      noChangesNeeded: false,
      strategy: "Anchor with a free tier to remove friction, then price the paid tier against the value of a single recovered customer.",
      tiers: [
        { name: "Starter", price: "$0", description: "For trying it out", features: ["3 audits per month", "Full report access", "Community support"], highlighted: false },
        { name: "Pro", price: "$19/mo", description: "For serious builders", features: ["Unlimited audits", "History & tracking", "Priority support", "Early access to new checks"], highlighted: true },
      ],
    },
    faq: [
      { question: "How long does an audit take?", answer: "Under 60 seconds. Paste a URL, get a full report." },
      { question: "Do you need access to my code or analytics?", answer: "No — we analyze the publicly served page, exactly what your visitors and search engines see." },
      { question: "What does the AI actually check?", answer: "Hero clarity, CTAs, trust signals, typography, color, conversion flow, SEO and mobile readiness — scored and prioritized." },
      { question: "Can I audit competitors?", answer: "Yes. Any public URL works." },
      { question: "Is there a free plan?", answer: "Yes — 3 audits per month, no credit card required." },
    ],
    testimonials: [
      { quote: "We shipped the top 3 fixes in an afternoon and signups jumped 22%.", name: "Maya", role: "Founder, indie SaaS" },
      { quote: "It reads like a senior CRO consultant reviewed the page — for the price of a coffee.", name: "Jonas", role: "Growth lead" },
      { quote: "The rewritten headline alone was worth it. We used it verbatim.", name: "Priya", role: "Product marketer" },
    ],
  };
}
