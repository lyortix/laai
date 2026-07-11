"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, FileDown, Link2, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { displayUrl } from "@/lib/utils";

interface ShareBarProps {
  url: string; // absolute public URL of the roast
  siteLabel: string; // the audited site
  score: number;
  summary: string;
  /** Show the "Download PDF" (print) button — only where the full report renders. */
  allowPdf?: boolean;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.61 20.64h2.04L6.49 3.24H4.3z" />
    </svg>
  );
}

export function ShareBar({ url, siteLabel, score, summary, allowPdf = false }: ShareBarProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<"link" | "summary" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function flash(which: "link" | "summary") {
    setCopied(which);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(null), 2000);
  }

  async function copy(text: string, which: "link" | "summary") {
    try {
      await navigator.clipboard.writeText(text);
      flash(which);
    } catch {
      /* clipboard unavailable */
    }
  }

  const shareText = format(t.share.shareText, { site: displayUrl(siteLabel), score });
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => copy(url, "link")}>
        {copied === "link" ? <Check className="text-emerald-500" /> : <Link2 />}
        {copied === "link" ? t.share.linkCopied : t.share.copyLink}
      </Button>
      <Button variant="outline" size="sm" onClick={() => copy(`${shareText}\n${url}`, "summary")}>
        {copied === "summary" ? <Check className="text-emerald-500" /> : <Copy />}
        {copied === "summary" ? t.share.summaryCopied : t.share.copySummary}
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={xUrl} target="_blank" rel="noopener noreferrer">
          <XIcon />
          {t.share.shareX}
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={liUrl} target="_blank" rel="noopener noreferrer">
          <Linkedin />
          {t.share.shareLinkedIn}
        </a>
      </Button>
      {allowPdf && (
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <FileDown />
          {t.share.downloadPdf}
        </Button>
      )}
    </div>
  );
}
