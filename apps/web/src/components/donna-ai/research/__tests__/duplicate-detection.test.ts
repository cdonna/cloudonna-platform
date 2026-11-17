import { describe, expect, it } from "vitest";
import { dedupeProposedEvidence, isDuplicateEvidence } from "../duplicate-detection";
import type { ResearchEvidence } from "../types";

function fakeEvidence(overrides: Partial<ResearchEvidence>): ResearchEvidence {
  return {
    id: "e1",
    type: "official-source",
    claim: "Fabric supports OneLake as its unified logical data lake.",
    interpretation: null,
    sourceUrl: "https://learn.microsoft.com/fabric/onelake",
    sourceTitle: "OneLake overview",
    publisher: "Microsoft",
    publishedAt: null,
    retrievedAt: new Date().toISOString(),
    criterionId: "architecture",
    optionId: "ms-fabric",
    confidence: "high",
    freshness: "unknown",
    researchTaskId: "task-1",
    agentVersion: "research-agent-v1",
    status: "proposed",
    metadata: {},
    ...overrides,
  };
}

describe("Duplicate Detection", () => {
  it("flags a near-identical restatement from the same URL as a duplicate", () => {
    const existing = [fakeEvidence({})];
    const candidate = fakeEvidence({ claim: "Fabric supports OneLake as its unified logical data lake" }); // same sentence, no trailing period
    expect(isDuplicateEvidence(candidate, existing)).not.toBeNull();
  });

  it("does NOT flag two genuinely different claims from the same URL as duplicates — one page can support several distinct facts", () => {
    const existing = [fakeEvidence({})];
    const candidate = fakeEvidence({ claim: "Fabric also provides native integration with Power BI for reporting." });
    expect(isDuplicateEvidence(candidate, existing)).toBeNull();
  });

  it("flags identical claim text (modulo whitespace/case) as a duplicate even from a different URL", () => {
    const existing = [fakeEvidence({})];
    const candidate = fakeEvidence({ sourceUrl: "https://other.example/doc", claim: "  FABRIC SUPPORTS ONELAKE AS ITS UNIFIED LOGICAL DATA LAKE.  " });
    expect(isDuplicateEvidence(candidate, existing)).not.toBeNull();
  });

  it("does not flag the same claim text for a different option as a duplicate", () => {
    const existing = [fakeEvidence({})];
    const candidate = fakeEvidence({ optionId: "databricks" });
    expect(isDuplicateEvidence(candidate, existing)).toBeNull();
  });

  it("does not flag the same claim text for a different criterion as a duplicate", () => {
    const existing = [fakeEvidence({})];
    const candidate = fakeEvidence({ criterionId: "cost" });
    expect(isDuplicateEvidence(candidate, existing)).toBeNull();
  });

  it("does not flag a genuinely different claim, URL, option and criterion as a duplicate", () => {
    const existing = [fakeEvidence({})];
    const candidate = fakeEvidence({ sourceUrl: "https://other.example", claim: "Something else entirely.", optionId: "databricks", criterionId: "cost" });
    expect(isDuplicateEvidence(candidate, existing)).toBeNull();
  });

  it("dedupeProposedEvidence keeps the first occurrence and counts the rest as duplicates", () => {
    const items = [fakeEvidence({ id: "a" }), fakeEvidence({ id: "b" }), fakeEvidence({ id: "c", optionId: "databricks" })];
    const result = dedupeProposedEvidence(items);
    expect(result.unique.map((i) => i.id)).toEqual(["a", "c"]);
    expect(result.duplicateCount).toBe(1);
  });
});
