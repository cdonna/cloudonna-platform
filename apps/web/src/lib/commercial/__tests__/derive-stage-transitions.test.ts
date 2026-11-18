import { describe, expect, it } from "vitest";
import { deriveStageTransitionSamples } from "../sales-velocity";

describe("deriveStageTransitionSamples", () => {
  it("derives real samples only for opportunities with a logged transition, skipping the rest", () => {
    const opportunities = [
      { id: "opp-1", createdAt: "2026-01-01T00:00:00Z" },
      { id: "opp-2", createdAt: "2026-01-01T00:00:00Z" },
    ];
    const activities = [
      { opportunityId: "opp-1", afterStage: "qualified", createdAt: "2026-01-05T00:00:00Z" },
      { opportunityId: "opp-1", afterStage: "sprint_proposed", createdAt: "2026-01-10T00:00:00Z" },
      { opportunityId: "opp-1", afterStage: "closed_won", createdAt: "2026-01-20T00:00:00Z" },
    ];
    const result = deriveStageTransitionSamples(opportunities, activities);
    expect(result.inquiryToQualified).toHaveLength(1);
    expect(result.qualifiedToProposal).toHaveLength(1);
    expect(result.proposalToSigned).toHaveLength(1);
    expect(result.proposalToSigned[0].fromTimestamp).toBe("2026-01-10T00:00:00Z");
    expect(result.proposalToSigned[0].toTimestamp).toBe("2026-01-20T00:00:00Z");
  });

  it("produces nothing for an opportunity with no logged stage-change activity at all", () => {
    const result = deriveStageTransitionSamples([{ id: "opp-1", createdAt: "2026-01-01T00:00:00Z" }], []);
    expect(result.inquiryToQualified).toHaveLength(0);
  });
});
