import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export function Pricing() {
  const plans = [PLANS.free, PLANS.pro];

  return (
    <section id="pricing" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing, serious ROI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One recovered visitor pays for a year of Pro.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const highlighted = plan.id === "pro";
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-8",
                  highlighted && "border-primary/50 shadow-xl shadow-primary/10"
                )}
              >
                {highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most popular
                  </Badge>
                )}
                <h3 className="font-semibold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.priceHint}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8"
                  variant={highlighted ? "default" : "outline"}
                >
                  <Link href="/signup">
                    {highlighted ? "Start with Pro" : "Start for free"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
