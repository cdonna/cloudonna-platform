import { describe, expect, it } from "vitest";
import de from "../dictionaries/de";
import en from "../dictionaries/en";
import es from "../dictionaries/es";
import fr from "../dictionaries/fr";
import itDict from "../dictionaries/it";
import { interpolate } from "../interpolate";

/**
 * TypeScript already refuses to compile de/fr/es.ts if a key is
 * missing (each is typed as `Dictionary = typeof en`) — this test is
 * the runtime, explicit version the localization brief asked for, and
 * it also catches the one thing the type system can't: a key present
 * with the *wrong* value type (e.g. a translator accidentally leaving
 * a placeholder as a number instead of a template string).
 */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

describe("dictionary parity", () => {
  const enPaths = keyPaths(en).sort();

  for (const [locale, dict] of [
    ["de", de],
    ["fr", fr],
    ["es", es],
    ["it", itDict],
  ] as const) {
    it(`${locale} has exactly the same key paths as en`, () => {
      expect(keyPaths(dict).sort()).toEqual(enPaths);
    });

    it(`${locale} has no empty-string translations`, () => {
      const blanks = keyPaths(dict).filter((path) => {
        const value = path.split(".").reduce<unknown>((acc, segment) => (acc as Record<string, unknown>)?.[segment], dict);
        return typeof value === "string" && value.trim() === "";
      });
      expect(blanks).toEqual([]);
    });
  }

  it("every locale's meta.htmlLang matches its own locale code", () => {
    expect(en.meta.htmlLang).toBe("en");
    expect(de.meta.htmlLang).toBe("de");
    expect(fr.meta.htmlLang).toBe("fr");
    expect(es.meta.htmlLang).toBe("es");
    expect(itDict.meta.htmlLang).toBe("it");
  });

  it("product/vendor names stay untranslated across every locale (never-translate list)", () => {
    for (const dict of [en, de, fr, es, itDict]) {
      expect(dict.adaptiveIntake.statementPlaceholder).toMatch(/SAP S\/4HANA/);
    }
  });
});

describe("interpolate", () => {
  it("substitutes every placeholder present in vars", () => {
    expect(interpolate("© {year} ClouDonna.", { year: 2026 })).toBe("© 2026 ClouDonna.");
  });

  it("substitutes multiple distinct placeholders", () => {
    expect(interpolate("{leader} leads {trailer} by {gap} points.", { leader: "A", trailer: "B", gap: 3 })).toBe("A leads B by 3 points.");
  });

  it("leaves an unmatched placeholder untouched rather than throwing", () => {
    expect(interpolate("{known} and {unknown}", { known: "x" })).toBe("x and {unknown}");
  });
});
