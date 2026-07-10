import Link from "next/link";
import { Logo } from "@/components/logo";
import { getDictionary } from "@/lib/i18n/server";

export async function MarketingFooter() {
  const t = await getDictionary();
  const f = t.marketing.footer;

  const columns = [
    {
      title: f.product,
      links: [
        { label: t.nav.features, href: "/#features" },
        { label: t.nav.howItWorks, href: "/#how-it-works" },
        { label: t.nav.pricing, href: "/#pricing" },
        { label: t.nav.faq, href: "/#faq" },
        { label: t.nav.blog, href: "/blog" },
      ],
    },
    {
      title: f.account,
      links: [
        { label: t.common.signIn, href: "/login" },
        { label: f.createAccount, href: "/signup" },
        { label: t.nav.dashboard, href: "/dashboard" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">{f.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-10">
            {columns.map((col) => (
              <div key={col.title} className="space-y-3">
                <h4 className="text-sm font-semibold">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          © {new Date().getFullYear()} LandingRoast AI. {f.rights}
        </p>
      </div>
    </footer>
  );
}
