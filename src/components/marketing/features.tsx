import {
  Crosshair,
  Gauge,
  LayoutTemplate,
  MousePointerClick,
  Palette,
  PenLine,
  Search,
  Smartphone,
  Type,
} from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";

const icons = [
  LayoutTemplate,
  MousePointerClick,
  Crosshair,
  Gauge,
  Type,
  Palette,
  Search,
  Smartphone,
  PenLine,
];

export async function Features() {
  const t = await getDictionary();
  const f = t.marketing.features;

  return (
    <section id="features" className="scroll-mt-16 border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{f.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{f.subtitle}</p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {f.items.map((feature, i) => {
            const Icon = icons[i] ?? LayoutTemplate;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
