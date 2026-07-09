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

const features = [
  {
    icon: LayoutTemplate,
    title: "Hero section review",
    description: "Is your value proposition obvious in 5 seconds? We score clarity, specificity and hook strength.",
  },
  {
    icon: MousePointerClick,
    title: "CTA analysis",
    description: "Button copy, placement and prominence — plus rewritten CTAs you can ship today.",
  },
  {
    icon: Crosshair,
    title: "Conversion flow",
    description: "Where friction kills momentum: objection handling, persuasion structure, and page order.",
  },
  {
    icon: Gauge,
    title: "Trust signals",
    description: "Social proof, guarantees and credibility markers — are they present, and do they land in time?",
  },
  {
    icon: Type,
    title: "Typography",
    description: "Hierarchy, scannability and readability, inferred straight from your markup.",
  },
  {
    icon: Palette,
    title: "Color & contrast",
    description: "Palette cohesion and WCAG contrast issues that quietly cost you conversions.",
  },
  {
    icon: Search,
    title: "SEO essentials",
    description: "Meta tags, heading semantics, structured data and everything search engines see first.",
  },
  {
    icon: Smartphone,
    title: "Mobile readiness",
    description: "Viewport config, tap targets and copy density for the majority of your traffic.",
  },
  {
    icon: PenLine,
    title: "Rewritten copy",
    description: "A new hero headline, better CTAs, suggested pricing, FAQ and testimonials — tailored to your product.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Eight dimensions. One honest score.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every audit covers the full anatomy of a high-converting landing
            page — and tells you exactly what to fix first.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
