import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n/client";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isTr = locale === "tr";
  const description = isTr
    ? "Bir URL yapıştırın, landing page'iniz için acımasızca dürüst bir yapay zekâ analizi alın: puanlar, en kritik sorunlar, yeniden yazılmış metinler ve önceliklendirilmiş aksiyon planı — 60 saniyeden kısa sürede."
    : "Paste a URL, get a brutally honest AI audit of your landing page: scores, top problems, rewritten copy, and a prioritized action plan — in under 60 seconds.";
  const shortTitle = isTr
    ? "LandingRoast AI — 60 saniyede landing page analizi"
    : "LandingRoast AI — Landing page audits in 60 seconds";

  return {
    title: { default: shortTitle, template: "%s · LandingRoast AI" },
    description,
    metadataBase: new URL(APP_URL),
    // "./" resolves per-route, so every page declares its own official URL —
    // stops query-string/host variants from splitting SEO authority.
    alternates: { canonical: "./" },
    openGraph: { title: "LandingRoast AI", description, type: "website" },
    twitter: { card: "summary_large_image", title: "LandingRoast AI", description },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, dictionary] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          {dictionary.common.skipToContent}
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider locale={locale} dictionary={dictionary}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
