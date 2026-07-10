import { ChevronDown } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";

export async function Faq() {
  const t = await getDictionary();
  const f = t.marketing.faq;

  return (
    <section id="faq" className="scroll-mt-16 border-t border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{f.title}</h2>
        <div className="mt-12 divide-y divide-border rounded-xl border bg-card">
          {f.items.map((faq) => (
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
