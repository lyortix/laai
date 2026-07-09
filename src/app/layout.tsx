import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LandingRoast AI — Landing page audits in 60 seconds",
    template: "%s · LandingRoast AI",
  },
  description:
    "Paste a URL, get a brutally honest AI audit of your landing page: scores, top problems, rewritten copy, and a prioritized action plan — in under 60 seconds.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "LandingRoast AI",
    description: "AI-powered landing page audits in under 60 seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LandingRoast AI",
    description: "AI-powered landing page audits in under 60 seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
