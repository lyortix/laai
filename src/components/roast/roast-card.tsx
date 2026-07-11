"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { cn, displayUrl, formatDate, scoreColor } from "@/lib/utils";
import type { PublicRoast } from "@/lib/types";

function faviconUrl(url: string) {
  try {
    return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`;
  } catch {
    return "";
  }
}

function MiniScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn("text-sm font-semibold tabular-nums", scoreColor(score))}>{score}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export function RoastCard({ roast, style }: { roast: PublicRoast; style?: React.CSSProperties }) {
  const { t, locale } = useI18n();
  const favicon = faviconUrl(roast.url);

  return (
    <Link href={`/roast/${roast.slug}`} className="group block animate-fade-up" style={style}>
      <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={favicon}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  className="size-5 shrink-0 rounded"
                />
              ) : null}
              <p className="truncate font-medium">{displayUrl(roast.url)}</p>
            </div>
            <span className={cn("text-2xl font-bold tabular-nums", scoreColor(roast.overall_score))}>
              {roast.overall_score}
            </span>
          </div>

          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {roast.summary}
          </p>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex gap-4">
              <MiniScore label={t.feed.scoreHero} score={roast.hero_score} />
              <MiniScore label={t.feed.scoreCta} score={roast.cta_score} />
              <MiniScore label={t.feed.scoreSeo} score={roast.seo_score} />
            </div>
            <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {format(t.feed.views, { n: roast.view_count })}
              </span>
              <span>{formatDate(roast.public_at, locale)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
