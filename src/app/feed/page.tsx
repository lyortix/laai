import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { EmptyState } from "@/components/roast/empty-feed";
import { FeedList } from "@/components/roast/feed-list";
import { Button } from "@/components/ui/button";
import { getPublicRoasts } from "@/lib/public/roasts";
import { getDictionary } from "@/lib/i18n/server";
import { env } from "@/lib/env";

export const revalidate = 60; // ISR: refresh the feed at most once a minute

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.feed.title,
    description: t.feed.subtitle,
    alternates: { canonical: `${env.appUrl}/feed` },
    openGraph: { title: t.feed.title, description: t.feed.subtitle, type: "website" },
  };
}

export default async function FeedPage() {
  const [t, { roasts, nextCursor }] = await Promise.all([getDictionary(), getPublicRoasts()]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <div className="animate-fade-up mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.feed.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t.feed.subtitle}</p>
        </div>

        <div className="mt-12">
          {roasts.length === 0 ? (
            <EmptyState
              title={t.feed.empty}
              body={t.feed.homeSubtitle}
              action={
                <Button asChild>
                  <Link href="/dashboard">{t.dashboard.title}</Link>
                </Button>
              }
            />
          ) : (
            <FeedList initialRoasts={roasts} initialCursor={nextCursor} />
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
