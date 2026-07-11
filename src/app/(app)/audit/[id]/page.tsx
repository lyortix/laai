import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, ExternalLink, RotateCw } from "lucide-react";
import { AutoRefresh } from "@/components/audit/auto-refresh";
import { ReportView } from "@/components/audit/report-view";
import { PublishToggle } from "@/components/roast/publish-toggle";
import { ShareBar } from "@/components/roast/share-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auditReportSchema } from "@/lib/audit/schema";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "@/lib/i18n/format";
import { env } from "@/lib/env";
import { displayUrl, formatDate } from "@/lib/utils";
import type { Audit } from "@/lib/types";

export const metadata: Metadata = { title: "Audit report" };

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const audit = data as Audit;

  const parsedReport =
    audit.status === "complete" && audit.report
      ? auditReportSchema.safeParse(audit.report)
      : null;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 text-muted-foreground">
            <Link href="/history">
              <ArrowLeft /> {t.audit.backToHistory}
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {displayUrl(audit.url)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audit.site_title ? `${audit.site_title} · ` : ""}
            {format(t.audit.auditedOn, { date: formatDate(audit.created_at, locale) })}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={audit.url} target="_blank" rel="noopener noreferrer">
            {t.audit.visitPage} <ExternalLink />
          </a>
        </Button>
      </div>

      {audit.status === "failed" && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle />
          <AlertTitle>{t.audit.failedTitle}</AlertTitle>
          <AlertDescription>
            <p>
              {(audit.error && (t.errors.codes as Record<string, string>)[audit.error]) ||
                audit.error ||
                t.audit.failedFallback}
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/dashboard">
                <RotateCw /> {t.common.tryAgain}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(audit.status === "pending" || audit.status === "running") && (
        <>
          <AutoRefresh />
          <Alert className="animate-fade-in">
            <RotateCw className="animate-spin" />
            <AlertTitle>{t.audit.inProgressTitle}</AlertTitle>
            <AlertDescription>{t.audit.inProgressBody}</AlertDescription>
          </Alert>
        </>
      )}

      {audit.status === "complete" && parsedReport?.success && (
        <>
          <PublishToggle
            auditId={audit.id}
            initialPublic={audit.is_public}
            initialSlug={audit.slug}
          />
          {audit.is_public && audit.slug && (
            <ShareBar
              url={`${env.appUrl}/roast/${audit.slug}`}
              siteLabel={audit.url}
              score={audit.overall_score ?? 0}
              summary={parsedReport.data.summary}
              allowPdf
            />
          )}
        </>
      )}

      {audit.status === "complete" &&
        (parsedReport?.success ? (
          <ReportView report={parsedReport.data} />
        ) : (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle />
            <AlertTitle>{t.audit.unavailableTitle}</AlertTitle>
            <AlertDescription>{t.audit.unavailableBody}</AlertDescription>
          </Alert>
        ))}
    </div>
  );
}
