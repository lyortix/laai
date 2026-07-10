"use client";

import { ExternalLink, Zap } from "lucide-react";
import { BillingActionButton } from "@/components/billing/billing-action-button";
import { useI18n } from "@/lib/i18n/client";

export function UpgradeButton() {
  const { t } = useI18n();
  return (
    <BillingActionButton endpoint="/api/billing/checkout" icon={<Zap />}>
      {t.settings.upgradeToPro}
    </BillingActionButton>
  );
}

export function ManageBillingButton() {
  const { t } = useI18n();
  return (
    <BillingActionButton
      endpoint="/api/billing/portal"
      icon={<ExternalLink />}
      variant="outline"
    >
      {t.settings.manageSubscription}
    </BillingActionButton>
  );
}
