import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { applyExtractionResult } from "../apply-candidates";
import { extractFromStatement } from "../deterministic-extractor";
import type { ExtractionFieldKey } from "../extraction-types";

describe("applyExtractionResult", () => {
  it("only writes fields present in acceptedKeys — a candidate the user never confirmed is not silently applied", () => {
    const extraction = extractFromStatement("We run SAP S/4HANA and Snowflake in Switzerland.");
    const result = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, new Set(["erp"]), new Set());

    expect(result.landscape.erp).toBe("sap-s4hana");
    // dataWarehouse and country were extracted but not accepted.
    expect(result.landscape.dataWarehouse).toBeNull();
    expect(result.company.country).toBeNull();
  });

  it("field correction: removing a key from acceptedKeys leaves that field unset", () => {
    const extraction = extractFromStatement("We run SAP S/4HANA and Snowflake in Switzerland.");
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const withoutCountry = new Set([...allKeys].filter((k) => k !== "country"));

    const result = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, withoutCountry, new Set());
    expect(result.landscape.erp).toBe("sap-s4hana");
    expect(result.company.country).toBeNull();
  });

  it("only applies goal tags present in acceptedGoals", () => {
    const extraction = extractFromStatement("We need a stronger enterprise data platform and better compliance reporting.");
    const modernizationOnly = new Set(["modernization"] as const);
    const result = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, new Set(), modernizationOnly);

    expect(result.goals.goals).toContain("modernization");
    expect(result.goals.goals).not.toContain("compliance");
  });

  it("preserves the original statement as company.note", () => {
    const statement = "We run SAP S/4HANA and Snowflake in Switzerland.";
    const extraction = extractFromStatement(statement);
    const result = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, new Set(), new Set());
    expect(result.company.note).toBe(statement);
  });

  it("engine compatibility: a WizardState built through extraction produces the exact same DecisionOutput as the same fields set manually", () => {
    const extraction = extractFromStatement(
      "We're a Swiss manufacturer using SAP S/4HANA, Power BI and Snowflake with 3,000 employees.",
    );
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const viaExtraction = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, new Set());

    // The same values, set directly — exactly what the old manual
    // wizard's SET_COMPANY_FIELD/SET_LANDSCAPE_FIELD actions would have
    // produced for this input.
    const viaManualEntry = {
      ...EMPTY_WIZARD_STATE,
      company: { ...EMPTY_WIZARD_STATE.company, country: "switzerland", industry: "manufacturing", employees: "enterprise" },
      landscape: { ...EMPTY_WIZARD_STATE.landscape, erp: "sap-s4hana", analytics: "power-bi", dataWarehouse: "snowflake" },
    } as typeof EMPTY_WIZARD_STATE;

    // Confirm the two construction paths actually agree on every field
    // this test cares about before comparing engine output — if this
    // assertion ever fails, the DecisionOutput comparison below would
    // be meaningless (comparing two states that already differ).
    expect(viaExtraction.company.country).toBe(viaManualEntry.company.country);
    expect(viaExtraction.company.industry).toBe(viaManualEntry.company.industry);
    expect(viaExtraction.company.employees).toBe(viaManualEntry.company.employees);
    expect(viaExtraction.landscape.erp).toBe(viaManualEntry.landscape.erp);
    expect(viaExtraction.landscape.analytics).toBe(viaManualEntry.landscape.analytics);
    expect(viaExtraction.landscape.dataWarehouse).toBe(viaManualEntry.landscape.dataWarehouse);

    // buildDecisionOutput reads state.company.note too (via
    // buildAssumptions) — normalize it so this test isolates the
    // extraction-vs-manual-entry comparison from that unrelated field.
    const normalizedExtraction = { ...viaExtraction, company: { ...viaExtraction.company, note: "" } };

    expect(buildDecisionOutput(normalizedExtraction)).toEqual(buildDecisionOutput(viaManualEntry));
  });

  it("AI unavailable fallback: extraction and merge work end to end with zero network dependency", () => {
    // There is no live AI extraction path in this build (see the
    // Founder report's "AI FALLBACK" section) — the deterministic path
    // is what ships, always, so "AI unavailable" is not a distinct
    // code branch to test, it is the only branch. This test asserts
    // the guarantee directly: a full extract-and-apply cycle never
    // throws and always yields a usable WizardState, synchronously.
    const extraction = extractFromStatement("We run SAP S/4HANA.");
    const result = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, new Set(["erp"]), new Set());
    expect(result.landscape.erp).toBe("sap-s4hana");
    expect(() => buildDecisionOutput(result)).not.toThrow();
  });
});
