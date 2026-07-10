import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedPosts } from "@/lib/blog/posts";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "Conversion, copywriting and landing page teardowns from LandingRoast AI.",
};

export default async function BlogPage() {
  const [t, locale, posts] = await Promise.all([
    getDictionary(),
    getLocale(),
    getPublishedPosts(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.blog.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t.blog.subtitle}</p>
        </div>

        {posts.length === 0 ? (
          <Card className="animate-fade-up animation-delay-100 mt-10">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Newspaper className="size-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t.blog.empty}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="animate-fade-up animation-delay-100 mt-10 space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <CardContent className="space-y-2 p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {post.published_at && <span>{formatDate(post.published_at, locale)}</span>}
                      {post.category && <Badge variant="secondary">{post.category}</Badge>}
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">{post.title}</h2>
                    {post.excerpt && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-muted-foreground">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
