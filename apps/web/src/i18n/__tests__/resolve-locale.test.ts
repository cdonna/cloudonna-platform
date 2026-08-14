import { describe, expect, it } from "vitest";
import { parseAcceptLanguage, resolveLocale } from "../resolve-locale";

describe("parseAcceptLanguage", () => {
  it("picks the highest-quality supported tag", () => {
    expect(parseAcceptLanguage("de-CH,de;q=0.9,fr;q=0.8,en;q=0.5")).toBe("de");
  });

  it("falls back from a region tag to its base language", () => {
    expect(parseAcceptLanguage("fr-CA")).toBe("fr");
  });

  it("resolves Italian, the fifth supported locale", () => {
    expect(parseAcceptLanguage("it-IT,it;q=0.9,en;q=0.5")).toBe("it");
  });

  it("skips an unsupported leading tag for a supported one further down", () => {
    expect(parseAcceptLanguage("pt-PT,es;q=0.8")).toBe("es");
  });

  it("returns null when nothing supported is present", () => {
    expect(parseAcceptLanguage("pt-PT,ja;q=0.8")).toBeNull();
  });

  it("returns null for an empty or missing header", () => {
    expect(parseAcceptLanguage(undefined)).toBeNull();
    expect(parseAcceptLanguage(null)).toBeNull();
    expect(parseAcceptLanguage("")).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("prefers an explicit prior cookie choice over the Accept-Language header", () => {
    expect(resolveLocale("fr", "de-DE,de;q=0.9")).toBe("fr");
  });

  it("ignores an invalid/unsupported cookie value and falls back to the header", () => {
    expect(resolveLocale("xx", "es-ES")).toBe("es");
  });

  it("falls back to the header when there is no cookie", () => {
    expect(resolveLocale(undefined, "de-CH")).toBe("de");
  });

  it("defaults to English when neither cookie nor header resolve to a supported locale", () => {
    expect(resolveLocale(undefined, undefined)).toBe("en");
    expect(resolveLocale(null, "ja-JP")).toBe("en");
  });
});
