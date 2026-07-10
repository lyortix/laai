import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
        <Compass className="size-6 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{t.notFound.title}</h1>
      <p className="max-w-sm text-muted-foreground">{t.notFound.body}</p>
      <Button asChild className="mt-2">
        <Link href="/">{t.common.backToHome}</Link>
      </Button>
    </div>
  );
}
