import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Premium empty state with a soft illustrated glow. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="animate-fade-up overflow-hidden">
      <CardContent className="relative flex flex-col items-center gap-3 p-12 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
          <Flame className="size-6 text-primary" />
          <span className="animate-pulse-glow absolute inset-0 rounded-2xl ring-2 ring-primary/20" />
        </div>
        <p className="relative font-medium">{title}</p>
        <p className="relative max-w-sm text-sm text-muted-foreground">{body}</p>
        {action && <div className="relative mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
