"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the server-rendered page while an audit is running so the report
 * appears the moment it completes — no manual refresh.
 */
export function AutoRefresh({ intervalMs = 4_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
