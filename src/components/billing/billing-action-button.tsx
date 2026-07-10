"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

interface BillingActionButtonProps {
  endpoint: string;
  icon?: ReactNode;
  children: ReactNode;
  variant?: "default" | "outline";
}

/**
 * Calls a billing endpoint that returns `{ url }` and redirects the browser
 * there (Stripe Checkout, customer portal, …). Renders API errors inline —
 * including the friendly "billing not enabled" message on unconfigured
 * deployments.
 */
export function BillingActionButton({
  endpoint,
  icon,
  children,
  variant = "default",
}: BillingActionButtonProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? t.settings.billingError);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t.settings.billingNetworkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading} variant={variant}>
        {loading ? <Loader2 className="animate-spin" /> : icon}
        {children}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
