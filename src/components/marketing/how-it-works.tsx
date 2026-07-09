import { Link2, ScanSearch, FileCheck2 } from "lucide-react";

const steps = [
  {
    icon: Link2,
    step: "01",
    title: "Paste your URL",
    description: "Any public landing page — yours or a competitor's. No code, no analytics access, no setup.",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "AI dissects the page",
    description: "We capture what visitors and search engines actually see, then a CRO-tuned model audits all 8 dimensions.",
  },
  {
    icon: FileCheck2,
    step: "03",
    title: "Get your action plan",
    description: "Scores, top problems, prioritized improvements and ready-to-ship rewritten copy — in under 60 seconds.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From URL to action plan in three steps
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.step} className="relative rounded-xl border bg-card p-6">
              <span className="text-gradient text-sm font-bold">{step.step}</span>
              <div className="mt-4 flex size-11 items-center justify-center rounded-lg border bg-background">
                <step.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
