import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import de from "../../../i18n/dictionaries/de";
import en from "../../../i18n/dictionaries/en";
import es from "../../../i18n/dictionaries/es";
import fr from "../../../i18n/dictionaries/fr";
import itDict from "../../../i18n/dictionaries/it";

/**
 * CTA architecture consistency (brief §20/§36). No render harness
 * exists in this codebase (no @testing-library/react) — consistent
 * with every other UI-adjacent test here, this checks the actual
 * source of the component that builds the CTA hrefs, and the real
 * dictionary content every locale renders, rather than a rendered
 * DOM snapshot.
 */
const COMMERCIAL_PATHS_SOURCE = fs.readFileSync(path.join(__dirname, "..", "CommercialPaths.tsx"), "utf-8");

describe("CommercialPaths CTA routing", () => {
  it("routes Decision Sprint to its own dedicated inquiry type, never founding_tester", () => {
    expect(COMMERCIAL_PATHS_SOURCE).toContain("contact?type=decision_sprint");
    expect(COMMERCIAL_PATHS_SOURCE).not.toContain("type=founding_tester");
  });

  it("routes Team and Enterprise to their own inquiry types", () => {
    expect(COMMERCIAL_PATHS_SOURCE).toContain("contact?type=team");
    expect(COMMERCIAL_PATHS_SOURCE).toContain("contact?type=enterprise");
  });

  it("fires a distinct funnel-click event per tier", () => {
    expect(COMMERCIAL_PATHS_SOURCE).toContain("decision_sprint_clicked");
    expect(COMMERCIAL_PATHS_SOURCE).toContain("team_clicked");
    expect(COMMERCIAL_PATHS_SOURCE).toContain("enterprise_clicked");
  });

  it("tracks a section-viewed event on mount", () => {
    expect(COMMERCIAL_PATHS_SOURCE).toContain("commercial_section_viewed");
  });
});

describe("Localized commercial content", () => {
  const dictionaries: Array<[string, typeof en]> = [
    ["en", en],
    ["de", de],
    ["fr", fr],
    ["es", es],
    ["it", itDict],
  ];

  for (const [locale, dict] of dictionaries) {
    it(`${locale}: Decision Sprint shows a concrete CHF price, Team shows an annual CHF price`, () => {
      expect(dict.commercialSection.tiers.sprint.priceLabel).toMatch(/25[.,’' ]?000/);
      expect(dict.commercialSection.tiers.team.priceLabel).toMatch(/75[.,’' ]?000/);
    });

    it(`${locale}: Enterprise never shows a fixed public price`, () => {
      expect(dict.commercialSection.tiers.enterprise.priceLabel).not.toMatch(/\d/);
    });
  }

  // Founder-identity exposure across every locale's full dictionary
  // (including this new commercial copy) is already covered
  // exhaustively, with locale-correct patterns (Gründer/fondateur/
  // fundador/fondatore, not just the English word), by
  // src/app/__tests__/founder-privacy.test.ts — not duplicated here.
});
