import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const t = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.loginSubtitle}</p>
      </div>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
