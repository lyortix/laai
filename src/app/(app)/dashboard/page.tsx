import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Gauge, TrendingUp } from "lucide-react";
import { AuditCard } from "@/components/audit/audit-card";
import { UrlForm } from "@/components/audit/url-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getQuota } from "@/lib/audit/quota";
import { getDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/server";
import { AUDIT_LIST_COLUMNS, type AuditListItem } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, quota, { data: audits }] = await Promise.all([
    getDictionary(),
    getQuota(supabase, user.id),
    supabase
      .from("audits")
      .select(AUDIT_LIST_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recent = (audits ?? []) as AuditListItem[];
  const completed = recent.filter((a) => a.status === "complete" && a.overall_score !== null);
  const bestScore = completed.length
    ? Math.max(...completed.map((a) => a.overall_score ?? 0))
    : null;

  return (
    <div className="space-y-10">
      <section className="animate-fade-up space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <UrlForm quotaExceeded={quota.exceeded} remaining={quota.remaining} />
      </section>

      <section className="animate-fade-up animation-delay-200 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{quota.used}</p>
              <p className="text-sm text-muted-foreground">{t.dashboard.auditsThisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gauge className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {quota.limit === null ? "∞" : quota.remaining}
              </p>
              <p className="text-sm text-muted-foreground">
                {quota.limit === null
                  ? format(t.dashboard.unlimitedOn, { plan: t.plans.pro.name })
                  : t.dashboard.auditsRemaining}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{bestScore ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{t.dashboard.bestScore}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="animate-fade-up animation-delay-300 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t.dashboard.recentAudits}</h2>
          {recent.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">
                {t.dashboard.viewAll} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <Flame className="size-8 text-muted-foreground/50" />
              <p className="font-medium">{t.dashboard.emptyTitle}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t.dashboard.emptyBody}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((audit) => (
              <AuditCard key={audit.id} audit={audit} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
