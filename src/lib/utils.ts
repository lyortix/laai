import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = "en") {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Constrains a post-auth redirect target to same-origin paths so ?next=
 * can never be abused as an open redirect.
 */
export function sanitizeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) return fallback;
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : fallback;
}

export function displayUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}

export function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

/** Dictionary key for a score band — translate via t.report.scoreLabels. */
export function scoreLabelKey(
  score: number
): "excellent" | "great" | "good" | "needsWork" | "weak" | "critical" {
  if (score >= 90) return "excellent";
  if (score >= 80) return "great";
  if (score >= 70) return "good";
  if (score >= 60) return "needsWork";
  if (score >= 40) return "weak";
  return "critical";
}
