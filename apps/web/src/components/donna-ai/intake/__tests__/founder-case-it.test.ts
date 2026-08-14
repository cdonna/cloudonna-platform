import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { applyExtractionResult } from "../apply-candidates";
import { extractFromStatement } from "../deterministic-extractor";
import type { ExtractionFieldKey } from "../extraction-types";
import { canOfferRecommendation, computeDecisionReadiness, selectMissingQuestions } from "../question-engine";

/**
 * Italian counterpart to founder-case.test.ts / founder-case-de.test.ts.
 * Unlike the German statement (given verbatim in the localization
 * brief), no Italian Founder statement was supplied — this is this
 * pass's own translation of the same facts, added because Italian was
 * added as a fifth supported locale under the release-review gate
 * requiring "EN / DE / FR / ES / IT routes work." Disclosed here
 * rather than silently presented as brief-supplied. Proves the same
 * property as the German test: Italian input normalizes to materially
 * the same WizardState as the English original.
 */
const FOUNDER_STATEMENT_IT = `Siamo un'azienda manifatturiera svizzera con circa 4.000 dipendenti.
Il nostro ERP è SAP S/4HANA.
Attualmente utilizziamo SAP BW, Power BI e Snowflake.
La maggior parte dei workload gira su Microsoft Azure.
Vogliamo modernizzare la nostra piattaforma dati e analytics entro i prossimi 18 mesi.
SAP deve rimanere il nostro ERP centrale, mentre siamo aperti sulla piattaforma dati.
Governance, integrazione con SAP e time-to-value sono per noi più importanti del costo più basso possibile.
Il nostro team dati interno conosce molto bene SAP e Microsoft, ma ha poca esperienza con Databricks.`;

describe("the exact Founder case — Italian", () => {
  it("recognizes every fact the Italian statement supports, normalized to the same values as the English/German versions", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT_IT);

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
    expect(extraction.candidates.timeline?.value).toBe("extended");
    expect(extraction.candidates.internalSkills?.value).toBe("moderate");
    expect(extraction.candidates.preferredVendor?.value).toBe("sap");
  });

  it("is already ready to recommend once every named fact is accepted", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT_IT);
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

  it("produces a complete, real DecisionOutput from the Italian state — no crash, no fabricated data", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT_IT);
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const allGoals = new Set(extraction.goals.map((g) => g.value));
    const state = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, allGoals);

    const output = buildDecisionOutput(state);
    expect(output.recommendation.platform.productName).toBeTruthy();
    expect(output.donnaScore).toBeGreaterThan(0);
    expect(output.donnaScore).toBeLessThanOrEqual(100);
  });
});
