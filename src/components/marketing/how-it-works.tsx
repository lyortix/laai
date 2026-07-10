import { Link2, ScanSearch, FileCheck2 } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";

const icons = [Link2, ScanSearch, FileCheck2];

export async function HowItWorks() {
  const t = await getDictionary();
  const h = t.marketing.how;

  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{h.title}</h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {h.steps.map((step, i) => {
            const Icon = icons[i] ?? Link2;
            return (
              <div key={step.title} className="relative rounded-xl border bg-card p-6">
                <span className="text-gradient text-sm font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-4 flex size-11 items-center justify-center rounded-lg border bg-background">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
