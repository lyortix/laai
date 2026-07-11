"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { RoastCard } from "@/components/roast/roast-card";
import { useI18n } from "@/lib/i18n/client";
import type { PublicRoast } from "@/lib/types";

interface FeedListProps {
  initialRoasts: PublicRoast[];
  initialCursor: string | null;
}

/** Infinite-scroll feed: appends pages from /api/feed as a sentinel scrolls in. */
export function FeedList({ initialRoasts, initialCursor }: FeedListProps) {
  const { t } = useI18n();
  const [roasts, setRoasts] = useState(initialRoasts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`);
      if (res.ok) {
        const data = (await res.json()) as { roasts: PublicRoast[]; nextCursor: string | null };
        setRoasts((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...data.roasts.filter((r) => !seen.has(r.id))];
        });
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roasts.map((roast, i) => (
          <RoastCard key={roast.id} roast={roast} style={{ animationDelay: `${(i % 12) * 40}ms` }} />
        ))}
      </div>

      {cursor && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t.feed.loading}
            </span>
          )}
        </div>
      )}
    </>
  );
}
