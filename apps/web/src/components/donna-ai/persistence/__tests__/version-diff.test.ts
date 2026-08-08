import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import type { WizardState } from "../../types";
import type { DecisionInput, DeterministicDecisionOutput } from "../../intelligence/types";
import type { RankedPlatform } from "../../scoring/types";
import { diffDecisionVersions, type VersionProvenance, type VersionSnapshot } from "../version-diff";

const DEFAULT_PROVENANCE: VersionProvenance = {
  schemaVersion: "decision-report/1",
  scoringEngineVersion: "donna-score-v2",
  knowledgeBaseVersion: "vendor-catalog-v1",
};

function wizardState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    ...SAMPLE_PROFILE,
    ...overrides,
    company: { ...SAMPLE_PROFILE.company, ...overrides.company },
    landscape: { ...SAMPLE_PROFILE.landscape, ...overrides.landscape },
    goals: { ...SAMPLE_PROFILE.goals, ...overrides.goals },
    constraints: { ...SAMPLE_PROFILE.constraints, ...overrides.constraints },
  };
}

function platform(id: string, vendor: string, productName: string): RankedPlatform["platform"] {
  // Only id/vendor/productName are ever read by the diff engine — a
  // minimal fake satisfying just those, matching this codebase's own
  // precedent for test doubles (see decisions-repository.test.ts).
  return { id, vendor, productName } as RankedPlatform["platform"];
}

function ranked(id: string, vendor: string, productName: string, overallScore = 80): RankedPlatform {
  return { platform: platform(id, vendor, productName), overallScore, dimensions: [] };
}

function output(overrides: Partial<DeterministicDecisionOutput> = {}): DeterministicDecisionOutput {
  const base = buildDecisionOutput(SAMPLE_PROFILE);
  return { ...base, ...overrides };
}

function snapshot(
  versionNumber: number,
  state: WizardState,
  out: DeterministicDecisionOutput,
  provenance: VersionProvenance = DEFAULT_PROVENANCE,
): VersionSnapshot {
  const decisionInput: DecisionInput = { wizardState: state };
  return { versionNumber, decisionInput, output: out, provenance };
}

