import { describe, expect, it } from "vitest";
import { localizedAlternates, localizedOpenGraph } from "../seo";
import { SUPPORTED_LOCALES } from "../locales";

describe("localizedOpenGraph", () => {
  it("uses the correct xx_XX og:locale format for every supported locale", () => {
    expect(localizedOpenGraph("en", "t", "d").locale).toBe("en_US");
    expect(localizedOpenGraph("de", "t", "d").locale).toBe("de_DE");
    expect(localizedOpenGraph("fr", "t", "d").locale).toBe("fr_FR");
    expect(localizedOpenGraph("es", "t", "d").locale).toBe("es_ES");
    expect(localizedOpenGraph("it", "t", "d").locale).toBe("it_IT");
  });

  it("lists every other locale as an alternate, never itself", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const og = localizedOpenGraph(locale, "t", "d");
      expect(og.alternateLocale).toHaveLength(SUPPORTED_LOCALES.length - 1);
      expect(og.alternateLocale).not.toContain(og.locale);
    }
  });

  it("carries the given title/description through unchanged", () => {
    const og = localizedOpenGraph("de", "Kontakt — ClouDonna", "Beschreibung");
    expect(og.title).toBe("Kontakt — ClouDonna");
    expect(og.description).toBe("Beschreibung");
  });
});

describe("localizedAlternates", () => {
  it("includes every locale plus x-default, and a matching canonical", () => {
    const alt = localizedAlternates("de", "/contact");
    expect(alt?.canonical).toBe("/de/contact");
    const languages = alt?.languages as Record<string, string>;
    expect(languages["x-default"]).toBe("/en/contact");
    for (const locale of SUPPORTED_LOCALES) {
      expect(languages[locale]).toBe(`/${locale}/contact`);
    }
  });
});
