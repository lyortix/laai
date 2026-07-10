"use client";

import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_COOKIE, localeFlags, localeNames, locales, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, t } = useI18n();

  function selectLocale(next: Locale) {
    if (next === locale) return;
    // One year, whole site — the proxy only auto-detects when this is absent.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.common.language}>
          <Globe className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((code) => (
          <DropdownMenuItem key={code} onSelect={() => selectLocale(code)}>
            <span aria-hidden="true">{localeFlags[code]}</span>
            {localeNames[code]}
            {code === locale && <Check className="ml-auto size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
