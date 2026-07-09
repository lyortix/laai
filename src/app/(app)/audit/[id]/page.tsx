import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, ExternalLink, RotateCw } from "lucide-react";
import { ReportView } from "@/components/audit/report-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auditReportSchema } from "@/lib/audit/schema";
import { createClient } from "@/lib/supabase/server";
import { displayUrl, formatDate } from "@/lib/utils";
import type { Audit } from "@/lib/types";

export const metadata: Metadata = { title: "Audit report" };

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
              <ArrowLeft /> Back to history
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {displayUrl(audit.url)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audit.site_title ? `${audit.site_title} · ` : ""}
            Audited {formatDate(audit.created_at)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={audit.url} target="_blank" rel="noopener noreferrer">
            Visit page <ExternalLink />
          </a>
        </Button>
      </div>

      {audit.status === "failed" && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle />
          <AlertTitle>This audit failed</AlertTitle>
          <AlertDescription>
            <p>{audit.error ?? "Something went wrong while analyzing this page."}</p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/dashboard">
                <RotateCw /> Try again
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(audit.status === "pending" || audit.status === "running") && (
        <Alert className="animate-fade-in">
          <RotateCw className="animate-spin" />
          <AlertTitle>Audit in progress</AlertTitle>
          <AlertDescription>
            This audit is still running. Refresh the page in a few seconds.
          </AlertDescription>
        </Alert>
      )}

      {audit.status === "complete" &&
        (parsedReport?.success ? (
          <ReportView report={parsedReport.data} />
        ) : (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle />
            <AlertTitle>Report unavailable</AlertTitle>
            <AlertDescription>
              This report could not be loaded. Please run the audit again.
            </AlertDescription>
          </Alert>
        ))}
    </div>
  );
}
