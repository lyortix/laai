import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function MarketingNavbar() {
  const [user, t] = await Promise.all([
    isSupabaseConfigured() ? getUser() : Promise.resolve(null),
    getDictionary(),
  ]);

  const links = [
    { href: "/#features", label: t.nav.features },
    { href: "/#how-it-works", label: t.nav.howItWorks },
    { href: "/#pricing", label: t.nav.pricing },
    { href: "/#faq", label: t.nav.faq },
    { href: "/blog", label: t.nav.blog },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/75 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">{t.nav.dashboard}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t.common.signIn}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">{t.common.getStarted}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
