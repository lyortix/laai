import { Quote, Star } from "lucide-react";
import { getFeaturedFeedback, getPlatformStats } from "@/lib/public/stats";
import { getDictionary } from "@/lib/i18n/server";

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

/**
 * Trust band: live platform counts (members, audits, avg score) plus
 * admin-curated real testimonials. Hidden entirely until there's data,
 * so a brand-new deployment never shows an empty or fake-looking section.
 */
export async function SocialProof() {
  const [t, stats, feedback] = await Promise.all([
    getDictionary(),
    getPlatformStats(),
    getFeaturedFeedback(),
  ]);

  const hasStats = stats.totalUsers > 0 || stats.totalAudits > 0;
  if (!hasStats && feedback.length === 0) return null;

  const items = [
    { value: formatCount(stats.totalUsers), label: t.social.membersLabel },
    { value: formatCount(stats.totalAudits), label: t.social.auditsLabel },
    ...(stats.avgScore !== null
      ? [{ value: String(stats.avgScore), label: t.social.avgScoreLabel }]
      : []),
  ];

  return (
    <section className="border-t border-border/60 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {hasStats && (
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-gradient text-4xl font-bold tabular-nums sm:text-5xl">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {feedback.length > 0 && (
          <div className="mt-14">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight">{t.social.lovedTitle}</h2>
              <p className="mt-2 text-muted-foreground">{t.social.lovedSubtitle}</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {feedback.map((item) => (
                <figure key={item.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <Quote className="size-4 text-primary" />
                    {item.rating && (
                      <div className="flex" aria-hidden="true">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                  <blockquote className="mt-3 text-sm leading-relaxed">{item.message}</blockquote>
                  {item.display_name && (
                    <figcaption className="mt-3 text-xs font-medium text-muted-foreground">
                      {item.display_name}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
