import { describe, expect, it } from "vitest";
import { runVendorKnowledgeRefresh } from "../vendor-refresh-orchestrator";
import type { VendorRefreshProvider } from "../provider";
import type { VendorRefreshTask } from "../types";
import type { ConflictCandidate } from "../../conflict-detection";

const TASK: VendorRefreshTask = {
  taskId: "task-1",
  productSlug: "databricks",
  capabilityKey: "lakehouse",
  question: "q",
  preferredSourceCategories: [],
};

function providerReturning(result: Awaited<ReturnType<VendorRefreshProvider["retrieveAndExtract"]>>): VendorRefreshProvider {
  return { id: "fake", model: null, retrieveAndExtract: async () => result };
}

describe("runVendorKnowledgeRefresh", () => {
  it("passes through a non-ok provider status untouched", async () => {
    const provider = providerReturning({ status: "retrieval_failed", reason: "boom" });
    const result = await runVendorKnowledgeRefresh(provider, TASK, []);
    expect(result.status).toBe("retrieval_failed");
    expect(result.newClaims).toEqual([]);
  });

  it("dedupes a proposed claim that is already known (reuse-first, brief §30)", async () => {
    const source = { id: "s1", url: "https://docs.databricks.com/x", title: "x", publisher: "databricks.com", publishedAt: null, retrievedAt: "2026-01-01", sourceCategory: "official_product_documentation" as const, contentExcerpt: "x" };
    const provider = providerReturning({
      status: "ok",
      claims: [{ claim: "Supports Delta Lake.", citationIndex: 0, confidence: "high" }],
      sources: [source],
    });
    const existing: ConflictCandidate[] = [{ claimId: "existing-1", productSlug: "databricks", capabilityKey: "lakehouse", claim: "Supports Delta Lake." }];
    const result = await runVendorKnowledgeRefresh(provider, TASK, existing);
    expect(result.duplicateCount).toBe(0); // dedup here is against OTHER proposed claims in this same batch, not existing — see next test for cross-session.
    expect(result.newClaims).toHaveLength(1);
  });

  it("flags a real cross-session conflict against an existing active claim with different, non-duplicate text", async () => {
    const source = { id: "s1", url: "https://docs.example.com/x", title: "x", publisher: "example.com", publishedAt: null, retrievedAt: "2026-01-01", sourceCategory: "official_release_notes" as const, contentExcerpt: "x" };
    const provider = providerReturning({
      status: "ok",
      claims: [{ claim: "Still in preview in the EU region.", citationIndex: 0, confidence: "high" }],
      sources: [source],
    });
    const existing: ConflictCandidate[] = [{ claimId: "existing-1", productSlug: "databricks", capabilityKey: "lakehouse", claim: "Generally available in all regions." }];
    const result = await runVendorKnowledgeRefresh(provider, TASK, existing);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].existingClaimId).toBe("existing-1");
  });

  it("deduplicates two proposed claims within the same batch that are the same fact", async () => {
    const source = { id: "s1", url: "https://docs.example.com/a", title: "a", publisher: "a.com", publishedAt: null, retrievedAt: "2026-01-01", sourceCategory: "official_product_documentation" as const, contentExcerpt: "x" };
    const provider = providerReturning({
      status: "ok",
      claims: [
        { claim: "Supports Delta Lake.", citationIndex: 0, confidence: "high" },
        { claim: "supports delta lake.", citationIndex: 0, confidence: "medium" },
      ],
      sources: [source],
    });
    const result = await runVendorKnowledgeRefresh(provider, TASK, []);
    expect(result.newClaims).toHaveLength(1);
    expect(result.duplicateCount).toBe(1);
  });

  it("drops a claim whose citationIndex has no matching source (defensive, should not happen given provider contract)", async () => {
    const provider = providerReturning({ status: "ok", claims: [{ claim: "x", citationIndex: 9, confidence: "high" }], sources: [] });
    const result = await runVendorKnowledgeRefresh(provider, TASK, []);
    expect(result.newClaims).toEqual([]);
  });
});
