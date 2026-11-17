import { describe, expect, it } from "vitest";
import { dedupeClaims, isDuplicateClaim, type SimilarityCandidate } from "../claim-similarity";

describe("isDuplicateClaim", () => {
  it("recognizes identical claim text (case/whitespace insensitive) for the same product+capability as a duplicate", () => {
    const existing: SimilarityCandidate = { productSlug: "databricks", capabilityKey: "lakehouse", claim: "Supports Delta Lake open table format." };
    const candidate: SimilarityCandidate = { productSlug: "databricks", capabilityKey: "lakehouse", claim: "  supports delta lake open table format.  " };
    expect(isDuplicateClaim(candidate, [existing])).toBe(existing);
  });

  it("recognizes a near-verbatim restatement (substring containment) as a duplicate", () => {
    const existing: SimilarityCandidate = { productSlug: "snowflake", capabilityKey: "data_warehouse", claim: "Separates storage and compute for independent scaling." };
    const candidate: SimilarityCandidate = {
      productSlug: "snowflake",
      capabilityKey: "data_warehouse",
      claim: "Separates storage and compute for independent scaling, per official documentation.",
    };
    expect(isDuplicateClaim(candidate, [existing])).toBe(existing);
  });

  it("never merges claims for different products even with identical text", () => {
    const existing: SimilarityCandidate = { productSlug: "databricks", capabilityKey: "lakehouse", claim: "Supports open table formats." };
    const candidate: SimilarityCandidate = { productSlug: "snowflake", capabilityKey: "lakehouse", claim: "Supports open table formats." };
    expect(isDuplicateClaim(candidate, [existing])).toBeNull();
  });

  it("never merges claims for different capabilities even with identical text and product", () => {
    const existing: SimilarityCandidate = { productSlug: "databricks", capabilityKey: "lakehouse", claim: "Available in all major regions." };
    const candidate: SimilarityCandidate = { productSlug: "databricks", capabilityKey: "security", claim: "Available in all major regions." };
    expect(isDuplicateClaim(candidate, [existing])).toBeNull();
  });

  it("does NOT merge two genuinely different claims about the same product/capability (conservative dedup)", () => {
    const existing: SimilarityCandidate = { productSlug: "ms-fabric", capabilityKey: "governance", claim: "Unity Catalog provides centralized governance." };
    const candidate: SimilarityCandidate = { productSlug: "ms-fabric", capabilityKey: "governance", claim: "Purview integration provides data classification." };
    expect(isDuplicateClaim(candidate, [existing])).toBeNull();
  });

  it("does not falsely merge short, unrelated claims via accidental substring containment", () => {
    const existing: SimilarityCandidate = { productSlug: "oracle", capabilityKey: "security", claim: "SOC 2." };
    const candidate: SimilarityCandidate = { productSlug: "oracle", capabilityKey: "security", claim: "ISO 27001." };
    expect(isDuplicateClaim(candidate, [existing])).toBeNull();
  });
});

describe("dedupeClaims", () => {
  it("keeps the first occurrence and counts duplicates", () => {
    const items: SimilarityCandidate[] = [
      { productSlug: "aws", capabilityKey: "security", claim: "Supports customer-managed encryption keys." },
      { productSlug: "aws", capabilityKey: "security", claim: "supports customer-managed encryption keys." },
      { productSlug: "aws", capabilityKey: "compliance", claim: "Holds SOC 2 Type II." },
    ];
    const { unique, duplicateCount } = dedupeClaims(items);
    expect(unique).toHaveLength(2);
    expect(duplicateCount).toBe(1);
  });
});