describe("diffDecisionVersions", () => {
  it("reports no changes between two identical snapshots", () => {
    const state = wizardState();
    const out = output();
    const diff = diffDecisionVersions(snapshot(1, state, out), snapshot(2, state, out));

    expect(diff.hasChanges).toBe(false);
    expect(diff.changedConstraints).toHaveLength(0);
    expect(diff.changedPriorities).toEqual({ added: [], removed: [] });
    expect(diff.changedVendors).toHaveLength(0);
    expect(diff.changedRecommendations.primary.changed).toBe(false);
  });

  it("detects a budget increase with a direction", () => {
    const from = wizardState({ constraints: { ...SAMPLE_PROFILE.constraints, budget: "tight" } });
    const to = wizardState({ constraints: { ...SAMPLE_PROFILE.constraints, budget: "flexible" } });
    const out = output();
    const diff = diffDecisionVersions(snapshot(1, from, out), snapshot(2, to, out));

    expect(diff.hasChanges).toBe(true);
    expect(diff.changedConstraints).toEqual([
      { field: "budget", label: "Budget", from: "Tight", to: "Flexible", direction: "increased" },
    ]);
  });

  it("detects a budget decrease with a direction", () => {
    const from = wizardState({ constraints: { ...SAMPLE_PROFILE.constraints, budget: "flexible" } });
    const to = wizardState({ constraints: { ...SAMPLE_PROFILE.constraints, budget: "tight" } });
    const diff = diffDecisionVersions(snapshot(1, from, output()), snapshot(2, to, output()));

    expect(diff.changedConstraints[0]).toMatchObject({ field: "budget", direction: "decreased" });
  });

  it("does not assert a direction for an unordered constraint field", () => {
    const from = wizardState({ constraints: { ...SAMPLE_PROFILE.constraints, preferredVendor: "microsoft" } });
    const to = wizardState({ constraints: { ...SAMPLE_PROFILE.constraints, preferredVendor: "sap" } });
    const diff = diffDecisionVersions(snapshot(1, from, output()), snapshot(2, to, output()));

    expect(diff.changedConstraints).toEqual([
      { field: "preferredVendor", label: "Preferred vendor", from: "Microsoft", to: "SAP", direction: undefined },
    ]);
  });

  it("detects added and removed priorities (goals)", () => {
    const from = wizardState({ goals: { goals: ["modernization", "business-ai"], note: "" } });
    const to = wizardState({ goals: { goals: ["modernization", "cost-reduction"], note: "" } });
    const diff = diffDecisionVersions(snapshot(1, from, output()), snapshot(2, to, output()));

    expect(diff.changedPriorities.added).toEqual(["cost-reduction"]);
    expect(diff.changedPriorities.removed).toEqual(["business-ai"]);
  });

  it("detects a changed vendor (landscape system)", () => {
    const from = wizardState({ landscape: { ...SAMPLE_PROFILE.landscape, erp: "sap-ecc" } });
    const to = wizardState({ landscape: { ...SAMPLE_PROFILE.landscape, erp: "sap-s4hana" } });
    const diff = diffDecisionVersions(snapshot(1, from, output()), snapshot(2, to, output()));

    expect(diff.changedVendors).toEqual([{ field: "erp", label: "ERP", from: "SAP ECC", to: "SAP S/4HANA", direction: undefined }]);
  });

  it("computes donna score, confidence score, and per-dimension deltas", () => {
    const state = wizardState();
    const from = output({
      donnaScore: 82,
      confidenceScore: 70,
      dimensions: [{ key: "cost", label: "Cost", score: 60, weight: 0.1, positiveEvidence: [], negativeEvidence: [] }],
    });
    const to = output({
      donnaScore: 91,
      confidenceScore: 75,
      dimensions: [{ key: "cost", label: "Cost", score: 80, weight: 0.1, positiveEvidence: [], negativeEvidence: [] }],
    });
    const diff = diffDecisionVersions(snapshot(1, state, from), snapshot(2, state, to));

    expect(diff.changedScores.donnaScore).toEqual({ from: 82, to: 91, delta: 9 });
    expect(diff.changedScores.confidenceScore).toEqual({ from: 70, to: 75, delta: 5 });
    expect(diff.changedScores.dimensions).toEqual([{ key: "cost", label: "Cost", from: 60, to: 80, delta: 20 }]);
    expect(diff.hasChanges).toBe(true);
  });

  it("ignores a dimension whose score did not change", () => {
    const state = wizardState();
    const dims = [{ key: "cost" as const, label: "Cost", score: 60, weight: 0.1, positiveEvidence: [], negativeEvidence: [] }];
    const out = output({ dimensions: dims });
    const diff = diffDecisionVersions(snapshot(1, state, out), snapshot(2, state, out));

    expect(diff.changedScores.dimensions).toHaveLength(0);
  });

  it("detects a changed primary and alternative recommendation", () => {
    const state = wizardState();
    const from = output({
      recommendation: ranked("platform-a", "Vendor A", "Product A"),
      alternativeRecommendation: ranked("platform-b", "Vendor B", "Product B"),
    });
    const to = output({
      recommendation: ranked("platform-c", "Vendor C", "Product C"),
      alternativeRecommendation: null,
    });
    const diff = diffDecisionVersions(snapshot(1, state, from), snapshot(2, state, to));

    expect(diff.changedRecommendations.primary).toEqual({
      changed: true,
      from: { id: "platform-a", name: "Vendor A Product A" },
      to: { id: "platform-c", name: "Vendor C Product C" },
    });
    expect(diff.changedRecommendations.alternative).toEqual({
      changed: true,
      from: { id: "platform-b", name: "Vendor B Product B" },
      to: null,
    });
  });

  it("does not flag a recommendation as changed when the platform id is identical", () => {
    const state = wizardState();
    const out = output({ recommendation: ranked("platform-a", "Vendor A", "Product A") });
    const diff = diffDecisionVersions(snapshot(1, state, out), snapshot(2, state, out));

    expect(diff.changedRecommendations.primary.changed).toBe(false);
  });

  it("preserves the from/to version numbers passed in", () => {
    const state = wizardState();
    const out = output();
    const diff = diffDecisionVersions(snapshot(2, state, out), snapshot(5, state, out));

    expect(diff.fromVersion).toBe(2);
    expect(diff.toVersion).toBe(5);
  });

  it("reports no provenance changes when the engine/schema/knowledge-base versions are identical", () => {
    const state = wizardState();
    const out = output();
    const diff = diffDecisionVersions(snapshot(1, state, out), snapshot(2, state, out));

    expect(diff.changedProvenance).toHaveLength(0);
  });

  it("detects a scoring-engine version change, distinct from an input change", () => {
    const state = wizardState();
    const out = output();
    const from = snapshot(1, state, out, { ...DEFAULT_PROVENANCE, scoringEngineVersion: "donna-score-v1" });
    const to = snapshot(2, state, out, DEFAULT_PROVENANCE);
    const diff = diffDecisionVersions(from, to);

    expect(diff.changedProvenance).toEqual([
      { field: "scoringEngineVersion", label: "Scoring engine", from: "donna-score-v1", to: "donna-score-v2" },
    ]);
    expect(diff.hasChanges).toBe(true);
    // The identical input/output means every other change category is
    // empty — this diff's only real signal is the engine version.
    expect(diff.changedConstraints).toHaveLength(0);
    expect(diff.changedScores.donnaScore.delta).toBe(0);
  });

  it("detects multiple simultaneous provenance changes", () => {
    const state = wizardState();
    const out = output();
    const from = snapshot(1, state, out, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v1",
      knowledgeBaseVersion: "vendor-catalog-v0",
    });
    const to = snapshot(2, state, out, DEFAULT_PROVENANCE);
    const diff = diffDecisionVersions(from, to);

    expect(diff.changedProvenance.map((c) => c.field)).toEqual(["scoringEngineVersion", "knowledgeBaseVersion"]);
  });

  it("provenance fields never carry a direction — they are not an ordered scale", () => {
    const state = wizardState();
    const out = output();
    const from = snapshot(1, state, out, { ...DEFAULT_PROVENANCE, knowledgeBaseVersion: "vendor-catalog-v0" });
    const to = snapshot(2, state, out, DEFAULT_PROVENANCE);
    const diff = diffDecisionVersions(from, to);

    expect(diff.changedProvenance[0].direction).toBeUndefined();
  });
});
