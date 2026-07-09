import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, displayUrl, formatDate, scoreColor } from "@/lib/utils";
import type { Audit } from "@/lib/types";

/** One row in the audit history / recent list. */
export function AuditCard({ audit }: { audit: Audit }) {
  const failed = audit.status === "failed";
  const complete = audit.status === "complete";

  const inner = (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-all",
        complete && "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{displayUrl(audit.url)}</p>
          {failed && (
            <Badge variant="danger" className="shrink-0">
              <AlertTriangle />
              Failed
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
          {failed
            ? audit.error ?? "The audit could not be completed."
            : audit.site_title || formatDate(audit.created_at)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          {formatDate(audit.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
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
      </div>
    </div>
  );

  if (!complete) return inner;

  return (
    <Link href={`/audit/${audit.id}`} className="block">
      {inner}
    </Link>
  );
}
