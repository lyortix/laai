import {
  AlertTriangle,
  Check,
  Eye,
  Info,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/audit/score-ring";
import {
  derivePriority,
  SECTION_KEYS,
  type AuditReport,
  type Confidence,
  type Priority,
  type SectionKey,
  type SectionReview,
} from "@/lib/audit/schema";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { cn, scoreColor, scoreLabelKey } from "@/lib/utils";

const severityVariant = { critical: "danger", high: "warning", medium: "secondary" } as const;
const impactVariant = { very_high: "success", high: "success", medium: "warning", low: "secondary" } as const;
const confidenceVariant: Record<Confidence, "outline" | "secondary"> = {
  high: "outline",
  medium: "outline",
  low: "secondary",
};

const PRIORITY_ORDER: Priority[] = ["critical", "high", "medium", "low"];
const priorityDot: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

function ConfidenceBadge({ level, t }: { level?: Confidence; t: Dictionary }) {
  if (!level) return null;
  return (
    <Badge variant={confidenceVariant[level]} className="gap-1 text-muted-foreground">
      <Eye />
      {t.report.confidence[level]}
    </Badge>
  );
}

function SectionCard({
  sectionKey,
  review,
  index,
  t,
}: {
  sectionKey: SectionKey;
  review: SectionReview;
  index: number;
  t: Dictionary;
}) {
  const meta = t.report.sections[sectionKey];
  return (
    <Card className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{review.verdict}</p>
          <ConfidenceBadge level={review.confidence} t={t} />
        </div>

        {review.evidence && review.evidence.length > 0 && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Eye className="size-3.5" /> {t.report.evidence}
            </p>
            <ul className="mt-2 space-y-1">
              {review.evidence.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="size-3.5" /> {t.report.strengths}
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
              <AlertTriangle className="size-3.5" /> {t.report.issues}
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
            <Wrench className="size-3.5" /> {t.report.recommendations}
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

export async function ReportView({ report }: { report: AuditReport }) {
  const t = await getDictionary();
  const score = Math.round(report.overallScore);
  const scoreBand = t.report.scoreLabels[scoreLabelKey(score)];

  const roadmap = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: report.improvements.filter((item) => derivePriority(item) === priority),
  })).filter((group) => group.items.length > 0);

  let itemIndex = 0;

  return (
    <div className="space-y-8">
      {report.analysisLimitations && (
        <Alert className="animate-fade-in">
          <Info />
          <AlertTitle>{t.report.limitationsTitle}</AlertTitle>
          <AlertDescription>{report.analysisLimitations}</AlertDescription>
        </Alert>
      )}

      {/* Overview */}
      <Card className="animate-fade-up overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <ScoreRing
            score={score}
            size={132}
            label={scoreBand}
            ariaLabel={format(t.report.scoreOutOf, { score, label: scoreBand })}
          />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight">{t.report.executiveSummary}</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">{report.summary}</p>
          </div>
        </CardContent>
        <div className="grid grid-cols-2 divide-x divide-border border-t sm:grid-cols-4 lg:grid-cols-8">
          {SECTION_KEYS.map((key) => (
            <div key={key} className="px-3 py-4 text-center">
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(report.sections[key].score))}>
                {report.sections[key].score}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {t.report.sections[key].label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Ground-truth signals from the scraper */}
      {report.detectedSignals && report.detectedSignals.length > 0 && (
        <Card className="animate-fade-up animation-delay-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="size-4 text-primary" />
              {t.report.detectedSignals}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
            {report.detectedSignals.map((signal) => {
              const label =
                t.report.signals[signal.key as keyof typeof t.report.signals] ?? signal.key;
              return (
                <div key={signal.key} className="flex items-center gap-2 text-sm">
                  {signal.present ? (
                    <Check className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="size-4 shrink-0 text-red-500" />
                  )}
                  <span className={signal.present ? "" : "text-muted-foreground"}>{label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sections" className="animate-fade-up animation-delay-200">
        <TabsList className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="sections">
            <TrendingUp /> {t.report.tabs.sections}
          </TabsTrigger>
          <TabsTrigger value="problems">
            <AlertTriangle /> {t.report.tabs.problems}
          </TabsTrigger>
          <TabsTrigger value="improvements">
            <Wrench /> {t.report.tabs.improvements}
          </TabsTrigger>
          <TabsTrigger value="rewrites">
            <PenLine /> {t.report.tabs.rewrites}
          </TabsTrigger>
        </TabsList>

        {/* 8 section reviews */}
        <TabsContent forceMount value="sections" className="mt-4 grid gap-4 lg:grid-cols-2">
          {SECTION_KEYS.map((key, i) => (
            <SectionCard key={key} sectionKey={key} review={report.sections[key]} index={i} t={t} />
          ))}
        </TabsContent>

        {/* Top problems */}
        <TabsContent forceMount value="problems" className="mt-4 space-y-3">
          {report.topProblems.map((problem, i) => (
            <Card key={problem.title} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-sm font-bold text-red-500">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{problem.title}</h3>
                    <Badge variant={severityVariant[problem.severity]}>
                      {t.report.severity[problem.severity]}
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

        {/* Priority roadmap: improvements grouped critical → low */}
        <TabsContent forceMount value="improvements" className="mt-4 space-y-6">
          {roadmap.map((group) => (
            <div key={group.priority} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <span className={cn("size-2.5 rounded-full", priorityDot[group.priority])} />
                {t.report.priority[group.priority]}
              </h3>
              {group.items.map((item) => {
                const delay = itemIndex++ * 50;
                return (
                  <Card key={item.title} className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <span
                        className={cn(
                          "mt-1.5 size-2.5 shrink-0 rounded-full",
                          priorityDot[group.priority]
                        )}
                      />
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{item.title}</h4>
                          <Badge variant={impactVariant[item.impact]}>
                            {t.report.impact[item.impact]}
                          </Badge>
                          <Badge variant="outline">{t.report.effort[item.effort]}</Badge>
                          <ConfidenceBadge level={item.confidence} t={t} />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </TabsContent>

        {/* Rewrites: hero, CTA, pricing, FAQ, testimonials */}
        <TabsContent forceMount value="rewrites" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="animate-fade-up">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <PenLine className="size-4 text-primary" /> {t.report.rewrittenHero}
                  </CardTitle>
                  <CardDescription>{t.report.rewrittenHeroNote}</CardDescription>
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
                  <span className="font-medium text-foreground">{t.report.whyItWorks}</span>{" "}
                  {report.rewrittenHero.rationale}
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-up animation-delay-100">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareQuote className="size-4 text-primary" /> {t.report.betterCtas}
                  </CardTitle>
                  <CardDescription>{t.report.betterCtasNote}</CardDescription>
                </div>
                <CopyButton
                  text={`${report.betterCta.primary}\n${report.betterCta.secondary}`}
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
                  <span className="font-medium text-foreground">{t.report.whyItWorks}</span>{" "}
                  {report.betterCta.rationale}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-up animation-delay-200">
            <CardHeader>
              <CardTitle>{t.report.suggestedPricing}</CardTitle>
              <CardDescription>{report.pricingSection.strategy}</CardDescription>
            </CardHeader>
            <CardContent>
              {report.pricingSection.noChangesNeeded || report.pricingSection.tiers.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <Check className="size-5 shrink-0 text-emerald-500" />
                  <p className="text-sm font-medium">{t.report.pricingNoChanges}</p>
                </div>
              ) : (
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
                        {tier.highlighted && <Badge>{t.report.popular}</Badge>}
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
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="animate-fade-up animation-delay-300">
              <CardHeader>
                <CardTitle>{t.report.suggestedFaq}</CardTitle>
                <CardDescription>{t.report.suggestedFaqNote}</CardDescription>
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
                <CardTitle>{t.report.suggestedTestimonials}</CardTitle>
                <CardDescription>{t.report.suggestedTestimonialsNote}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.testimonials.map((item) => (
                  <figure key={item.quote} className="rounded-lg border bg-muted/40 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Quote className="size-4 shrink-0 text-primary" />
                      <Badge variant="warning" className="text-[10px]">
                        {t.report.placeholderBadge}
                      </Badge>
                    </div>
                    <blockquote className="mt-2 text-sm leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{item.name}</span> · {item.role}
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
