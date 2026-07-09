"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteAuditButton({ auditId, label }: { auditId: string; label: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete the audit for ${label}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/audits/${auditId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch {
      setDeleting(false);
      window.alert("Could not delete the audit. Please try again.");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Delete audit for ${label}`}
      className="relative z-10 text-muted-foreground hover:text-destructive"
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
