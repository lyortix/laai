import { getPublishedPosts } from "@/lib/blog/posts";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const revalidate = 3600;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c
  );
}

/** RSS 2.0 feed for the blog. */
export async function GET() {
  const base = env.appUrl;
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    /* empty feed on DB error */
  }

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}/blog/${post.slug}</link>
      <guid>${base}/blog/${post.slug}</guid>
      ${post.published_at ? `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>` : ""}
      ${post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : ""}
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LandingRoast AI — Blog</title>
    <link>${base}/blog</link>
    <description>Conversion, copywriting and landing page teardowns.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
