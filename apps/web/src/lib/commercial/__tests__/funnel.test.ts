import { describe, expect, it } from "vitest";
import { computeCommercialFunnel, type FunnelActivityInput, type FunnelOpportunityInput } from "../funnel";

describe("computeCommercialFunnel", () => {
  it("reports insufficient data with zero opportunities", () => {
    const result = computeCommercialFunnel([], [], { sprintCompletedCount: 0, teamConversionCount: 0, enterpriseExpansionCount: 0 });
    expect(result.insufficientData).toBe(true);
  });

  it("credits a closed-lost opportunity with every stage it actually reached, via its logged activity history", () => {
    const opportunities: FunnelOpportunityInput[] = [{ id: "opp-1", stage: "closed_lost" }];
    const activities: FunnelActivityInput[] = [
      { opportunityId: "opp-1", stageAfter: "qualified" },
      { opportunityId: "opp-1", stageAfter: "discovery" },
      { opportunityId: "opp-1", stageAfter: "sprint_proposed" },
    ];
    const result = computeCommercialFunnel(opportunities, activities, { sprintCompletedCount: 0, teamConversionCount: 0, enterpriseExpansionCount: 0 });
    const sprintProposed = result.stages.find((s) => s.stage === "sprint_proposed");
    const closedWon = result.stages.find((s) => s.stage === "closed_won");
    expect(sprintProposed?.count).toBe(1);
    expect(closedWon?.count).toBe(0); // never actually won
  });

  it("computes a real conversion rate between adjacent stages and null when the previous stage is empty", () => {
    const opportunities: FunnelOpportunityInput[] = [
      { id: "a", stage: "qualified" },
      { id: "b", stage: "inquiry" },
    ];
    const result = computeCommercialFunnel(opportunities, [], { sprintCompletedCount: 0, teamConversionCount: 0, enterpriseExpansionCount: 0 });
    const inquiry = result.stages.find((s) => s.stage === "inquiry")!;
    const qualified = result.stages.find((s) => s.stage === "qualified")!;
    expect(inquiry.count).toBe(2);
    expect(qualified.count).toBe(1);
    expect(qualified.conversionRateFromPrevious).toBe(0.5);

    const sprintProposed = result.stages.find((s) => s.stage === "sprint_proposed")!;
    const closedWon = result.stages.find((s) => s.stage === "closed_won")!;
    expect(sprintProposed.count).toBe(0);
    expect(closedWon.conversionRateFromPrevious).toBeNull();
  });
});
