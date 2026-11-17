import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { buildEngineEvidence, computeEvidenceDiagnostics } from "../evidence";

describe("Evidence Engine", () => {
  it("tags every item with one of the six canonical evidence types", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidence = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const allowedTypes = new Set(["official-source", "customer-input", "observed-data", "calculated", "ai-interpretation", "assumption"]);
    expect(evidence.length).toBeGreaterThan(0);
    for (const item of evidence) {
      expect(allowedTypes.has(item.type)).toBe(true);
    }
  });

  it("produces mostly assumption evidence for a completely empty wizard state", () => {
    const ranked = scoreAllPlatformsV2(EMPTY_WIZARD_STATE);
    const evidence = buildEngineEvidence(EMPTY_WIZARD_STATE, ranked[0]);
    const assumptions = evidence.filter((e) => e.type === "assumption");
    const customerInput = evidence.filter((e) => e.type === "customer-input");
    expect(assumptions.length).toBeGreaterThan(0);
    expect(customerInput.length).toBe(0);
  });

  it("produces customer-input evidence once fields are answered, never assumption for the same field", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidence = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const hasIndustryInput = evidence.some((e) => e.type === "customer-input" && e.claim.includes("manufacturing"));
    const hasIndustryAssumption = evidence.some((e) => e.type === "assumption" && e.claim.toLowerCase().includes("industry"));
    expect(hasIndustryInput).toBe(true);
    expect(hasIndustryAssumption).toBe(false);
  });

  it("includes exactly one official-source item citing the catalog's own provenance", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidence = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const officialSource = evidence.filter((e) => e.type === "official-source");
    expect(officialSource).toHaveLength(1);
    expect(officialSource[0].claim).toContain(ranked[0].platform.lastReviewedDate);
  });

  it("computes full coverage only when every dimension has calculated evidence", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidence = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const diagnostics = computeEvidenceDiagnostics(evidence, ranked[0].dimensions, ranked[0].platform);
    expect(diagnostics.coverage).toBeGreaterThanOrEqual(0);
    expect(diagnostics.coverage).toBeLessThanOrEqual(1);
    expect(diagnostics.missingCriticalEvidence.length).toBe(
      ranked[0].dimensions.length - Math.round(diagnostics.coverage * ranked[0].dimensions.length),
    );
  });

  it("assumptionRatio is higher for an empty wizard state than a fully answered one", () => {
    const rankedEmpty = scoreAllPlatformsV2(EMPTY_WIZARD_STATE);
    const rankedFull = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidenceEmpty = buildEngineEvidence(EMPTY_WIZARD_STATE, rankedEmpty[0]);
    const evidenceFull = buildEngineEvidence(SAMPLE_PROFILE, rankedFull[0]);
    const diagEmpty = computeEvidenceDiagnostics(evidenceEmpty, rankedEmpty[0].dimensions, rankedEmpty[0].platform);
    const diagFull = computeEvidenceDiagnostics(evidenceFull, rankedFull[0].dimensions, rankedFull[0].platform);
    expect(diagEmpty.assumptionRatio).toBeGreaterThan(diagFull.assumptionRatio);
  });

  it("raises a freshness warning for a catalog entry older than the documented cutoff", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidence = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const farFuture = new Date(new Date(ranked[0].platform.lastReviewedDate).getTime() + 200 * 24 * 60 * 60 * 1000);
    const diagnostics = computeEvidenceDiagnostics(evidence, ranked[0].dimensions, ranked[0].platform, farFuture);
    expect(diagnostics.freshnessWarnings.length).toBeGreaterThan(0);
  });

  it("raises no freshness warning when evaluated just after the review date", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const evidence = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const dayAfter = new Date(new Date(ranked[0].platform.lastReviewedDate).getTime() + 24 * 60 * 60 * 1000);
    const diagnostics = computeEvidenceDiagnostics(evidence, ranked[0].dimensions, ranked[0].platform, dayAfter);
    expect(diagnostics.freshnessWarnings).toHaveLength(0);
  });

  it("is deterministic for identical input", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const a = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    const b = buildEngineEvidence(SAMPLE_PROFILE, ranked[0]);
    expect(a).toEqual(b);
  });
});
