import { describe, expect, it } from "vitest";
import { computeScenario, DEFAULT_SCENARIOS } from "../scenario-planning";

describe("computeScenario", () => {
  it("computes the BASE scenario deterministically", () => {
    const result = computeScenario(DEFAULT_SCENARIOS.base);
    expect(result.sprintsBookingsChf).toBe(10 * 25_000);
    expect(result.impliedTeamCount).toBe(5);
    expect(result.teamBookingsChf).toBe(5 * 75_000);
    expect(result.enterpriseBookingsChf).toBe(2 * 200_000);
    expect(result.totalBookingsChf).toBe(10 * 25_000 + 5 * 75_000 + 2 * 200_000);
    expect(result.totalBookingsChf).toBe(1_025_000);
  });

  it("UPSIDE always produces a higher total than DOWNSIDE for the shipped defaults", () => {
    const upside = computeScenario(DEFAULT_SCENARIOS.upside);
    const downside = computeScenario(DEFAULT_SCENARIOS.downside);
    expect(upside.totalBookingsChf).toBeGreaterThan(downside.totalBookingsChf);
  });

  it("a zero sprint-to-team conversion rate implies zero teams, never a fabricated nonzero count", () => {
    const result = computeScenario({ ...DEFAULT_SCENARIOS.base, sprintToTeamConversionRate: 0 });
    expect(result.impliedTeamCount).toBe(0);
    expect(result.teamBookingsChf).toBe(0);
  });
});
