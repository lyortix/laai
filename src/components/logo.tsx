import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-sm transition-transform group-hover:scale-105">
        <Flame className="size-4" />
      </span>
      <span>
        LandingRoast <span className="text-muted-foreground font-normal">AI</span>
      </span>
    </Link>
  );
}
