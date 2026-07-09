"use client";

import { ExternalLink, Zap } from "lucide-react";
import { BillingActionButton } from "@/components/billing/billing-action-button";

export function UpgradeButton() {
  return (
    <BillingActionButton endpoint="/api/billing/checkout" icon={<Zap />}>
      Upgrade to Pro
    </BillingActionButton>
  );
}

export function ManageBillingButton() {
  return (
    <BillingActionButton
      endpoint="/api/billing/portal"
      icon={<ExternalLink />}
      variant="outline"
    >
      Manage subscription
    </BillingActionButton>
  );
}
