"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Starts a Stripe Checkout session. Gracefully explains itself when billing
 * isn't enabled on the deployment yet.
 */
export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleUpgrade} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Zap />}
        Upgrade to Pro
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
