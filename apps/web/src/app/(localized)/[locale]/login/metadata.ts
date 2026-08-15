import type { Metadata } from "next";
// Relative, not "@/..." — no path-alias resolution is configured in
// vitest.config.mts (only Next.js's own bundler reads tsconfig
// `paths`), and this module is specifically meant to be importable
// directly from a plain Vitest test (see the __tests__ directory
// alongside login/signup).
import { getDictionary } from "../../../../i18n/get-dictionary";
import { isSupportedLocale } from "../../../../i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "../../../../i18n/seo";

/** Kept in its own module (no next/navigation import, unlike page.tsx,
 * which also needs `notFound`) specifically so it's directly testable
 * from a plain Vitest test — importing page.tsx itself transitively
 * pulls in next/navigation, which doesn't initialize correctly outside
 * a real Next.js render (same issue LanguageSwitcher.tsx's own test
 * hit earlier; see path-with-locale.ts for the identical fix). */
export async function generateLoginMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.login.h1} — ClouDonna`;
  const description = dict.login.sub;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/login"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}
