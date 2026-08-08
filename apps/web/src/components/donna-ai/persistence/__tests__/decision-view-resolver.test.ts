import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import type { DecisionInput, DeterministicDecisionOutput } from "../../intelligence/types";
import {
  buildOrderedComparison,
  isHistoricalVersionView,
  parseVersionParam,
  resolveDecisionViewPlan,
  toDecisionReport,
  toVersionSnapshot,
  type DecisionViewPlan,
} from "../decision-view-resolver";
import type { DecisionVersionContent } from "../decisions-repository";
import type { VersionSnapshot } from "../version-diff";

describe("parseVersionParam", () => {
  it("returns null for undefined", () => {
    expect(parseVersionParam(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseVersionParam("")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseVersionParam("abc")).toBeNull();
  });

  it("returns null for zero or negative numbers", () => {
    expect(parseVersionParam("0")).toBeNull();
    expect(parseVersionParam("-3")).toBeNull();
  });

  it("parses a valid positive integer string", () => {
    expect(parseVersionParam("3")).toBe(3);
  });

  it("takes the first element when given an array (repeated search param)", () => {
    expect(parseVersionParam(["5", "6"])).toBe(5);
  });

  it("never returns NaN", () => {
    const result = parseVersionParam("not-a-number");
    expect(result).not.toBeNaN();
    expect(result).toBeNull();
  });
});

describe("resolveDecisionViewPlan", () => {
  const knownVersionNumbers = [1, 2, 3];

  it("defaults to the current version when no version was requested", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: null,
      compareVersion: null,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan).toEqual<DecisionViewPlan>({
      displayedVersionNumber: 3,
      needsDisplayFetch: false,
      compareVersionNumber: null,
    });
  });

  it("honors a known, non-current requested version and marks a fetch as needed", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: 1,
      compareVersion: null,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan.displayedVersionNumber).toBe(1);
    expect(plan.needsDisplayFetch).toBe(true);
  });

  it("falls back to current when the requested version is unknown", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: 99,
      compareVersion: null,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan.displayedVersionNumber).toBe(3);
    expect(plan.needsDisplayFetch).toBe(false);
  });

  it("does not require a fetch when the requested version equals current", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: 3,
      compareVersion: null,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan.needsDisplayFetch).toBe(false);
  });

  it("honors a known compare version distinct from the displayed one", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: 3,
      compareVersion: 1,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan.compareVersionNumber).toBe(1);
  });

  it("ignores a compare version equal to the displayed version", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: 2,
      compareVersion: 2,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan.compareVersionNumber).toBeNull();
  });

  it("ignores an unknown compare version", () => {
    const plan = resolveDecisionViewPlan({
      requestedVersion: 3,
      compareVersion: 42,
      knownVersionNumbers,
      currentVersionNumber: 3,
    });
    expect(plan.compareVersionNumber).toBeNull();
  });
});

describe("isHistoricalVersionView", () => {
  it("is false when the displayed version is the current version", () => {
    expect(isHistoricalVersionView(3, 3)).toBe(false);
  });

  it("is true when the displayed version differs from current", () => {
    expect(isHistoricalVersionView(1, 3)).toBe(true);
  });
});

describe("buildOrderedComparison", () => {
  function snapshot(versionNumber: number, donnaScore: number): VersionSnapshot {
    const decisionInput: DecisionInput = { wizardState: SAMPLE_PROFILE };
    const output: DeterministicDecisionOutput = { ...buildDecisionOutput(SAMPLE_PROFILE), donnaScore };
    return {
      versionNumber,
      decisionInput,
      output,
      provenance: { schemaVersion: "decision-report/1", scoringEngineVersion: "donna-score-v2", knowledgeBaseVersion: "vendor-catalog-v1" },
    };
  }

  it("orders older before newer regardless of argument order", () => {
    const v1 = snapshot(1, 70);
    const v2 = snapshot(2, 85);

    const forward = buildOrderedComparison(v1, v2);
    const backward = buildOrderedComparison(v2, v1);

    expect(forward.diff.fromVersion).toBe(1);
    expect(forward.diff.toVersion).toBe(2);
    expect(backward.diff.fromVersion).toBe(1);
    expect(backward.diff.toVersion).toBe(2);
    expect(forward.explanation.delta).toBe(backward.explanation.delta);
  });
});

describe("toVersionSnapshot / toDecisionReport", () => {
  function fakeContent(): DecisionVersionContent {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    return {
      versionNumber: 2,
      decisionInput: { wizardState: SAMPLE_PROFILE },
      deterministicOutput: output,
      enrichment: null,
      provider: { providerId: "deterministic-v1", model: null },
      fallback: { status: "ok", reason: null },
      evidenceReferences: [],
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      createdBy: "user-1",
      createdByEmail: "user@example.com",
      createdAt: "2026-01-01T00:00:00.000Z",
      changeReason: null,
    };
  }

  it("maps a repository content object into a VersionSnapshot", () => {
    const content = fakeContent();
    const snapshot = toVersionSnapshot(content);
    expect(snapshot.versionNumber).toBe(2);
    expect(snapshot.output).toBe(content.deterministicOutput);
    expect(snapshot.decisionInput.wizardState).toBe(SAMPLE_PROFILE);
  });

  it("maps a repository content object into a DecisionReport", () => {
    const content = fakeContent();
    const report = toDecisionReport(content);
    expect(report.output).toBe(content.deterministicOutput);
    expect(report.provider).toEqual(content.provider);
    expect(report.fallback).toEqual(content.fallback);
    expect(report.generatedAt).toBe(content.generatedAt);
  });
});
