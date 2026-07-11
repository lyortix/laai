import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, ExternalLink } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { ReportView } from "@/components/audit/report-view";
import { Comments } from "@/components/roast/comments";
import { RoastRating } from "@/components/roast/rating";
import { ShareBar } from "@/components/roast/share-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getComments, getRatingSummary } from "@/lib/community/queries";
import { getPublicRoastBySlug, recordRoastView } from "@/lib/public/roasts";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { displayUrl, formatDate } from "@/lib/utils";

interface RoastPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RoastPageProps): Promise<Metadata> {
  const { slug } = await params;
  const roast = await getPublicRoastBySlug(slug);
  if (!roast) return { title: "Roast" };
  const site = displayUrl(roast.audit.url);
  const title = `${site} — ${roast.audit.overall_score}/100`;
  return {
    title,
    description: roast.report.summary,
    alternates: { canonical: `${env.appUrl}/roast/${slug}` },
    openGraph: { title, description: roast.report.summary, type: "article" },
  };
}

export default async function RoastPage({ params }: RoastPageProps) {
  const { slug } = await params;
  const roast = await getPublicRoastBySlug(slug);
  if (!roast) notFound();

  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);

  // Current viewer (may be anonymous).
  let userId: string | null = null;
  let isAdmin = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      isAdmin = profile?.is_admin === true;
    }
  }

  const [ratingSummary, comments] = await Promise.all([
    getRatingSummary(roast.audit.id, userId),
    getComments(roast.audit.id, userId),
  ]);

  // Best-effort view count (skip owner-less anon dedupe for simplicity).
  await recordRoastView(slug);

  const site = displayUrl(roast.audit.url);
  const shareUrl = `${env.appUrl}/roast/${slug}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: env.appUrl },
      { "@type": "ListItem", position: 2, name: t.feed.title, item: `${env.appUrl}/feed` },
      { "@type": "ListItem", position: 3, name: site, item: shareUrl },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* Breadcrumbs */}
        <nav className="animate-fade-in flex items-center gap-1.5 text-sm text-muted-foreground print:hidden">
          <Link href="/" className="hover:text-foreground">
            {t.common.appName}
          </Link>
          <span>/</span>
          <Link href="/feed" className="hover:text-foreground">
            {t.feed.title}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{site}</span>
        </nav>

        {/* Header */}
        <div className="animate-fade-up mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="secondary" className="mb-2">{t.roast.publicBadge}</Badge>
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{site}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{format(t.roast.auditedOn, { date: formatDate(roast.audit.public_at ?? roast.audit.created_at, locale) })}</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" />
                {format(t.feed.views, { n: roast.audit.view_count })}
              </span>
            </p>
          </div>
          <a
            href={roast.audit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent print:hidden"
          >
            {t.roast.visitSite}
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        <div className="mt-5 print:hidden">
          <ShareBar
            url={shareUrl}
            siteLabel={roast.audit.url}
            score={roast.audit.overall_score ?? 0}
            summary={roast.report.summary}
            allowPdf
          />
        </div>

        {/* Full report (reused component) */}
        <div className="mt-8">
          <ReportView report={roast.report} />
        </div>

        <Separator className="my-10 print:hidden" />

        {/* Community */}
        <section className="space-y-6 print:hidden">
          <h2 className="text-xl font-semibold tracking-tight">{t.roast.communityTitle}</h2>
          <RoastRating
            auditId={roast.audit.id}
            aiScore={roast.audit.overall_score ?? 0}
            summary={ratingSummary}
            canRate={Boolean(userId)}
          />
          <Card>
            <CardContent className="p-6">
              <Comments
                auditId={roast.audit.id}
                comments={comments}
                currentUserId={userId}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
