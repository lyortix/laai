import * as cheerio from "cheerio";

export interface PageSnapshot {
  url: string;
  finalUrl: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: boolean;
  canonical: string;
  viewport: string;
  lang: string;
  h1s: string[];
  h2s: string[];
  buttons: string[];
  links: string[];
  imageCount: number;
  imagesMissingAlt: number;
  hasFavicon: boolean;
  hasStructuredData: boolean;
  bodyText: string;
  htmlBytes: number;
}

export class ScrapeError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message);
    this.name = "ScrapeError";
  }
}

const FETCH_TIMEOUT_MS = 15_000;
const MAX_TEXT_CHARS = 8_000;

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "::1"
  );
}

export function normalizeUrl(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new ScrapeError(`Invalid URL: ${input}`, "That doesn't look like a valid URL. Try something like example.com.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ScrapeError(`Unsupported protocol: ${url.protocol}`, "Only http(s) URLs are supported.");
  }
  if (isBlockedHost(url.hostname)) {
    throw new ScrapeError(`Blocked host: ${url.hostname}`, "That host can't be audited. Please use a public website URL.");
  }
  if (!url.hostname.includes(".")) {
    throw new ScrapeError(`Suspicious host: ${url.hostname}`, "Please enter a full domain, like yoursite.com.");
  }

  return url;
}

/**
 * Fetches a landing page and distills it into a compact, model-friendly
 * snapshot. Deliberately lightweight: no headless browser, just the served
 * HTML — which is exactly what crawlers and first paint see.
 */
export async function scrapePage(rawUrl: string): Promise<PageSnapshot> {
  const url = normalizeUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LandingRoastBot/1.0; +https://landingroast.ai/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new ScrapeError(
      `Fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
      aborted
        ? "The site took too long to respond (15s). Try again or check the URL."
        : "We couldn't reach that site. Check the URL and make sure it's publicly accessible."
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new ScrapeError(
      `HTTP ${res.status} for ${url}`,
      `The site responded with an error (HTTP ${res.status}). Make sure the page is publicly accessible.`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("html")) {
    throw new ScrapeError(
      `Non-HTML content-type: ${contentType}`,
      "That URL doesn't serve an HTML page. Point us at your landing page."
    );
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe").remove();

  const text = (sel: string) => $(sel).first().text().trim();
  const attr = (sel: string, name: string) => $(sel).first().attr(name)?.trim() ?? "";

  const collect = (sel: string, limit: number) =>
    $(sel)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, limit);

  const buttons = [
    ...collect("button", 15),
    ...collect('a[class*="btn"], a[class*="button"], a[class*="cta"], [role="button"]', 15),
  ];

  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  const images = $("img");

  return {
    url: rawUrl,
    finalUrl: res.url || url.toString(),
    title: text("title"),
    metaDescription: attr('meta[name="description"]', "content"),
    ogTitle: attr('meta[property="og:title"]', "content"),
    ogDescription: attr('meta[property="og:description"]', "content"),
    ogImage: Boolean(attr('meta[property="og:image"]', "content")),
    canonical: attr('link[rel="canonical"]', "href"),
    viewport: attr('meta[name="viewport"]', "content"),
    lang: $("html").attr("lang")?.trim() ?? "",
    h1s: collect("h1", 5),
    h2s: collect("h2", 10),
    buttons: [...new Set(buttons)].slice(0, 20),
    links: [...new Set(collect("a", 40))].slice(0, 30),
    imageCount: images.length,
    imagesMissingAlt: images.filter((_, el) => !$(el).attr("alt")).length,
    hasFavicon: $('link[rel~="icon"]').length > 0,
    hasStructuredData: $('script[type="application/ld+json"]').length > 0,
    bodyText,
    htmlBytes: Buffer.byteLength(html, "utf8"),
  };
}
