"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

export function DeleteAuditButton({ auditId, label }: { auditId: string; label: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(format(t.history.deleteConfirm, { label }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/audits/${auditId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch {
      setDeleting(false);
      window.alert(t.history.deleteFailed);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={format(t.history.deleteAria, { label })}
      className="relative z-10 text-muted-foreground hover:text-destructive"
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
