import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog/posts";
import { getPublicRoasts } from "@/lib/public/roasts";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/feed`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.8 },
  ];

  let postEntries: MetadataRoute.Sitemap = [];
  let roastEntries: MetadataRoute.Sitemap = [];
  try {
    const [posts, feed] = await Promise.all([getPublishedPosts(), getPublicRoasts(undefined, 200)]);
    postEntries = posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.published_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
    roastEntries = feed.roasts.map((roast) => ({
      url: `${base}/roast/${roast.slug}`,
      lastModified: roast.public_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Sitemap must never fail the build/request over a DB hiccup.
  }

  return [...staticEntries, ...postEntries, ...roastEntries];
}
