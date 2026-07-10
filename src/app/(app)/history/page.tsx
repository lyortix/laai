import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { AuditCard } from "@/components/audit/audit-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { AUDIT_LIST_COLUMNS, type AuditListItem } from "@/lib/types";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getDictionary();
  const { data } = await supabase
    .from("audits")
    .select(AUDIT_LIST_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const audits = (data ?? []) as AuditListItem[];

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.history.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.history.subtitle}</p>
      </div>

      {audits.length === 0 ? (
        <Card className="animate-fade-up animation-delay-100">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Flame className="size-8 text-muted-foreground/50" />
            <p className="font-medium">{t.history.emptyTitle}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t.history.emptyBody}</p>
            <Button asChild className="mt-2">
              <Link href="/dashboard">{t.history.runAudit}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-up animation-delay-100 space-y-3">
          {audits.map((audit) => (
            <AuditCard key={audit.id} audit={audit} deletable />
          ))}
        </div>
      )}
    </div>
  );
}
