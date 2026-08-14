export const SUPPORTED_LOCALES = ["en", "de", "fr", "es", "it"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/** Never machine-translated placeholders — the display name a human
 * reads in the switcher, in that language's own script. */
export const LOCALE_LABELS: Record<Locale, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  fr: { name: "Français", flag: "🇫🇷" },
  es: { name: "Español", flag: "🇪🇸" },
  it: { name: "Italiano", flag: "🇮🇹" },
};

export function isSupportedLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Routes that exist in a locale-prefixed form (see src/app/[locale]/).
 * Everything else — /app/*, /api/*, /auth/*, /discovery — stays
 * unprefixed and English-only; see the localization report's "KNOWN
 * LIMITATIONS" section for why those were excluded from this pass.
 * Paths are the *unprefixed* pathname shape used to decide whether a
 * bare request should be redirected into a locale.
 */
export const LOCALIZED_PATH_PREFIXES = [
  "", // home
  "/donna-ai",
  "/contact",
  "/early-access",
  "/for-partners",
  "/for-vendors",
  "/independence",
  "/login",
  "/signup",
  "/privacy",
  "/imprint",
  "/terms",
] as const;

export function isLocalizedPath(pathname: string): boolean {
  return LOCALIZED_PATH_PREFIXES.some((prefix) =>
    prefix === "" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
