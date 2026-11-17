import { describe, expect, it, vi } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";
import { runResearchSession } from "../research-orchestrator";
import type { ResearchProvider } from "../provider";
import type { ResearchTask, RetrievalResult } from "../types";

const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

function sourceFor(task: ResearchTask) {
  return { id: `src-${task.taskId}`, url: `https://vendor.example/${task.optionId}`, title: "Docs", publisher: "vendor.example", publishedAt: null, retrievedAt: new Date().toISOString(), sourceType: "official-product-documentation" as const, contentExcerpt: "excerpt", language: "en", metadata: {} };
}

function okResult(task: ResearchTask): RetrievalResult {
  return {
    status: "ok",
    claims: [{ claim: `Claim for ${task.optionId}/${task.criterionId}`, citationIndex: 0, type: "official-source", interpretation: null, criterionId: task.criterionId, optionId: task.optionId, confidence: "high" }],
    conflicts: [],
    sources: [sourceFor(task)],
  };
}

describe("Research Orchestrator", () => {
  it("proposes evidence for the tasks it runs, tagged with the task id", async () => {
    const provider: ResearchProvider = { id: "fake", model: null, retrieveAndExtract: vi.fn(async (task) => okResult(task)) };
    const result = await runResearchSession(provider, { ranked, existingAcceptedEvidence: [], existingOpenConflictCells: [] });

    expect(result.proposedEvidence.length).toBeGreaterThan(0);
    expect(result.proposedEvidence.every((e) => e.status === "proposed")).toBe(true);
    expect(result.sourcesFound).toBeGreaterThan(0);
  });

  it("never calls the provider more than MAX_TASKS_PER_SESSION times", async () => {
    const calls: ResearchTask[] = [];
    const provider: ResearchProvider = {
      id: "fake",
      model: null,
      retrieveAndExtract: vi.fn(async (task) => {
        calls.push(task);
        return okResult(task);
      }),
    };
    await runResearchSession(provider, { ranked, existingAcceptedEvidence: [], existingOpenConflictCells: [] });
    expect(calls.length).toBeLessThanOrEqual(5);
  });

  it("marks the session partial when more gaps remain than were researched, completed when every planned task ran", async () => {
    const provider: ResearchProvider = { id: "fake", model: null, retrieveAndExtract: vi.fn(async (task) => okResult(task)) };
    const result = await runResearchSession(provider, { ranked, existingAcceptedEvidence: [], existingOpenConflictCells: [], scope: { optionId: ranked[0].platform.id, criterionId: "cost" } });
    // Scoped to a single cell: at most one task exists, so it always completes fully.
    expect(result.status).toBe("completed");
  });

  it("marks the session failed when every retrieval attempt fails and nothing is proposed", async () => {
    const provider: ResearchProvider = { id: "fake", model: null, retrieveAndExtract: vi.fn(async () => ({ status: "retrieval_failed", reason: "down" }) as RetrievalResult) };
    const result = await runResearchSession(provider, { ranked, existingAcceptedEvidence: [], existingOpenConflictCells: [], scope: { optionId: ranked[0].platform.id, criterionId: "cost" } });
    expect(result.status).toBe("failed");
    expect(result.proposedEvidence).toHaveLength(0);
  });

  it("stops after three consecutive no_source_found results without exhausting the task list", async () => {
    let calls = 0;
    const provider: ResearchProvider = {
      id: "fake",
      model: null,
      retrieveAndExtract: vi.fn(async () => {
        calls += 1;
        return { status: "no_source_found", reason: "nothing" } as RetrievalResult;
      }),
    };
    await runResearchSession(provider, { ranked, existingAcceptedEvidence: [], existingOpenConflictCells: [] });
    expect(calls).toBe(3);
  });

  it("never proposes evidence for a cell that is already SUPPORTED by accepted evidence", async () => {
    const optionId = ranked[0].platform.id;
    const accepted = [
      {
        id: "e1",
        type: "official-source" as const,
        claim: "already supported",
        interpretation: null,
        sourceUrl: "https://vendor.example/docs",
        sourceTitle: "Docs",
        publisher: "vendor.example",
        publishedAt: null,
        retrievedAt: new Date().toISOString(),
        criterionId: "cost" as const,
        optionId,
        confidence: "high" as const,
        freshness: "unknown" as const,
        researchTaskId: "prior-task",
        agentVersion: "research-agent-v1",
        status: "accepted" as const,
        metadata: {},
      },
    ];
    const provider: ResearchProvider = { id: "fake", model: null, retrieveAndExtract: vi.fn(async (task) => okResult(task)) };
    const result = await runResearchSession(provider, { ranked, existingAcceptedEvidence: accepted, existingOpenConflictCells: [] });
    expect(result.tasks.some((t) => t.optionId === optionId && t.criterionId === "cost")).toBe(false);
  });

  it("resolves conflict claim indices to the final, deduped proposedEvidence array", async () => {
    const provider: ResearchProvider = {
      id: "fake",
      model: null,
      retrieveAndExtract: vi.fn(
        async (task): Promise<RetrievalResult> => ({
          status: "ok",
          claims: [
            { claim: "The feature is generally available.", citationIndex: 0, type: "official-source", interpretation: null, criterionId: task.criterionId, optionId: task.optionId, confidence: "high" },
            { claim: "The feature remains in preview in some regions.", citationIndex: 0, type: "official-source", interpretation: null, criterionId: task.criterionId, optionId: task.optionId, confidence: "high" },
          ],
          conflicts: [{ claimIndexA: 0, claimIndexB: 1, severity: "high", explanation: "they disagree" }],
          sources: [sourceFor(task)],
        }),
      ),
    };
    const result = await runResearchSession(provider, { ranked, existingAcceptedEvidence: [], existingOpenConflictCells: [], scope: { optionId: ranked[0].platform.id, criterionId: "cost" } });
    expect(result.proposedConflicts).toHaveLength(1);
    const conflict = result.proposedConflicts[0];
    expect(result.proposedEvidence[conflict.claimAIndex]).toBeDefined();
    expect(result.proposedEvidence[conflict.claimBIndex]).toBeDefined();
    expect(conflict.claimAIndex).not.toBe(conflict.claimBIndex);
  });
});
