import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
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
const MAX_HTML_BYTES = 3 * 1024 * 1024; // 3 MB is plenty for any landing page
const MAX_REDIRECTS = 5;

function isPrivateIpv4(ip: string) {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) return true;
  const [a, b] = octets;
  return (
    a === 0 || // "this" network
    a === 10 ||
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast + reserved
  );
}

function isPrivateIpv6(ip: string) {
  const lower = ip.toLowerCase();
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fe80:") || // link-local
    lower.startsWith("fc") || // unique local fc00::/7
    lower.startsWith("fd") ||
    lower.startsWith("::ffff:") // IPv4-mapped — re-checked below anyway
  );
}

function isPrivateIp(ip: string) {
  const mapped = ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip;
  const version = isIP(mapped);
  if (version === 4) return isPrivateIpv4(mapped);
  if (version === 6) return isPrivateIpv6(ip);
  return true; // not an IP at all — treat as unsafe
}

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(host)) return isPrivateIp(host);
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".")
  );
}

/**
 * Resolves the hostname and rejects any address in a private, loopback,
 * link-local or otherwise non-public range. This closes the classic SSRF
 * bypass where a public domain name points at internal infrastructure.
 */
async function assertPubliclyRoutable(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(url.hostname)) {
    throw new ScrapeError(
      `Blocked host: ${url.hostname}`,
      "That host can't be audited. Please use a public website URL."
    );
  }
  if (isIP(host)) return; // literal IP already validated above

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new ScrapeError(
      `DNS lookup failed for ${host}`,
      "We couldn't find that domain. Check the URL for typos."
    );
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new ScrapeError(
      `Host resolves to a non-public address: ${host}`,
      "That host can't be audited. Please use a public website URL."
    );
  }
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
  if (url.username || url.password) {
    throw new ScrapeError("Credentials in URL", "URLs with embedded credentials aren't supported.");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new ScrapeError(`Blocked host: ${url.hostname}`, "That host can't be audited. Please use a public website URL.");
  }

  return url;
}

/**
 * Fetches a URL with redirects validated hop-by-hop (each target is
 * DNS-checked against private ranges) and the response body capped at
 * MAX_HTML_BYTES.
 */
async function safeFetch(startUrl: URL, signal: AbortSignal): Promise<{ res: Response; finalUrl: string; html: string }> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPubliclyRoutable(current);

    const res = await fetch(current.toString(), {
      signal,
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LandingRoastBot/1.0; +https://landingroast.ai/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      res.body?.cancel();
      if (!location) {
        throw new ScrapeError(
          `Redirect without location from ${current}`,
          "The site returned a broken redirect."
        );
      }
      current = new URL(location, current);
      if (current.protocol !== "https:" && current.protocol !== "http:") {
        throw new ScrapeError(
          `Redirect to unsupported protocol: ${current.protocol}`,
          "The site redirected somewhere we can't follow."
        );
      }
      continue;
    }

    if (!res.ok) {
      res.body?.cancel();
      throw new ScrapeError(
        `HTTP ${res.status} for ${current}`,
        `The site responded with an error (HTTP ${res.status}). Make sure the page is publicly accessible.`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("html")) {
      res.body?.cancel();
      throw new ScrapeError(
        `Non-HTML content-type: ${contentType}`,
        "That URL doesn't serve an HTML page. Point us at your landing page."
      );
    }

    // Stream with a hard byte cap so giant pages can't exhaust memory.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_HTML_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const html = Buffer.concat(chunks).toString("utf8");
    return { res, finalUrl: current.toString(), html };
  }

  throw new ScrapeError(
    `Too many redirects from ${startUrl}`,
    "The site redirected too many times. Check the URL."
  );
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

  let finalUrl: string;
  let html: string;
  try {
    ({ finalUrl, html } = await safeFetch(url, controller.signal));
  } catch (err) {
    if (err instanceof ScrapeError) throw err;
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
    finalUrl,
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
