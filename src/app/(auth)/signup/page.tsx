import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          3 free audits per month. No credit card required.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
