import { describe, expect, it } from "vitest";
import { classifyEvidence } from "../evidence-classification";
import type { ProposedClaim, SourceDocument } from "../types";

const source: SourceDocument = {
  id: "s1",
  url: "https://learn.microsoft.com/fabric/onelake",
  title: "OneLake overview",
  publisher: "learn.microsoft.com",
  publishedAt: "2026-06-01",
  retrievedAt: "2026-11-17T00:00:00.000Z",
  sourceType: "official-product-documentation",
  contentExcerpt: "Fabric supports OneLake as its unified logical data lake.",
  language: "en",
  metadata: {},
};

const claim: ProposedClaim = {
  claim: "Fabric supports OneLake as its unified logical data lake.",
  citationIndex: 0,
  type: "official-source",
  interpretation: null,
  criterionId: "architecture",
  optionId: "ms-fabric",
  confidence: "high",
};

describe("Evidence Classification", () => {
  it("always proposes with status proposed, never accepted", () => {
    const draft = classifyEvidence(claim, source, "task-1");
    expect(draft.status).toBe("proposed");
  });

  it("carries real provenance through from the source", () => {
    const draft = classifyEvidence(claim, source, "task-1");
    expect(draft.sourceUrl).toBe(source.url);
    expect(draft.sourceTitle).toBe(source.title);
    expect(draft.publisher).toBe(source.publisher);
    expect(draft.researchTaskId).toBe("task-1");
    expect(draft.agentVersion).toBe("research-agent-v1");
  });

  it("derives freshness deterministically from the source's publishedAt and type", () => {
    const draft = classifyEvidence(claim, source, "task-1");
    expect(["current", "aging", "stale", "unknown"]).toContain(draft.freshness);
  });

  it("keeps interpretation separate from claim — never merges an ai-interpretation claim's inference into the claim text", () => {
    const interpretedClaim: ProposedClaim = { ...claim, type: "ai-interpretation", interpretation: "This suggests broad lakehouse interoperability." };
    const draft = classifyEvidence(interpretedClaim, source, "task-1");
    expect(draft.claim).toBe(claim.claim);
    expect(draft.interpretation).toBe("This suggests broad lakehouse interoperability.");
  });

  it("is deterministic for identical input", () => {
    const a = classifyEvidence(claim, source, "task-1");
    const b = classifyEvidence(claim, source, "task-1");
    expect(a).toEqual(b);
  });
});
