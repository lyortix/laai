"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
        <AlertTriangle className="size-6 text-amber-500" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{t.errorPage.title}</h1>
      <p className="max-w-sm text-muted-foreground">{t.errorPage.body}</p>
      <Button onClick={reset} className="mt-2">
        <RotateCw />
        {t.common.tryAgain}
      </Button>
    </div>
  );
}
