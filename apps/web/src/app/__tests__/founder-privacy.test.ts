import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import de from "../../i18n/dictionaries/de";
import en from "../../i18n/dictionaries/en";
import es from "../../i18n/dictionaries/es";
import fr from "../../i18n/dictionaries/fr";
// Aliased — the Italian dictionary's default export is named `it`,
// which collides with vitest's own `it` test function.
import itDict from "../../i18n/dictionaries/it";

/**
 * Public-surface privacy regression check (brief §31). For this
 * release, the founder must not be publicly identifiable: no name, no
 * personal LinkedIn/social URL, no Person schema, no personal
 * employment history, anywhere a search engine or visitor can reach.
 *
 * Deliberately scoped to the public marketing/SEO surfaces this file
 * can see from inside the app bundle — the five locale dictionaries
 * (every public page's copy, including the new Company page), and the
 * two Organization JSON-LD blocks in the root layouts. It does NOT
 * scan internal docs/ or founder-only, auth-gated app code
 * (src/app/(default)/founder/*), where "founder" legitimately appears
 * as the name of the internal admin area and the role, not as a public
 * identity leak — see that route's own layout.tsx ("Founder Control is
 * restricted").
 *
 * This test is intentionally cheap to keep green: it does not need a
 * name list, because the one thing it must never do is encode a real
 * name into the test itself (that would be the exact exposure this
 * test exists to prevent, just moved into a test file). Instead it
 * checks for the *shapes* a founder-identifying leak would take.
 */

const DICTIONARIES: Array<[string, unknown]> = [
  ["en", en],
  ["de", de],
  ["fr", fr],
  ["es", es],
  ["it", itDict],
];

function flattenStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) flattenStrings(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) flattenStrings(item, out);
  }
  return out;
}

const LINKEDIN_PERSONAL_PROFILE = /linkedin\.com\/in\//i;
const PERSONAL_PRONOUN_BIO_PATTERN = /\b(he|she|they)\s+(founded|is\s+the\s+founder|previously\s+worked|spent\s+\d+\s+years)/i;

describe("Founder privacy — public dictionaries", () => {
  for (const [locale, dict] of DICTIONARIES) {
    const strings = flattenStrings(dict);
    const joined = strings.join("\n");

    it(`${locale}: contains no personal LinkedIn profile URL`, () => {
      expect(joined).not.toMatch(LINKEDIN_PERSONAL_PROFILE);
    });

    it(`${locale}: contains no third-person founder biography sentence`, () => {
      expect(joined).not.toMatch(PERSONAL_PRONOUN_BIO_PATTERN);
    });

    it(`${locale}: every mention of "founder" is institutional, not a named individual`, () => {
      // Acceptable: "founder-led", "founder/legal confirmation", "Founding
      // Tester", "founded from experience" — a role or generic noun, never
      // a proper name immediately beside it. This heuristic fails if a
      // capitalized two-word name sits directly next to "founder" (e.g.
      // "founder Jane Doe" or "Jane Doe, founder").
      //
      // No `/i` flag: the capitalization check is the whole point, so
      // both cases of each role word are spelled out explicitly instead
      // of relying on a case-insensitive flag that would also blunt the
      // [A-Z] name-shape check.
      const roleWords = "(?:[Ff]ounder|[Ff]ondateur|[Ff]ondatrice|[Ff]ondatore|[Ff]undador|[Gg]ründer)";
      const nameAdjacentToFounder = new RegExp(`\\b${roleWords}\\b[,:]?\\s+[A-ZÄÖÜÀÉÈÎ][a-zäöüàéèî]+\\s+[A-ZÄÖÜÀÉÈÎ][a-zäöüàéèî]+`);
      const reversed = new RegExp(`[A-ZÄÖÜÀÉÈÎ][a-zäöüàéèî]+\\s+[A-ZÄÖÜÀÉÈÎ][a-zäöüàéèî]+,?\\s+\\b${roleWords}\\b`);
      expect(joined).not.toMatch(nameAdjacentToFounder);
      expect(joined).not.toMatch(reversed);
    });
  }
});

describe("Founder privacy — structured data", () => {
  const layoutFiles = [
    path.join(__dirname, "..", "(default)", "layout.tsx"),
    path.join(__dirname, "..", "(localized)", "[locale]", "layout.tsx"),
  ];

  for (const file of layoutFiles) {
    it(`${path.basename(path.dirname(file))}/layout.tsx carries no Person schema or sameAs links`, () => {
      const content = fs.readFileSync(file, "utf-8");
      // Scoped to the actual JSON-LD object literal, not the whole
      // file — this file's own explanatory comments legitimately say
      // "no sameAs links" / "no founder Person record" in prose, which
      // must not itself fail the check.
      const jsonLdBlockMatch = content.match(/const organizationJsonLd = \{[\s\S]*?\n\};/);
      expect(jsonLdBlockMatch).not.toBeNull();
      const jsonLdSource = jsonLdBlockMatch![0];
      expect(jsonLdSource).not.toMatch(/"@type"\s*:\s*"Person"/);
      expect(jsonLdSource).not.toMatch(/sameAs/i);
      expect(jsonLdSource).not.toMatch(LINKEDIN_PERSONAL_PROFILE);
      expect(jsonLdSource).not.toMatch(/founder/i);
    });
  }
});

describe("Founder privacy — no public about/team page names anyone", () => {
  it("the Company page dictionary section never pairs a role with a proper name", () => {
    for (const [, dict] of DICTIONARIES) {
      const companyPage = (dict as { companyPage?: unknown }).companyPage;
      expect(companyPage).toBeDefined();
      const strings = flattenStrings(companyPage);
      const joined = strings.join("\n");
      expect(joined).not.toMatch(LINKEDIN_PERSONAL_PROFILE);
      expect(joined).not.toMatch(/\b(?:[Cc][Ee][Oo]|[Ff]ounder|[Ff]ondateur|[Ff]ondatrice|[Ff]ondatore|[Ff]undador|[Gg]ründer)\b[,:]?\s+[A-ZÄÖÜÀÉÈÎ][a-zäöüàéèî]+\s+[A-ZÄÖÜÀÉÈÎ][a-zäöüàéèî]+/);
    }
  });
});
