"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Globe, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ANALYSIS_STEPS = [
  { label: "Fetching your page", at: 0 },
  { label: "Extracting copy, CTAs & metadata", at: 3_000 },
  { label: "Scoring 8 conversion dimensions", at: 7_000 },
  { label: "Rewriting your hero & CTAs", at: 16_000 },
  { label: "Compiling your action plan", at: 26_000 },
] as const;

interface UrlFormProps {
  quotaExceeded?: boolean;
  remaining?: number | null;
}

export function UrlForm({ quotaExceeded = false, remaining = null }: UrlFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<{ message: string; upgrade?: boolean } | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function startStepTimers() {
    setStepIndex(0);
    timersRef.current = ANALYSIS_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setStepIndex(i + 1), step.at)
    );
  }

  function stopStepTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (analyzing) return;

    setError(null);
    setAnalyzing(true);
    startStepTimers();

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        setError({
          message: data.error ?? "Something went wrong. Please try again.",
          upgrade: data.code === "quota_exceeded",
        });
        return;
      }

      setStepIndex(ANALYSIS_STEPS.length - 1);
      router.push(`/audit/${data.id}`);
      // Keep the analyzing state on while the report page loads.
      return;
    } catch {
      setError({ message: "Network error — check your connection and try again." });
    } finally {
      stopStepTimers();
    }

    setAnalyzing(false);
  }

  if (analyzing && !error) {
    return (
      <div className="animate-fade-in rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-5 text-primary" />
            <span className="animate-pulse-glow absolute inset-0 rounded-full ring-2 ring-primary/40" />
          </div>
          <div>
            <p className="font-semibold">Roasting {url.replace(/^https?:\/\//, "")}</p>
            <p className="text-sm text-muted-foreground">
              This usually takes 20–45 seconds. Don&apos;t close the tab.
            </p>
          </div>
        </div>
        <ol className="mt-6 space-y-3">
          {ANALYSIS_STEPS.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <li
                key={step.label}
                className={cn(
                  "flex items-center gap-3 text-sm transition-colors duration-300",
                  done && "text-muted-foreground",
                  active && "font-medium text-foreground",
                  !done && !active && "text-muted-foreground/50"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border transition-colors",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    active && "border-primary"
                  )}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : active ? (
                    <Loader2 className="size-3 animate-spin text-primary" />
                  ) : null}
                </span>
                {step.label}
              </li>
            );
          })}
        </ol>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(92, ((stepIndex + 1) / ANALYSIS_STEPS.length) * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle />
          <AlertTitle>Audit failed</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            {error.upgrade && (
              <Button asChild size="sm" className="mt-2">
                <Link href="/settings">Upgrade to Pro</Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            inputMode="url"
            required
            placeholder="yoursite.com or a competitor's"
            aria-label="Website URL to audit"
            className="h-11 border-0 pl-9 text-base shadow-none focus-visible:ring-0"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={quotaExceeded}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="group sm:w-auto"
          disabled={quotaExceeded || !url.trim()}
        >
          Roast it
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>

      {quotaExceeded ? (
        <p className="text-sm text-muted-foreground">
          You&apos;ve used all your free audits this month.{" "}
          <Link href="/settings" className="font-medium text-foreground underline-offset-4 hover:underline">
            Upgrade to Pro
          </Link>{" "}
          for unlimited audits.
        </p>
      ) : (
        remaining !== null && (
          <p className="text-sm text-muted-foreground">
            {remaining} audit{remaining === 1 ? "" : "s"} remaining this month on
            the free plan.
          </p>
        )
      )}
    </div>
  );
}
