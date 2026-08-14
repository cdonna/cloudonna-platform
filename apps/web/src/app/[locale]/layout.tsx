import { notFound } from "next/navigation";
import Footer from "@/components/landing/Footer";
import { getDictionary } from "@/i18n/get-dictionary";
import { LangSync } from "@/i18n/LangSync";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/i18n/locales";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * The locale boundary for the 12 Founder-journey pages listed in
 * src/i18n/locales.ts's LOCALIZED_PATH_PREFIXES — everything under
 * here is wrapped in a resolved dictionary via LocaleProvider, so any
 * client component in this subtree can call useLocale() instead of
 * having a dictionary threaded through every prop list by hand.
 * /app/*, /api/*, /auth/*, and /discovery live outside this segment
 * entirely and stay English-only (see the localization report's
 * "KNOWN LIMITATIONS" section).
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  // No wrapping div around {children} + <Footer> — the parent <body>
  // (src/app/layout.tsx) is `flex flex-col`, and Footer needs to stay
  // a direct flex sibling of the page content to reproduce the
  // original sticky-footer behavior (content grows via its own
  // min-h-screen, Footer follows immediately after). Wrapping both in
  // a div here would nest Footer inside a plain block instead.
  return (
    <LocaleProvider locale={locale} dict={dict}>
      <LangSync locale={locale} />
      {children}
      <Footer dict={dict} locale={locale} />
    </LocaleProvider>
  );
}
