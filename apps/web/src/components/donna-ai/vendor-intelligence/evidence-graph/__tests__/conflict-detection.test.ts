import { describe, expect, it } from "vitest";
import { detectCrossSessionConflicts, type ConflictCandidate } from "../conflict-detection";

describe("detectCrossSessionConflicts", () => {
  it("creates a real conflict for the brief's own GA-vs-preview example, across sessions", () => {
    const active: ConflictCandidate[] = [
      { claimId: "claim-1", productSlug: "ms-fabric", capabilityKey: "data_sovereignty", claim: "The feature is generally available in all regions." },
    ];
    const newClaim = { productSlug: "ms-fabric", capabilityKey: "data_sovereignty", claim: "The feature is still in preview in the EU region." };
    const conflicts = detectCrossSessionConflicts(newClaim, active);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].existingClaimId).toBe("claim-1");
    expect(conflicts[0].severity).toBe("high");
  });

  it("never silently drops the old claim — the caller receives the existing claim id to preserve, not replace", () => {
    const active: ConflictCandidate[] = [{ claimId: "claim-1", productSlug: "aws", capabilityKey: "security", claim: "Supports FIPS 140-2 validated encryption." }];
    const newClaim = { productSlug: "aws", capabilityKey: "security", claim: "Does not support FIPS 140-2 validated encryption in this region." };
    const conflicts = detectCrossSessionConflicts(newClaim, active);
    expect(conflicts[0].existingClaimText).toBe("Supports FIPS 140-2 validated encryption.");
  });

  it("does not flag a conflict when the new claim is a duplicate of the active one", () => {
    const active: ConflictCandidate[] = [{ claimId: "claim-1", productSlug: "snowflake", capabilityKey: "data_warehouse", claim: "Separates storage and compute." }];
    const newClaim = { productSlug: "snowflake", capabilityKey: "data_warehouse", claim: "separates storage and compute." };
    expect(detectCrossSessionConflicts(newClaim, active)).toEqual([]);
  });

  it("never compares claims across different products or capabilities", () => {
    const active: ConflictCandidate[] = [
      { claimId: "claim-1", productSlug: "databricks", capabilityKey: "lakehouse", claim: "Generally available." },
      { claimId: "claim-2", productSlug: "snowflake", capabilityKey: "lakehouse", claim: "Not available." },
    ];
    const newClaim = { productSlug: "databricks", capabilityKey: "security", claim: "Preview only." };
    expect(detectCrossSessionConflicts(newClaim, active)).toEqual([]);
  });

  it("falls back to medium severity when no recognized antonym pair is found, but still raises a conflict", () => {
    const active: ConflictCandidate[] = [{ claimId: "claim-1", productSlug: "oracle", capabilityKey: "governance", claim: "Unity Catalog provides lineage." }];
    const newClaim = { productSlug: "oracle", capabilityKey: "governance", claim: "Purview provides lineage with different scoping rules." };
    const conflicts = detectCrossSessionConflicts(newClaim, active);
    expect(conflicts[0].severity).toBe("medium");
  });
});
