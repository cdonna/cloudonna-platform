import { describe, expect, it } from "vitest";
import type { VersionDiff } from "../version-diff";
import { explainScoreChange } from "../score-explanation";

function baseDiff(overrides: Partial<VersionDiff> = {}): VersionDiff {
  return {
    fromVersion: 1,
    toVersion: 2,
    changedConstraints: [],
    changedPriorities: { added: [], removed: [] },
    changedVendors: [],
    changedScores: {
      donnaScore: { from: 82, to: 82, delta: 0 },
      confidenceScore: { from: 70, to: 70, delta: 0 },
      dimensions: [],
    },
    changedRecommendations: {
      primary: { changed: false, from: null, to: null },
      alternative: { changed: false, from: null, to: null },
    },
    changedProvenance: [],
    hasChanges: false,
    ...overrides,
  };
}

describe("explainScoreChange", () => {
  it("produces no reasons when nothing changed", () => {
    const explanation = explainScoreChange(baseDiff());
    expect(explanation.reasons).toEqual([]);
    expect(explanation.delta).toBe(0);
  });

  it("explains a budget increase using the diff's own direction", () => {
    const diff = baseDiff({
      changedConstraints: [{ field: "budget", label: "Budget", from: "Tight", to: "Flexible", direction: "increased" }],
      changedScores: { donnaScore: { from: 82, to: 91, delta: 9 }, confidenceScore: { from: 70, to: 70, delta: 0 }, dimensions: [] },
    });
    const explanation = explainScoreChange(diff);

    expect(explanation.reasons).toEqual(["Budget increased from Tight to Flexible"]);
    expect(explanation.fromScore).toBe(82);
    expect(explanation.toScore).toBe(91);
    expect(explanation.delta).toBe(9);
  });

  it("explains an unordered field change without asserting a direction", () => {
    const diff = baseDiff({
      changedVendors: [{ field: "erp", label: "ERP", from: "SAP ECC", to: "SAP S/4HANA" }],
    });
    expect(explainScoreChange(diff).reasons).toEqual(["ERP changed from SAP ECC to SAP S/4HANA"]);
  });

  it("explains added and removed priorities by their real goal labels", () => {
    const diff = baseDiff({ changedPriorities: { added: ["cost-reduction"], removed: ["business-ai"] } });
    const reasons = explainScoreChange(diff).reasons;

    expect(reasons).toContain("Cost reduction goal added");
    expect(reasons).toContain("Business AI goal removed");
  });

  it("explains a changed primary recommendation", () => {
    const diff = baseDiff({
      changedRecommendations: {
        primary: { changed: true, from: { id: "a", name: "Vendor A Product A" }, to: { id: "b", name: "Vendor B Product B" } },
        alternative: { changed: false, from: null, to: null },
      },
    });
    expect(explainScoreChange(diff).reasons).toEqual(["Recommended platform changed from Vendor A Product A to Vendor B Product B"]);
  });

  it("explains a dimension score change with improved/declined wording", () => {
    const diff = baseDiff({
      changedScores: {
        donnaScore: { from: 82, to: 82, delta: 0 },
        confidenceScore: { from: 70, to: 70, delta: 0 },
        dimensions: [{ key: "cost", label: "Cost", from: 60, to: 80, delta: 20 }],
      },
    });
    expect(explainScoreChange(diff).reasons).toEqual(["Cost score improved from 60 to 80"]);
  });

  it("only ever produces reasons tied to an entry actually present in the diff — never invents one", () => {
    // A diff with a nonzero donnaScore delta but no attributable field
    // change anywhere (e.g. the engine's own internal weighting shifted
    // without any input changing) must not fabricate a reason for it.
    const diff = baseDiff({ changedScores: { donnaScore: { from: 82, to: 91, delta: 9 }, confidenceScore: { from: 70, to: 70, delta: 0 }, dimensions: [] } });
    expect(explainScoreChange(diff).reasons).toEqual([]);
  });

  it("combines every category into one ordered reasons list, matching the example format", () => {
    const diff = baseDiff({
      changedConstraints: [{ field: "budget", label: "Budget", from: "Moderate", to: "Flexible", direction: "increased" }],
      changedVendors: [{ field: "erp", label: "ERP", from: "Other / none", to: "SAP S/4HANA" }],
      changedPriorities: { added: [], removed: ["business-ai"] },
      changedScores: { donnaScore: { from: 82, to: 91, delta: 9 }, confidenceScore: { from: 70, to: 72, delta: 2 }, dimensions: [] },
    });
    const explanation = explainScoreChange(diff);

    expect(explanation.reasons).toEqual([
      "Budget increased from Moderate to Flexible",
      "Business AI goal removed",
      "ERP changed from Other / none to SAP S/4HANA",
    ]);
    expect(explanation.fromScore).toBe(82);
    expect(explanation.toScore).toBe(91);
  });

  it("explains a scoring-engine provenance change", () => {
    const diff = baseDiff({
      changedProvenance: [{ field: "scoringEngineVersion", label: "Scoring engine", from: "donna-score-v1", to: "donna-score-v2" }],
    });
    expect(explainScoreChange(diff).reasons).toEqual(["Scoring engine changed from donna-score-v1 to donna-score-v2"]);
  });

  it("places provenance reasons last, after every input-driven reason", () => {
    const diff = baseDiff({
      changedConstraints: [{ field: "budget", label: "Budget", from: "Tight", to: "Moderate", direction: "increased" }],
      changedProvenance: [{ field: "knowledgeBaseVersion", label: "Knowledge base", from: "vendor-catalog-v0", to: "vendor-catalog-v1" }],
    });
    const reasons = explainScoreChange(diff).reasons;

    expect(reasons).toEqual(["Budget increased from Tight to Moderate", "Knowledge base changed from vendor-catalog-v0 to vendor-catalog-v1"]);
  });
});
