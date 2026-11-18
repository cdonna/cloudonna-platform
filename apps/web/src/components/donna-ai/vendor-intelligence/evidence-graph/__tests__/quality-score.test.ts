import { describe, expect, it } from "vitest";
import { computeEvidenceQuality } from "../quality-score";

describe("computeEvidenceQuality", () => {
  it("is LOW with no supporting source", () => {
    expect(
      computeEvidenceQuality({
        scope: "global",
        freshness: "current",
        supportingSourceCategories: [],
        supportingEvidenceConfidences: [],
        hasContradictingEvidence: false,
      }).tier,
    ).toBe("low");
  });

  it("is LOW whenever contradicting evidence exists, regardless of how strong the supporting side is", () => {
    const result = computeEvidenceQuality({
      scope: "global",
      freshness: "current",
      supportingSourceCategories: ["official_product_documentation", "official_architecture"],
      supportingEvidenceConfidences: ["high", "high"],
      hasContradictingEvidence: true,
    });
    expect(result.tier).toBe("low");
  });

  it("is HIGH only with official + direct + fresh + multi-source corroboration on a global claim", () => {
    const result = computeEvidenceQuality({
      scope: "global",
      freshness: "current",
      supportingSourceCategories: ["official_product_documentation", "official_release_notes"],
      supportingEvidenceConfidences: ["high", "high"],
      hasContradictingEvidence: false,
    });
    expect(result.tier).toBe("high");
  });

  it("never reaches HIGH for an organization-private claim, even with two strong official sources", () => {
    const result = computeEvidenceQuality({
      scope: "organization_private",
      freshness: "current",
      supportingSourceCategories: ["official_product_documentation", "official_release_notes"],
      supportingEvidenceConfidences: ["high", "high"],
      hasContradictingEvidence: false,
    });
    expect(result.tier).toBe("medium");
  });

  it("is MEDIUM with a single official, directly-stated, non-stale source", () => {
    const result = computeEvidenceQuality({
      scope: "global",
      freshness: "aging",
      supportingSourceCategories: ["official_product_documentation"],
      supportingEvidenceConfidences: ["high"],
      hasContradictingEvidence: false,
    });
    expect(result.tier).toBe("medium");
  });

  it("is LOW when the only supporting evidence is stale", () => {
    const result = computeEvidenceQuality({
      scope: "global",
      freshness: "stale",
      supportingSourceCategories: ["official_product_documentation"],
      supportingEvidenceConfidences: ["high"],
      hasContradictingEvidence: false,
    });
    expect(result.tier).toBe("low");
  });

  it("is LOW when the only supporting source is independent analysis, not official", () => {
    const result = computeEvidenceQuality({
      scope: "global",
      freshness: "current",
      supportingSourceCategories: ["independent_analysis"],
      supportingEvidenceConfidences: ["high"],
      hasContradictingEvidence: false,
    });
    expect(result.tier).toBe("low");
  });

  it("always returns at least one documented reason, never a bare tier", () => {
    const result = computeEvidenceQuality({
      scope: "global",
      freshness: "current",
      supportingSourceCategories: ["official_product_documentation", "official_release_notes"],
      supportingEvidenceConfidences: ["high", "high"],
      hasContradictingEvidence: false,
    });
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
