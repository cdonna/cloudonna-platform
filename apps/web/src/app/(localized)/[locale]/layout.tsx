import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Footer from "@/components/landing/Footer";
import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/i18n/locales";
import "../../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = "https://www.cdonna.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ClouDonna",
  url: SITE_URL,
  logo: `${SITE_URL}/cloudonna-favicon-512.png`,
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * An independent root layout — this and (default)/layout.tsx are the
 * only two places `<html>`/`<body>` are defined anywhere in the app,
 * split via Next.js route groups specifically so each can set its own
 * `<html lang>` at the server-rendered first byte. That's the reason
 * this exists as its own root rather than nesting inside a single
 * shared one: Next.js allows exactly one `<html>` per response, and a
 * layout nested under an existing root cannot override it — only a
 * true root (which this now is, for every path under `[locale]`) can.
 * Before this, `lang` was a static "en" corrected client-side after
 * hydration (see the deleted LangSync.tsx) — a real, disclosed gap;
 * this replaces that correction with the genuine SSR-correct value.
 *
 * /app/*, /api/*, /auth/*, and /discovery live in the sibling
 * (default) group and never render through here — see that layout's
 * own comment for why they still need their own `<html>` too.
 */
export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <LocaleProvider locale={locale} dict={dict}>
          {children}
          <Footer dict={dict} locale={locale} />
        </LocaleProvider>
      </body>
    </html>
  );
}
