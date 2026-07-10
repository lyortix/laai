import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthor, getPostsByAuthor } from "@/lib/blog/posts";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { formatDate } from "@/lib/utils";

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);
  return { title: author?.full_name ?? "Author" };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) notFound();

  const [t, locale, posts] = await Promise.all([
    getDictionary(),
    getLocale(),
    getPostsByAuthor(id),
  ]);
  const name = author.full_name ?? "LandingRoast";

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="animate-fade-in inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {t.blog.backToBlog}
        </Link>

        <div className="animate-fade-up mt-6 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
            <UserRound className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {format(t.blog.postsBy, { name })}
          </h1>
        </div>

        {posts.length === 0 ? (
          <p className="animate-fade-up animation-delay-100 mt-10 text-muted-foreground">
            {t.blog.empty}
          </p>
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
