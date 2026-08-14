import type { Metadata } from "next";
import { SUPPORTED_LOCALES, type Locale } from "./locales";

/**
 * Builds the `alternates` block every localized page's metadata needs
 * — a canonical URL for the current locale plus an hreflang entry for
 * every other locale (and an `x-default` pointing at English), so
 * search engines see these as language variants of one page rather
 * than duplicate content. `path` is the unprefixed route
 * (`""` for home, `"/contact"`, etc.) — the same shape as
 * LOCALIZED_PATH_PREFIXES.
 */
export function localizedAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = { "x-default": `/en${path}` };
  for (const l of SUPPORTED_LOCALES) {
    languages[l] = `/${l}${path}`;
  }
  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}

/** OpenGraph's `og:locale` wants the underscore `xx_XX` form, not the
 * bare BCP-47 codes `SUPPORTED_LOCALES` uses everywhere else in this
 * app — this is the one place that translation happens. */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  it: "it_IT",
};

/**
 * Every localized page must set its own `openGraph.locale` — the root
 * layout (src/app/layout.tsx) only provides a static English fallback
 * for the truly unlocalized routes (/app, /api, /auth, /discovery),
 * and Next.js does not deep-merge a child's `openGraph` object into
 * the parent's, so any localized page that omits this entirely
 * inherits the parent's `en_US` verbatim regardless of its own
 * locale. Found and fixed as part of the Founder Release Gate: only
 * the homepage previously set this, and even then with a bare `de`
 * instead of the OG-correct `de_DE`.
 */
export function localizedOpenGraph(locale: Locale, title: string, description: string): NonNullable<Metadata["openGraph"]> {
  return {
    siteName: "ClouDonna",
    type: "website",
    locale: OG_LOCALE[locale],
    alternateLocale: SUPPORTED_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    title,
    description,
  };
}
