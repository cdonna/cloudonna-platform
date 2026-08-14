import type { Dictionary } from "./dictionary";
import en from "./dictionaries/en";
import type { Locale } from "./locales";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => Promise.resolve(en),
  de: () => import("./dictionaries/de").then((m) => m.default),
  fr: () => import("./dictionaries/fr").then((m) => m.default),
  es: () => import("./dictionaries/es").then((m) => m.default),
  it: () => import("./dictionaries/it").then((m) => m.default),
};

/** Server-side loader — each non-English locale is code-split so a
 * request for one locale never ships the other three dictionaries. */
export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
