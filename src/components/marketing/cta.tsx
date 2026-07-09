import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white sm:px-16">
          <div className="bg-grid absolute inset-0 opacity-20" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to hear the truth about your landing page?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-white/85">
              Your first roast is free. It takes less time than reading this
              sentence twice.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group mt-8 bg-white text-gray-900 hover:bg-white/90"
            >
              <Link href="/signup">
                Get my free audit
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
