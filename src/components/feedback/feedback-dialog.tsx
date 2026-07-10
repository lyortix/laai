"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquarePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = ["suggestion", "bug", "feature", "other"] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export function FeedbackDialog() {
  const { t } = useI18n();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function reset() {
    setType("suggestion");
    setRating(null);
    setMessage("");
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rating, message: message.trim(), page: pathname }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
          <MessageSquarePlus />
          {t.feedback.button}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t.common.close}>
        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <DialogTitle>{t.feedback.successTitle}</DialogTitle>
            <DialogDescription>{t.feedback.successBody}</DialogDescription>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="mt-2">
              {t.common.close}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.feedback.title}</DialogTitle>
              <DialogDescription>{t.feedback.description}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t.feedback.typeLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TYPES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setType(option)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        type === option
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {t.feedback.types[option]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.feedback.ratingLabel}</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={format(t.feedback.starAria, { n })}
                      aria-pressed={rating !== null && n <= rating}
                      onClick={() => setRating(rating === n ? null : n)}
                      className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        className={cn(
                          "size-6 transition-colors",
                          rating !== null && n <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/40"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message">{t.feedback.messageLabel}</Label>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder={t.feedback.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-destructive">{t.feedback.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={status === "sending" || !message.trim()}>
                {status === "sending" && <Loader2 className="animate-spin" />}
                {status === "sending" ? t.feedback.sending : t.feedback.submit}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
