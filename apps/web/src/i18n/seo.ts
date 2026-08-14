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
