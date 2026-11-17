import { describe, expect, it } from "vitest";
import { rankRevalidationQueue, type RevalidationCandidate } from "../revalidation-queue";

function candidate(overrides: Partial<RevalidationCandidate>): RevalidationCandidate {
  return {
    claimId: "claim-1",
    productSlug: "databricks",
    capabilityKey: "architecture",
    verificationStatus: "unknown",
    decisionReferenceCount: 0,
    usedByFragileWinnerDecision: false,
    ...overrides,
  };
}

describe("rankRevalidationQueue", () => {
  it("ranks a stale, high-usage pricing claim above a low-impact, unused architecture claim (the brief's own example)", () => {
    const stalePricingUsedByFive = candidate({
      claimId: "pricing-claim",
      capabilityKey: "cost_management",
      verificationStatus: "stale",
      decisionReferenceCount: 5,
    });
    const unusedArchitectureDetail = candidate({
      claimId: "architecture-claim",
      capabilityKey: "architecture",
      verificationStatus: "verified",
      decisionReferenceCount: 0,
    });
    const ranked = rankRevalidationQueue([unusedArchitectureDetail, stalePricingUsedByFive]);
    expect(ranked[0].claimId).toBe("pricing-claim");
    expect(ranked[0].priorityScore).toBeGreaterThan(ranked[1].priorityScore);
  });

  it("ranks CONFLICTED above STALE above UNKNOWN above VERIFIED, all else equal", () => {
    const conflicted = candidate({ claimId: "a", verificationStatus: "conflicted" });
    const stale = candidate({ claimId: "b", verificationStatus: "stale" });
    const unknown = candidate({ claimId: "c", verificationStatus: "unknown" });
    const verified = candidate({ claimId: "d", verificationStatus: "verified" });
    const ranked = rankRevalidationQueue([verified, unknown, stale, conflicted]);
    expect(ranked.map((r) => r.claimId)).toEqual(["a", "b", "c", "d"]);
  });

  it("gives a fragile-winner-used claim a strict bonus over an otherwise identical claim", () => {
    const fragile = candidate({ claimId: "fragile", usedByFragileWinnerDecision: true });
    const notFragile = candidate({ claimId: "not-fragile", usedByFragileWinnerDecision: false });
    const ranked = rankRevalidationQueue([notFragile, fragile]);
    expect(ranked[0].claimId).toBe("fragile");
  });

  it("caps usage weight so no number of references alone can out-rank a conflicted claim with none", () => {
    const manyReferencesButVerified = candidate({ claimId: "popular", verificationStatus: "verified", decisionReferenceCount: 1000 });
    const conflictedUnused = candidate({ claimId: "conflicted", verificationStatus: "conflicted", decisionReferenceCount: 0 });
    const ranked = rankRevalidationQueue([manyReferencesButVerified, conflictedUnused]);
    expect(ranked[0].claimId).toBe("conflicted");
  });

  it("always returns at least one reason per entry", () => {
    const ranked = rankRevalidationQueue([candidate({})]);
    expect(ranked[0].reasons.length).toBeGreaterThan(0);
  });
});
