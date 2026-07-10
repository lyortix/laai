import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteAuditButton } from "@/components/audit/delete-audit-button";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { cn, displayUrl, formatDate, scoreColor } from "@/lib/utils";
import type { AuditListItem } from "@/lib/types";

interface AuditCardProps {
  audit: AuditListItem;
  /** Show the delete action (used on the history page). */
  deletable?: boolean;
}

/**
 * One row in the audit history / recent list. Uses a stretched-link overlay
 * so the whole card is clickable while the delete button stays interactive.
 */
export async function AuditCard({ audit, deletable = false }: AuditCardProps) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const failed = audit.status === "failed";
  const complete = audit.status === "complete";
  const label = displayUrl(audit.url);

  // Failed audits store a locale-independent code when available; fall back
  // to raw text for rows created before codes existed.
  const codes = t.errors.codes as Record<string, string>;
  const failureText = failed
    ? (audit.error && codes[audit.error]) || audit.error || t.history.failedFallback
    : null;

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-all",
        complete && "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {complete ? (
            <Link
              href={`/audit/${audit.id}`}
              className="truncate font-medium after:absolute after:inset-0 after:content-['']"
            >
              {label}
            </Link>
          ) : (
            <p className="truncate font-medium">{label}</p>
          )}
          {failed && (
            <Badge variant="danger" className="shrink-0">
              <AlertTriangle />
              {t.history.failed}
            </Badge>
          )}
          {!failed && !complete && (
            <Badge variant="warning" className="shrink-0">
              <Clock />
              {audit.status}
            </Badge>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {failed ? failureText : audit.site_title || formatDate(audit.created_at, locale)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          {formatDate(audit.created_at, locale)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {complete && audit.overall_score !== null && (
          <span
            className={cn("text-2xl font-bold tabular-nums", scoreColor(audit.overall_score))}
          >
            {audit.overall_score}
          </span>
        )}
        {complete && (
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        )}
        {deletable && <DeleteAuditButton auditId={audit.id} label={label} />}
      </div>
    </div>
  );
}
