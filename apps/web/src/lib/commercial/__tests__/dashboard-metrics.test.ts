import { describe, expect, it } from "vitest";
import { computeCommercialDashboard, type DashboardOpportunityInput } from "../dashboard-metrics";

function opp(overrides: Partial<DashboardOpportunityInput> = {}): DashboardOpportunityInput {
  return { stage: "discovery", commercialPackage: "decision_sprint", expectedAcvChf: null, expectedTcvChf: 25_000, probabilityPercent: null, ...overrides };
}

describe("computeCommercialDashboard", () => {
  it("counts only closed_won opportunities toward bookedChf", () => {
    const result = computeCommercialDashboard([opp({ stage: "closed_won", expectedTcvChf: 25_000 }), opp({ stage: "discovery", expectedTcvChf: 25_000 })]);
    expect(result.bookedChf).toBe(25_000);
  });

  it("ARR only includes closed_won recurring packages (team/enterprise), never one-time Decision Sprints", () => {
    const result = computeCommercialDashboard([
      opp({ stage: "closed_won", commercialPackage: "decision_sprint", expectedTcvChf: 25_000 }),
      opp({ stage: "closed_won", commercialPackage: "team", expectedTcvChf: 75_000 }),
    ]);
    expect(result.arrChf).toBe(75_000);
  });

  it("excludes closed opportunities (won or lost) from the open pipeline", () => {
    const result = computeCommercialDashboard([opp({ stage: "closed_won" }), opp({ stage: "closed_lost" }), opp({ stage: "discovery" })]);
    expect(result.openOpportunityCount).toBe(1);
  });

  it("breaks down counts by commercial package correctly", () => {
    const result = computeCommercialDashboard([
      opp({ commercialPackage: "decision_sprint", stage: "discovery" }),
      opp({ commercialPackage: "team", stage: "closed_won" }),
      opp({ commercialPackage: "enterprise", stage: "enterprise_evaluation" }),
    ]);
    expect(result.byPackage.decision_sprint.open).toBe(1);
    expect(result.byPackage.team.closedWon).toBe(1);
    expect(result.byPackage.enterprise.open).toBe(1);
  });

  it("is on track only when booked + weighted pipeline together reach the target", () => {
    const farFromTarget = computeCommercialDashboard([opp({ stage: "discovery", expectedTcvChf: 10_000 })], 1_000_000);
    expect(farFromTarget.onTrackForTarget).toBe(false);

    const atTarget = computeCommercialDashboard([opp({ stage: "closed_won", expectedTcvChf: 1_000_000 })], 1_000_000);
    expect(atTarget.onTrackForTarget).toBe(true);
  });
});
