"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

interface AppNavProps {
  email: string;
  plan: Plan;
  isAdmin?: boolean;
}

export function AppNav({ email, plan, isAdmin = false }: AppNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const initial = (email[0] ?? "?").toUpperCase();

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/history", label: t.nav.history, icon: History },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <FeedbackDialog />
          {isAdmin ? (
            <Badge className="border-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500 uppercase text-white">
              admin
            </Badge>
          ) : (
            <Badge variant={plan === "pro" ? "default" : "secondary"} className="uppercase">
              {plan}
            </Badge>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t.common.accountMenu}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
            >
              {initial}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="sm:hidden">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                      <item.icon />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem asChild>
                <form action="/auth/signout" method="post" className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut />
                    {t.common.signOut}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
