/**
 * Coverage metrics (brief §41) — deterministic counts/statuses only,
 * never a vanity percentage invented to look complete. "Coverage" here
 * means "out of the 28 canonical capability categories, how many does
 * this product have at least one active claim for" — an honest
 * denominator (CAPABILITY_CATEGORY_KEYS.length), not a hidden one.
 */
import type { FreshnessCategory } from "./freshness-v2";
import { CAPABILITY_CATEGORY_KEYS, type CapabilityClaim } from "./types";

export interface ProductCoverageMetrics {
  capabilityCoverage: { covered: number; total: number };
  evidenceCoverage: { withEvidence: number; total: number };
  freshnessCoverage: { current: number; aging: number; stale: number; unknown: number };
  conflictCount: number;
  unknownCount: number;
}

export interface CoverageClaimInput {
  claim: CapabilityClaim;
  /** The claim's own freshness, as classified by the caller from its
   * strongest supporting evidence's source (freshness-v2.ts) — kept
   * as an explicit input rather than recomputed here, since this
   * module has no access to evidence/source rows and should not
   * silently assume one. */
  freshness: FreshnessCategory;
}

/**
 * `entries` should be every ACTIVE claim for one product (any
 * lifecycle other than active is excluded by the caller before this
 * runs — this function does not filter lifecycle itself, so it stays
 * a pure counting function over whatever set it is given).
 */
export function computeProductCoverage(entries: CoverageClaimInput[]): ProductCoverageMetrics {
  const coveredCapabilities = new Set(entries.map((e) => e.claim.capabilityKey));

  const freshnessCoverage = { current: 0, aging: 0, stale: 0, unknown: 0 };
  let withEvidence = 0;
  let conflictCount = 0;
  let unknownCount = 0;

  for (const { claim, freshness } of entries) {
    if (claim.evidenceQuality !== null) withEvidence += 1;
    if (claim.verificationStatus === "conflicted") conflictCount += 1;
    if (claim.verificationStatus === "unknown") unknownCount += 1;
    freshnessCoverage[freshness] += 1;
  }

  return {
    capabilityCoverage: { covered: coveredCapabilities.size, total: CAPABILITY_CATEGORY_KEYS.length },
    evidenceCoverage: { withEvidence, total: entries.length },
    freshnessCoverage,
    conflictCount,
    unknownCount,
  };
}
