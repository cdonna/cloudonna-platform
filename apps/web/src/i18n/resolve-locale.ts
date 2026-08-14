import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "./locales";

/**
 * Pure so it's directly unit-testable without a real NextRequest —
 * middleware.ts is a thin adapter that pulls the cookie/header values
 * out of the request and calls this. Priority: an explicit prior
 * choice (cookie) beats the browser's declared preference (header)
 * beats the hard default, matching normal i18n-middleware convention
 * and never overriding a user's own past selection with what their
 * browser happens to send.
 */
export function resolveLocale(cookieValue: string | undefined | null, acceptLanguageHeader: string | undefined | null): Locale {
  if (isSupportedLocale(cookieValue)) return cookieValue;

  const fromHeader = parseAcceptLanguage(acceptLanguageHeader);
  if (fromHeader) return fromHeader;

  return DEFAULT_LOCALE;
}

/** "de-CH,de;q=0.9,fr;q=0.8,en;q=0.5" -> "de" — takes the highest-q
 * supported tag, falling back to its base language (de-CH -> de) when
 * the exact region tag isn't one we ship. */
export function parseAcceptLanguage(header: string | undefined | null): Locale | null {
  if (!header) return null;

  const tags = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const q = qPart ? Number(qPart) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    if (isSupportedLocale(tag)) return tag;
    const base = tag.split("-")[0];
    if (isSupportedLocale(base)) return base;
  }
  return null;
}
