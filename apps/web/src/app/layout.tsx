import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.cdonna.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ClouDonna — Enterprise Decision Intelligence",
  description:
    "ClouDonna helps you make enterprise technology decisions you can defend — backed by evidence, not opinion.",
  openGraph: {
    siteName: "ClouDonna",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ClouDonna",
  url: SITE_URL,
  logo: `${SITE_URL}/cloudonna-favicon-512.png`,
};

/**
 * The one true root layout — the only place `<html>`/`<body>` are
 * defined, so it has to serve every route, localized and not
 * (/app/*, /api/*, /auth/*, /discovery stay English-only and render
 * directly through here; see src/i18n/locales.ts's
 * LOCALIZED_PATH_PREFIXES for what's in scope). `lang="en"` is the
 * correct static default for those routes and for the pre-hydration
 * paint of a localized one; src/app/[locale]/layout.tsx corrects
 * `document.documentElement.lang` client-side for de/fr/es requests
 * immediately on mount — see the localization report's "ACCESSIBILITY
 * STATUS" section for the honest disclosure on what that does and
 * doesn't cover. Footer is rendered per-branch (translated inside
 * [locale]/layout.tsx, English here) rather than globally, since a
 * global Footer here would have no locale to translate into for the
 * /app/* dashboard case anyway.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
