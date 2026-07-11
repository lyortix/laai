"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { cn, scoreColor } from "@/lib/utils";
import type { RatingSummary } from "@/lib/community/queries";

export function StarDisplay({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("inline-flex", className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

interface RoastRatingProps {
  auditId: string;
  aiScore: number;
  summary: RatingSummary;
  canRate: boolean;
}

export function RoastRating({ auditId, aiScore, summary, canRate }: RoastRatingProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [myRating, setMyRating] = useState<number | null>(summary.myRating);
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function rate(value: number) {
    if (!canRate || saving) return;
    setSaving(true);
    setMyRating(value);
    try {
      const res = await fetch(`/api/roasts/${auditId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const shown = hover ?? myRating ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.roast.ratingTitle}</p>
        {summary.average !== null ? (
          <>
            <p className="mt-1 text-2xl font-bold tabular-nums">{summary.average.toFixed(1)}</p>
            <StarDisplay value={summary.average} className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-muted-foreground">
              {format(t.roast.ratingsCount, { n: summary.count })}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t.roast.noRatings}</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.roast.aiScore}</p>
        <p className={cn("mt-1 text-2xl font-bold tabular-nums", scoreColor(aiScore))}>{aiScore}</p>
      </div>

      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {canRate ? t.roast.rateThis : t.roast.yourRating}
        </p>
        {canRate ? (
          <div className="mt-2 flex justify-center gap-0.5" onMouseLeave={() => setHover(null)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={saving}
                aria-label={format(t.feedback.starAria, { n })}
                aria-pressed={myRating !== null && n <= myRating}
                onMouseEnter={() => setHover(n)}
                onClick={() => rate(n)}
                className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "size-6 transition-colors",
                    n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{t.roast.signInToComment}</p>
        )}
      </div>
    </div>
  );
}
