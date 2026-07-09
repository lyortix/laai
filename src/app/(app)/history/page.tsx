import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { AuditCard } from "@/components/audit/audit-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Audit } from "@/lib/types";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const audits = (data ?? []) as Audit[];

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Audit history</h1>
        <p className="mt-1 text-muted-foreground">
          Every roast you&apos;ve run, newest first.
        </p>
      </div>

      {audits.length === 0 ? (
        <Card className="animate-fade-up animation-delay-100">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Flame className="size-8 text-muted-foreground/50" />
            <p className="font-medium">Nothing here yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Run your first audit and it&apos;ll appear here with its score and
              full report.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard">Run an audit</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-up animation-delay-100 space-y-3">
          {audits.map((audit) => (
            <AuditCard key={audit.id} audit={audit} />
          ))}
        </div>
      )}
    </div>
  );
}
