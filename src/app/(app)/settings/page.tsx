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

  const [{ data: profileData }, quota] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getQuota(supabase, user.id),
  ]);

  const profile = profileData as Profile | null;
  const plan = PLANS[quota.plan];
  const usagePct =
    quota.limit === null ? 0 : Math.min(100, (quota.used / quota.limit) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Your account and billing.</p>
      </div>

      {checkout === "success" && (
        <Alert className="animate-fade-in border-emerald-500/40 bg-emerald-500/5">
          <BadgeCheck className="text-emerald-500" />
          <AlertTitle>Welcome to Pro!</AlertTitle>
          <AlertDescription>
            Your subscription is active. It may take a few seconds for your plan
            to update.
          </AlertDescription>
        </Alert>
      )}
      {checkout === "cancelled" && (
        <Alert className="animate-fade-in">
          <AlertTitle>Checkout cancelled</AlertTitle>
          <AlertDescription>
            No charge was made. Upgrade any time below.
          </AlertDescription>
        </Alert>
      )}

      <Card className="animate-fade-up animation-delay-100">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Managed through your sign-in provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate font-medium">{user.email}</span>
          </div>
          {profile?.full_name && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{profile.full_name}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {formatDate(profile?.created_at ?? user.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up animation-delay-200">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Plan &amp; usage</CardTitle>
            <CardDescription>
              {quota.limit === null
                ? "Unlimited audits, every month."
                : `${quota.used} of ${quota.limit} audits used this month.`}
            </CardDescription>
          </div>
          <Badge variant={quota.plan === "pro" ? "default" : "secondary"} className="uppercase">
            {plan.name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {quota.limit !== null && <Progress value={usagePct} />}

          {quota.plan === "free" ? (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold">{PLANS.pro.price}</span>
                <span className="text-sm text-muted-foreground">{PLANS.pro.priceHint}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {PLANS.pro.features.map((feature) => (
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
              <p className="text-sm text-muted-foreground">
                You&apos;re on Pro — thanks for supporting LandingRoast! Update
                your payment method or cancel any time via the customer portal.
              </p>
              <ManageBillingButton />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
