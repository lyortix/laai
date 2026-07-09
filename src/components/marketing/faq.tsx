import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does the audit work without access to my code?",
    answer:
      "We analyze the publicly served page — the exact HTML your visitors and search engines receive. A CRO-tuned AI model then reviews structure, copy, CTAs, trust signals, SEO and mobile readiness.",
  },
  {
    question: "How long does an audit take?",
    answer:
      "Typically 20–45 seconds, and always under a minute. You'll watch it progress live.",
  },
  {
    question: "Can I audit competitor pages?",
    answer:
      "Yes. Any public URL works — auditing competitors is one of the most popular use cases.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "Three full audits per month with every section unlocked: all 8 scores, top problems, improvements and rewritten copy. No credit card required.",
  },
  {
    question: "Is the rewritten copy actually usable?",
    answer:
      "The hero headline, CTAs, pricing, FAQ and testimonial suggestions are generated specifically for your product and audience — most users ship them with light edits.",
  },
  {
    question: "Do you store my page content?",
    answer:
      "We store the generated report so you can revisit it in your history. Page snapshots are processed transiently for analysis.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-12 divide-y divide-border rounded-xl border bg-card">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 font-medium [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-2 pt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
