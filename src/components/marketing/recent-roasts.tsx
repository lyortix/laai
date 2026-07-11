import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RoastCard } from "@/components/roast/roast-card";
import { Button } from "@/components/ui/button";
import { getPublicRoasts } from "@/lib/public/roasts";
import { getDictionary } from "@/lib/i18n/server";

/** Homepage strip of the latest public roasts. Hidden when none exist yet. */
export async function RecentRoasts() {
  const [t, { roasts }] = await Promise.all([getDictionary(), getPublicRoasts(undefined, 6)]);
  if (roasts.length === 0) return null;

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.feed.homeTitle}</h2>
            <p className="mt-2 text-lg text-muted-foreground">{t.feed.homeSubtitle}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/feed">
              {t.feed.viewAll} <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roasts.map((roast, i) => (
            <RoastCard key={roast.id} roast={roast} style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      </div>
    </section>
  );
}
