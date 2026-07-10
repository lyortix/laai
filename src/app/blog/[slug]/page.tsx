import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getAuthor,
  getPostBySlug,
  getRelatedPosts,
  readingMinutes,
} from "@/lib/blog/posts";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [t, locale, author, related] = await Promise.all([
    getDictionary(),
    getLocale(),
    getAuthor(post.author_id),
    getRelatedPosts(post),
  ]);

  const minutes = readingMinutes(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    author: author?.full_name ? { "@type": "Person", name: author.full_name } : undefined,
    url: `${env.appUrl}/blog/${post.slug}`,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Link
          href="/blog"
          className="animate-fade-in inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {t.blog.backToBlog}
        </Link>

        <article className="animate-fade-up mt-6">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {post.published_at && <span>{formatDate(post.published_at, locale)}</span>}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {format(t.blog.readingTime, { min: minutes })}
              </span>
              {post.category && <Badge variant="secondary">{post.category}</Badge>}
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-pretty text-lg text-muted-foreground">{post.excerpt}</p>
            )}
          </header>

          <Separator className="my-8" />

          <div className="prose-neutral space-y-5 leading-relaxed [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted/50 [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-muted-foreground">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {author && (
            <Card className="mt-10">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {format(t.blog.by, { name: author.full_name ?? "LandingRoast" })}
                  </p>
                  <Link
                    href={`/blog/author/${author.id}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {format(t.blog.postsBy, { name: author.full_name ?? "LandingRoast" })}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </article>

        {related.length > 0 && (
          <section className="animate-fade-up mt-14">
            <h2 className="text-lg font-semibold tracking-tight">{t.blog.related}</h2>
            <div className="mt-4 space-y-3">
              {related.map((item) => (
                <Link key={item.id} href={`/blog/${item.slug}`} className="block">
                  <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <CardContent className="p-4">
                      <p className="font-medium">{item.title}</p>
                      {item.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
