import type { PageSnapshot } from "@/lib/audit/scrape";
import type { DetectedSignal } from "@/lib/audit/schema";

/**
 * Ground-truth page signals computed deterministically from the scraper —
 * never from the model. These render as the ✓/✗ evidence grid on the report
 * so scores are visibly anchored in observable facts.
 * Keys map to dictionary entries under report.signals.
 */
export function buildDetectedSignals(snapshot: PageSnapshot): DetectedSignal[] {
  return [
    { key: "pageTitle", present: Boolean(snapshot.title) },
    { key: "metaDescription", present: Boolean(snapshot.metaDescription) },
    { key: "canonical", present: Boolean(snapshot.canonical) },
    { key: "viewport", present: Boolean(snapshot.viewport) },
    { key: "openGraph", present: Boolean(snapshot.ogTitle || snapshot.ogDescription) && snapshot.ogImage },
    { key: "structuredData", present: snapshot.hasStructuredData },
    { key: "favicon", present: snapshot.hasFavicon },
    { key: "htmlLang", present: Boolean(snapshot.lang) },
    { key: "singleH1", present: snapshot.h1s.length === 1 },
    {
      key: "altTexts",
      present: snapshot.imageCount === 0 || snapshot.imagesMissingAlt === 0,
    },
  ];
}
