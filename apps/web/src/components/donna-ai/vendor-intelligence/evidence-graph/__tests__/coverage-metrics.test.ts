import { describe, expect, it } from "vitest";
import { computeProductCoverage, type CoverageClaimInput } from "../coverage-metrics";
import { CAPABILITY_CATEGORY_KEYS } from "../types";
import type { CapabilityClaim } from "../types";

function claim(overrides: Partial<CapabilityClaim>): CapabilityClaim {
  return {
    id: "claim-1",
    vendorSlug: "databricks",
    productSlug: "databricks",
    capabilityKey: "lakehouse",
    claim: "Supports Delta Lake.",
    verificationStatus: "verified",
    lifecycleStatus: "active",
    evidenceQuality: "high",
    validFrom: null,
    validTo: null,
    lastVerifiedAt: null,
    version: 1,
    supersededBy: null,
    scope: "global",
    organizationId: null,
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeProductCoverage", () => {
  it("reports the honest total denominator — the full canonical capability list, not a hidden subset", () => {
    const result = computeProductCoverage([]);
    expect(result.capabilityCoverage.total).toBe(CAPABILITY_CATEGORY_KEYS.length);
    expect(result.capabilityCoverage.covered).toBe(0);
  });

  it("counts distinct covered capabilities, not distinct claims", () => {
    const entries: CoverageClaimInput[] = [
      { claim: claim({ id: "a", capabilityKey: "lakehouse" }), freshness: "current" },
      { claim: claim({ id: "b", capabilityKey: "lakehouse" }), freshness: "current" },
      { claim: claim({ id: "c", capabilityKey: "security" }), freshness: "current" },
    ];
    const result = computeProductCoverage(entries);
    expect(result.capabilityCoverage.covered).toBe(2);
    expect(result.evidenceCoverage.total).toBe(3);
  });

  it("counts conflicts and unknowns separately and correctly", () => {
    const entries: CoverageClaimInput[] = [
      { claim: claim({ id: "a", verificationStatus: "conflicted" }), freshness: "current" },
      { claim: claim({ id: "b", verificationStatus: "unknown", evidenceQuality: null }), freshness: "unknown" },
      { claim: claim({ id: "c", verificationStatus: "verified" }), freshness: "current" },
    ];
    const result = computeProductCoverage(entries);
    expect(result.conflictCount).toBe(1);
    expect(result.unknownCount).toBe(1);
    expect(result.evidenceCoverage.withEvidence).toBe(2);
  });

  it("buckets freshness exactly as given, never recomputing it", () => {
    const entries: CoverageClaimInput[] = [
      { claim: claim({ id: "a" }), freshness: "current" },
      { claim: claim({ id: "b" }), freshness: "aging" },
      { claim: claim({ id: "c" }), freshness: "stale" },
      { claim: claim({ id: "d" }), freshness: "unknown" },
    ];
    const result = computeProductCoverage(entries);
    expect(result.freshnessCoverage).toEqual({ current: 1, aging: 1, stale: 1, unknown: 1 });
  });
});
