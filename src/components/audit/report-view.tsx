import {
  AlertTriangle,
  Check,
  Lightbulb,
  MessageSquareQuote,
  PenLine,
  Quote,
  ThumbsUp,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/audit/score-ring";
import { SECTION_META, type AuditReport, type SectionReview } from "@/lib/audit/schema";
import { cn, scoreColor } from "@/lib/utils";

const severityVariant = {
  critical: "danger",
  high: "warning",
  medium: "secondary",
} as const;

const impactVariant = {
  high: "success",
  medium: "warning",
  low: "secondary",
} as const;

function SectionCard({
  sectionKey,
  review,
  index,
}: {
  sectionKey: keyof AuditReport["sections"];
  review: SectionReview;
  index: number;
}) {
  const meta = SECTION_META[sectionKey];
  return (
    <Card
      className="animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{meta.label}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </div>
        <span className={cn("text-2xl font-bold tabular-nums", scoreColor(review.score))}>
          {review.score}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={review.score} />
        <p className="text-sm font-medium">{review.verdict}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="size-3.5" /> Strengths
            </p>
            <ul className="space-y-1.5">
              {review.strengths.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              <AlertTriangle className="size-3.5" /> Issues
            </p>
            <ul className="space-y-1.5">
              {review.issues.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <X className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wrench className="size-3.5" /> Recommendations
          </p>
          <ul className="space-y-1.5">
            {review.recommendations.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportView({ report }: { report: AuditReport }) {
  const sectionEntries = Object.entries(report.sections) as [
    keyof AuditReport["sections"],
    SectionReview,
  ][];

  return (
    <div className="space-y-8">
      {/* Overview */}
      <Card className="animate-fade-up overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <ScoreRing score={Math.round(report.overallScore)} size={132} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight">Executive summary</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              {report.summary}
            </p>
          </div>
        </CardContent>
        <div className="grid grid-cols-2 divide-x divide-border border-t sm:grid-cols-4 lg:grid-cols-8">
          {sectionEntries.map(([key, review]) => (
            <div key={key} className="px-3 py-4 text-center">
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(review.score))}>
                {review.score}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {SECTION_META[key].label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="sections" className="animate-fade-up animation-delay-200">
        <TabsList className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="sections">
            <TrendingUp /> Sections
          </TabsTrigger>
          <TabsTrigger value="problems">
            <AlertTriangle /> Problems
          </TabsTrigger>
          <TabsTrigger value="improvements">
            <Wrench /> Improvements
          </TabsTrigger>
          <TabsTrigger value="rewrites">
            <PenLine /> Rewrites
          </TabsTrigger>
        </TabsList>

        {/* 8 section reviews */}
        <TabsContent value="sections" className="mt-4 grid gap-4 lg:grid-cols-2">
          {sectionEntries.map(([key, review], i) => (
            <SectionCard key={key} sectionKey={key} review={review} index={i} />
          ))}
        </TabsContent>

        {/* Top problems */}
        <TabsContent value="problems" className="mt-4 space-y-3">
          {report.topProblems.map((problem, i) => (
            <Card key={problem.title} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-sm font-bold text-red-500">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{problem.title}</h3>
                    <Badge variant={severityVariant[problem.severity]} className="capitalize">
                      {problem.severity}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {problem.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Improvements */}
        <TabsContent value="improvements" className="mt-4 space-y-3">
          {report.improvements.map((item, i) => (
            <Card key={item.title} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant={impactVariant[item.impact]}>{item.impact} impact</Badge>
                    <Badge variant="outline">{item.effort} effort</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Rewrites: hero, CTA, pricing, FAQ, testimonials */}
        <TabsContent value="rewrites" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="animate-fade-up">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <PenLine className="size-4 text-primary" /> Rewritten hero
                  </CardTitle>
                  <CardDescription>Copy-paste ready for your page.</CardDescription>
                </div>
                <CopyButton
                  text={`${report.rewrittenHero.headline}\n${report.rewrittenHero.subheadline}`}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-5 text-center">
                  <p className="text-balance text-xl font-bold tracking-tight sm:text-2xl">
                    {report.rewrittenHero.headline}
                  </p>
                  <p className="mt-2 text-pretty text-sm text-muted-foreground">
                    {report.rewrittenHero.subheadline}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why it works:</span>{" "}
                  {report.rewrittenHero.rationale}
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-up animation-delay-100">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareQuote className="size-4 text-primary" /> Better CTAs
                  </CardTitle>
                  <CardDescription>Primary and secondary actions.</CardDescription>
                </div>
                <CopyButton
                  text={`Primary CTA: ${report.betterCta.primary}\nSecondary CTA: ${report.betterCta.secondary}`}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border bg-muted/40 p-5">
                  <span className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm">
                    {report.betterCta.primary}
                  </span>
                  <span className="inline-flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium">
                    {report.betterCta.secondary}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why it works:</span>{" "}
                  {report.betterCta.rationale}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-up animation-delay-200">
            <CardHeader>
              <CardTitle>Suggested pricing section</CardTitle>
              <CardDescription>{report.pricingSection.strategy}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.pricingSection.tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={cn(
                      "rounded-lg border p-5",
                      tier.highlighted && "border-primary/50 bg-primary/[0.03] shadow-md"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{tier.name}</p>
                      {tier.highlighted && <Badge>Popular</Badge>}
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{tier.price}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                    <ul className="mt-4 space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="animate-fade-up animation-delay-300">
              <CardHeader>
                <CardTitle>Suggested FAQ</CardTitle>
                <CardDescription>
                  Answers the objections stopping visitors from converting.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {report.faq.map((item) => (
                  <div key={item.question} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-fade-up animation-delay-400">
              <CardHeader>
                <CardTitle>Suggested testimonials</CardTitle>
                <CardDescription>
                  Templates for the social proof to collect — replace with real
                  customer quotes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.testimonials.map((t) => (
                  <figure key={t.quote} className="rounded-lg border bg-muted/40 p-4">
                    <Quote className="size-4 text-primary" />
                    <blockquote className="mt-2 text-sm leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{t.name}</span> · {t.role}
                    </figcaption>
                  </figure>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
