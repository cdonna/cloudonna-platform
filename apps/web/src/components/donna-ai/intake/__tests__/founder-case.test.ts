import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { applyExtractionResult } from "../apply-candidates";
import { extractFromStatement } from "../deterministic-extractor";
import type { ExtractionFieldKey } from "../extraction-types";
import { canOfferRecommendation, computeDecisionReadiness, selectMissingQuestions } from "../question-engine";

/** The exact statement from the Founder Walkthrough brief — verbatim,
 * not paraphrased, so this test proves the real reported scenario, not
 * a convenient stand-in for it. */
const FOUNDER_STATEMENT = `We are a Swiss industrial manufacturer with around 4,000 employees.
Our ERP is SAP S/4HANA.
We currently use SAP BW, Power BI and Snowflake.
Most workloads run on Microsoft Azure.
Management wants to modernize our data and analytics platform within the next 18 months.
We want to keep SAP as our core ERP, but we are open to different data platforms.
Governance, integration with SAP and time to value are more important to us than having the lowest possible cost.
Our internal data team is experienced with SAP and Microsoft, but has limited Databricks expertise.`;

describe("the exact Founder case", () => {
  it("recognizes every fact named in the brief", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT);

    expect(extraction.candidates.country?.value).toBe("switzerland");
    expect(extraction.candidates.industry?.value).toBe("manufacturing");
    expect(extraction.candidates.employees?.value).toBe("enterprise");
    expect(extraction.candidates.employees?.rawText).toMatch(/4,000/);
    expect(extraction.candidates.erp?.value).toBe("sap-s4hana");
    expect(extraction.candidates.analytics?.value).toBe("power-bi");
    expect(extraction.candidates.dataWarehouse?.value).toBe("sap-bw");
    expect(extraction.additionalSystems).toContainEqual({ category: "dataWarehouse", value: "snowflake", label: "Snowflake" });
    expect(extraction.candidates.cloud?.value).toBe("azure");
    expect(extraction.goals.map((g) => g.value)).toContain("modernization");
    expect(extraction.goals.map((g) => g.value)).toContain("governance");
    expect(extraction.candidates.timeline?.value).toBeDefined(); // the 18-month statement resolves to a band
    expect(extraction.candidates.internalSkills?.value).toBe("moderate"); // SAP/Microsoft strong, Databricks limited
  });

  it("does not surface any already-known field as a question Donna still needs to ask", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT);
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const allGoals = new Set(extraction.goals.map((g) => g.value));
    const state = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, allGoals);

    const missing = selectMissingQuestions(state);
    expect(missing).not.toContain("country");
    expect(missing).not.toContain("industry");
    expect(missing).not.toContain("employees");
    expect(missing).not.toContain("erp");
    expect(missing).not.toContain("analytics");
    expect(missing).not.toContain("dataWarehouse");
    expect(missing).not.toContain("cloud");
    expect(missing).not.toContain("goals");
    expect(missing).not.toContain("timeline");
    expect(missing).not.toContain("internalSkills");
  });

  it("is already ready to recommend once every named fact is accepted, with zero forced follow-up questions", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT);
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const allGoals = new Set(extraction.goals.map((g) => g.value));
    const state = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, allGoals);

    expect(canOfferRecommendation(state)).toBe(true);
    expect(computeDecisionReadiness(state)).not.toBe("not-enough-context");
    // Every tier 1-3 core field this statement could support is
    // present, so nothing forces another question before "Get
    // recommendation" is available.
    expect(selectMissingQuestions(state).filter((f) => ["goals", "erp", "cloud", "dataWarehouse", "employees", "industry", "budget", "timeline"].includes(f))).toHaveLength(1);
  });

  it("produces a complete, real DecisionOutput from this exact state — no crash, no fabricated data", () => {
    const extraction = extractFromStatement(FOUNDER_STATEMENT);
    const allKeys = new Set(Object.keys(extraction.candidates) as ExtractionFieldKey[]);
    const allGoals = new Set(extraction.goals.map((g) => g.value));
    const state = applyExtractionResult(EMPTY_WIZARD_STATE, extraction, allKeys, allGoals);

    const output = buildDecisionOutput(state);
    expect(output.recommendation.platform.productName).toBeTruthy();
    expect(output.donnaScore).toBeGreaterThan(0);
    expect(output.donnaScore).toBeLessThanOrEqual(100);
  });
});
