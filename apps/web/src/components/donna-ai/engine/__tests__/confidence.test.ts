import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { buildEngineEvidence, computeEvidenceDiagnostics } from "../evidence";
import { computeConfidenceScore, confidenceLevelFromScore, evaluateConfidence } from "../confidence";

function diagnosticsFor(state: typeof SAMPLE_PROFILE) {
  const ranked = scoreAllPlatformsV2(state);
  const evidence = buildEngineEvidence(state, ranked[0]);
  return { ranked, diagnostics: computeEvidenceDiagnostics(evidence, ranked[0].dimensions, ranked[0].platform) };
}

describe("Confidence Engine", () => {
  it("maps fixed thresholds to LOW/MEDIUM/HIGH", () => {
    expect(confidenceLevelFromScore(30)).toBe("LOW");
    expect(confidenceLevelFromScore(54)).toBe("LOW");
    expect(confidenceLevelFromScore(55)).toBe("MEDIUM");
    expect(confidenceLevelFromScore(79)).toBe("MEDIUM");
    expect(confidenceLevelFromScore(80)).toBe("HIGH");
    expect(confidenceLevelFromScore(96)).toBe("HIGH");
  });

  it("never produces a score outside the documented [30, 96] range", () => {
    const { ranked: rankedEmpty } = diagnosticsFor(EMPTY_WIZARD_STATE);
    const { ranked: rankedFull } = diagnosticsFor(SAMPLE_PROFILE);
    const scoreEmpty = computeConfidenceScore(EMPTY_WIZARD_STATE, rankedEmpty[0]);
    const scoreFull = computeConfidenceScore(SAMPLE_PROFILE, rankedFull[0]);
    expect(scoreEmpty).toBeGreaterThanOrEqual(30);
    expect(scoreEmpty).toBeLessThanOrEqual(96);
    expect(scoreFull).toBeGreaterThanOrEqual(30);
    expect(scoreFull).toBeLessThanOrEqual(96);
  });

  it("scores a fully answered profile higher than an empty one", () => {
    const { ranked: rankedEmpty } = diagnosticsFor(EMPTY_WIZARD_STATE);
    const { ranked: rankedFull } = diagnosticsFor(SAMPLE_PROFILE);
    const scoreEmpty = computeConfidenceScore(EMPTY_WIZARD_STATE, rankedEmpty[0]);
    const scoreFull = computeConfidenceScore(SAMPLE_PROFILE, rankedFull[0]);
    expect(scoreFull).toBeGreaterThan(scoreEmpty);
  });

  it("every reason is non-empty prose, never a bare number", () => {
    const { ranked, diagnostics } = diagnosticsFor(SAMPLE_PROFILE);
    const result = evaluateConfidence(SAMPLE_PROFILE, ranked[0], diagnostics);
    expect(result.reasons.length).toBeGreaterThan(0);
    for (const reason of result.reasons) {
      expect(typeof reason).toBe("string");
      expect(reason.length).toBeGreaterThan(10);
    }
  });

  it("names every incomplete wizard section as a reason for an empty profile", () => {
    const { ranked, diagnostics } = diagnosticsFor(EMPTY_WIZARD_STATE);
    const result = evaluateConfidence(EMPTY_WIZARD_STATE, ranked[0], diagnostics);
    expect(result.reasons.some((r) => r.includes("left incomplete"))).toBe(true);
    expect(result.level).toBe("LOW");
  });

  it("is deterministic for identical input", () => {
    const { ranked, diagnostics } = diagnosticsFor(SAMPLE_PROFILE);
    const a = evaluateConfidence(SAMPLE_PROFILE, ranked[0], diagnostics);
    const b = evaluateConfidence(SAMPLE_PROFILE, ranked[0], diagnostics);
    expect(a).toEqual(b);
  });
});
