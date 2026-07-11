"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

interface PublishToggleProps {
  auditId: string;
  initialPublic: boolean;
  initialSlug: string | null;
}

/** Owner control to publish/unpublish an audit to the public feed. */
export function PublishToggle({ auditId, initialPublic, initialSlug }: PublishToggleProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !isPublic;
    try {
      const res = await fetch(`/api/audits/${auditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: next }),
      });
      if (res.ok) {
        const data = (await res.json()) as { slug?: string };
        setIsPublic(next);
        if (data.slug) setSlug(data.slug);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">
          {isPublic ? <Globe className="size-5 text-emerald-500" /> : <Lock className="size-5" />}
        </div>
        <div>
          <p className="text-sm font-medium">{isPublic ? t.share.makePublic : t.share.title}</p>
          <p className="text-sm text-muted-foreground">
            {isPublic ? t.share.publicHint : t.share.privateHint}
          </p>
          {isPublic && slug && (
            <a
              href={`/roast/${slug}`}
              className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              /roast/{slug}
            </a>
          )}
        </div>
      </div>
      <Button
        variant={isPublic ? "outline" : "default"}
        size="sm"
        onClick={toggle}
        disabled={busy}
        className="shrink-0"
      >
        {busy ? <Loader2 className="animate-spin" /> : isPublic ? <Lock /> : <Globe />}
        {busy ? t.share.publishing : isPublic ? t.share.makePrivate : t.share.makePublic}
      </Button>
    </div>
  );
}
