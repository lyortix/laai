import Link from "next/link";
import { ArrowRight, Sparkles, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockScores = [
  { label: "Hero Section", score: 58, tone: "bg-amber-500" },
  { label: "Call to Action", score: 42, tone: "bg-red-500" },
  { label: "Trust & Social Proof", score: 71, tone: "bg-amber-500" },
  { label: "SEO", score: 88, tone: "bg-emerald-500" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="animate-fade-up gap-1.5 px-3 py-1">
            <Sparkles className="size-3 text-violet-500" />
            AI-powered conversion audits
          </Badge>

          <h1 className="animate-fade-up animation-delay-100 mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Your landing page is leaking money.
            <br />
            <span className="text-gradient">Find out where in 60 seconds.</span>
          </h1>

          <p className="animate-fade-up animation-delay-200 mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            Paste a URL and get a brutally honest AI audit: scores across 8
            dimensions, your top problems, rewritten hero copy, and a
            prioritized fix list.
          </p>

          <div className="animate-fade-up animation-delay-300 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group w-full sm:w-auto">
              <Link href="/signup">
                Roast my landing page
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </div>

          <p className="animate-fade-up animation-delay-400 mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Timer className="size-3.5" />
            Free plan · No credit card · Results in under a minute
          </p>
        </div>

        {/* Report preview */}
        <div className="animate-fade-up animation-delay-500 relative mx-auto mt-16 max-w-3xl">
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 blur-xl" />
          <div className="relative rounded-xl border bg-card p-6 shadow-2xl shadow-black/5 dark:shadow-black/30 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-muted-foreground">acme-startup.com</p>
                <p className="mt-1 font-semibold">Landing Page Audit</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold tabular-nums text-amber-500">61</span>
                <div className="text-left text-xs leading-tight text-muted-foreground">
                  Overall
                  <br />
                  score
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {mockScores.map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 text-sm text-muted-foreground">
                    {row.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{ width: `${row.score}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium tabular-nums">
                    {row.score}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                Top problem · Critical
              </p>
              <p className="mt-1 text-sm">
                &ldquo;Your CTA says <em>Submit</em>. Nobody wakes up wanting to
                submit. Tell visitors what they get.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
