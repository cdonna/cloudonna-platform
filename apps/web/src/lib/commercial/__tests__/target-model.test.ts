import { describe, expect, it } from "vitest";
import { computeTargetModel, DEFAULT_FIRST_MILLION_SCENARIO, FIRST_MILLION_TARGET_CHF } from "../target-model";

describe("computeTargetModel", () => {
  it("reproduces the brief's own worked example exactly: CHF 1,025,000", () => {
    const result = computeTargetModel(DEFAULT_FIRST_MILLION_SCENARIO);
    expect(result.totalBookingsChf).toBe(1_025_000);
  });

  it("is comfortably above the CHF 1,000,000 target in the default scenario", () => {
    const result = computeTargetModel(DEFAULT_FIRST_MILLION_SCENARIO);
    expect(result.totalBookingsChf).toBeGreaterThanOrEqual(FIRST_MILLION_TARGET_CHF);
  });

  it("separates ARR from bookings: Decision Sprints contribute zero ARR (one-time, no renewal term)", () => {
    const result = computeTargetModel(DEFAULT_FIRST_MILLION_SCENARIO);
    const sprintRow = result.assumptions.find((a) => a.packageId === "decision_sprint")!;
    expect(sprintRow.arrChf).toBe(0);
    expect(sprintRow.isRecurring).toBe(false);
  });

  it("Team and Enterprise bookings count fully toward ARR (recurring annual contracts)", () => {
    const result = computeTargetModel(DEFAULT_FIRST_MILLION_SCENARIO);
    const teamRow = result.assumptions.find((a) => a.packageId === "team")!;
    const enterpriseRow = result.assumptions.find((a) => a.packageId === "enterprise")!;
    expect(teamRow.arrChf).toBe(teamRow.bookingsChf);
    expect(enterpriseRow.arrChf).toBe(enterpriseRow.bookingsChf);
    expect(result.totalArrChf).toBe(5 * 75_000 + 2 * 200_000);
  });

  it("assumptions are genuinely editable — a different count changes the total predictably", () => {
    const result = computeTargetModel([{ packageId: "decision_sprint", count: 1, valuePerDealChf: 25_000 }]);
    expect(result.totalBookingsChf).toBe(25_000);
  });

  it("falls back to the package's own indicative starting price when no override is given", () => {
    const result = computeTargetModel([{ packageId: "decision_sprint", count: 2 }]);
    expect(result.totalBookingsChf).toBe(50_000);
  });

  it("never fabricates a value for an empty scenario", () => {
    const result = computeTargetModel([]);
    expect(result.totalBookingsChf).toBe(0);
    expect(result.totalArrChf).toBe(0);
    expect(result.totalTcvChf).toBe(0);
  });
});
