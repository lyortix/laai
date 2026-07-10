import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Check } from "lucide-react";
import { ManageBillingButton, UpgradeButton } from "@/components/billing/upgrade-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getQuota } from "@/lib/audit/quota";
import { PLANS } from "@/lib/billing/plans";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, locale, { data: profileData }, quota] = await Promise.all([
    getDictionary(),
    getLocale(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getQuota(supabase, user.id),
  ]);

  const profile = profileData as Profile | null;
  const usagePct =
    quota.limit === null ? 0 : Math.min(100, (quota.used / quota.limit) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.settings.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      {checkout === "success" && (
        <Alert className="animate-fade-in border-emerald-500/40 bg-emerald-500/5">
          <BadgeCheck className="text-emerald-500" />
          <AlertTitle>{t.settings.checkoutSuccessTitle}</AlertTitle>
          <AlertDescription>{t.settings.checkoutSuccessBody}</AlertDescription>
        </Alert>
      )}
      {checkout === "cancelled" && (
        <Alert className="animate-fade-in">
          <AlertTitle>{t.settings.checkoutCancelledTitle}</AlertTitle>
          <AlertDescription>{t.settings.checkoutCancelledBody}</AlertDescription>
        </Alert>
      )}

      <Card className="animate-fade-up animation-delay-100">
        <CardHeader>
          <CardTitle>{t.settings.profile}</CardTitle>
          <CardDescription>{t.settings.profileNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t.auth.email}</span>
            <span className="truncate font-medium">{user.email}</span>
          </div>
          {profile?.full_name && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t.settings.name}</span>
              <span className="font-medium">{profile.full_name}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t.settings.memberSince}</span>
            <span className="font-medium">
              {formatDate(profile?.created_at ?? user.created_at, locale)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up animation-delay-200">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>{t.settings.planUsage}</CardTitle>
            <CardDescription>
              {quota.limit === null
                ? t.settings.unlimitedNote
                : format(t.settings.usageOf, { used: quota.used, limit: quota.limit })}
            </CardDescription>
          </div>
          <Badge variant={quota.plan === "pro" ? "default" : "secondary"} className="uppercase">
            {t.plans[quota.plan].name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {quota.limit !== null && <Progress value={usagePct} />}

          {quota.plan === "free" ? (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold">{PLANS.pro.price}</span>
                <span className="text-sm text-muted-foreground">{t.plans.pro.priceHint}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {t.plans.pro.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <UpgradeButton />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.settings.proThanks}</p>
              <ManageBillingButton />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
