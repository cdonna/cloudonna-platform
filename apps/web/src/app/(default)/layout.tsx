import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

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
 * The other independent root layout — see (localized)/[locale]/
 * layout.tsx's comment for why two roots exist at all (Next.js allows
 * exactly one `<html>` per response, so per-locale `lang` requires a
 * true root layout of its own; this group is the static-English
 * counterpart for everything that was never in scope for
 * localization: /app/* (the authenticated dashboard), /discovery, and
 * — via not needing any layout at all, since Route Handlers aren't
 * wrapped by the layout tree — /api/* and /auth/* stay siblings of
 * both groups, unaffected by this split).
 */
export default function DefaultRootLayout({
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
