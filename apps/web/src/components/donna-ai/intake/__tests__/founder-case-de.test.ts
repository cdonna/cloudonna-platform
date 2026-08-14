import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { applyExtractionResult } from "../apply-candidates";
import { extractFromStatement } from "../deterministic-extractor";
import type { ExtractionFieldKey } from "../extraction-types";
import { canOfferRecommendation, computeDecisionReadiness, selectMissingQuestions } from "../question-engine";

/**
 * The German counterpart to founder-case.test.ts's exact English
 * statement — the verbatim text from the localization brief's
 * "Founder Language Test," not a paraphrase. Proves the real
 * requirement: German input normalizes to materially the same
 * WizardState as the equivalent English statement (same country,
 * industry, employee band, ERP, cloud, and goal signal) — not
 * identical wording, equivalent *meaning*. See
 * founder-case.test.ts for the English original this is compared
 * against, and the localization report's "NORMALIZED STATE
 * DIFFERENCES" section for the one honest, disclosed gap between the
 * two runs.
 */
const FOUNDER_STATEMENT_DE = `Wir sind ein Schweizer Industrieunternehmen mit rund 4.000 Mitarbeitenden.
Unser ERP ist SAP S/4HANA.
Aktuell nutzen wir SAP BW, Power BI und Snowflake.
Die meisten Workloads laufen auf Microsoft Azure.
Wir wollen unsere Daten- und Analytics-Plattform innerhalb der nächsten 18 Monate modernisieren.
SAP soll unser zentrales ERP bleiben, bei der Datenplattform sind wir offen.
Governance, SAP-Integration und Time-to-Value sind uns wichtiger als die niedrigsten Kosten.
Unser internes Datenteam kennt SAP und Microsoft sehr gut, hat aber nur wenig Databricks-Erfahrung.`;

describe("the exact Founder case — German", () => {
  it("recognizes every fact the German statement supports, normalized to the same values as the English version", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT_DE);

    expect(extraction.candidates.country?.value).toBe("switzerland");
    expect(extraction.candidates.industry?.value).toBe("manufacturing");
    expect(extraction.candidates.employees?.value).toBe("enterprise");
    expect(extraction.candidates.employees?.rawText).toMatch(/4\.000/);
    expect(extraction.candidates.erp?.value).toBe("sap-s4hana");
    expect(extraction.candidates.analytics?.value).toBe("power-bi");
    expect(extraction.candidates.dataWarehouse?.value).toBe("sap-bw");
    expect(extraction.additionalSystems).toContainEqual({ category: "dataWarehouse", value: "snowflake", label: "Snowflake" });
    expect(extraction.candidates.cloud?.value).toBe("azure");
    expect(extraction.goals.map((g) => g.value)).toContain("modernization");
    expect(extraction.goals.map((g) => g.value)).toContain("governance");
    expect(extraction.candidates.timeline?.value).toBe("extended"); // 18 months, same band as the English "within the next 18 months"
    expect(extraction.candidates.internalSkills?.value).toBe("moderate");
    expect(extraction.candidates.preferredVendor?.value).toBe("sap");
  });

  it("is already ready to recommend once every named fact is accepted, same as the English case", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT_DE);
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const allGoals = new Set(extraction.goals.map((g) => g.value));
    const state = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, allGoals);

    expect(canOfferRecommendation(state)).toBe(true);
    expect(computeDecisionReadiness(state)).not.toBe("not-enough-context");
    const missing = selectMissingQuestions(state);
    expect(missing).not.toContain("country");
    expect(missing).not.toContain("industry");
    expect(missing).not.toContain("employees");
    expect(missing).not.toContain("erp");
    expect(missing).not.toContain("dataWarehouse");
    expect(missing).not.toContain("cloud");
    expect(missing).not.toContain("goals");
    expect(missing).not.toContain("timeline");
  });

  it("produces a complete, real DecisionOutput from the German state — no crash, no fabricated data", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT_DE);
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const allGoals = new Set(extraction.goals.map((g) => g.value));
    const state = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, allGoals);

    const output = buildDecisionOutput(state);
    expect(output.recommendation.platform.productName).toBeTruthy();
    expect(output.donnaScore).toBeGreaterThan(0);
    expect(output.donnaScore).toBeLessThanOrEqual(100);
  });
});
