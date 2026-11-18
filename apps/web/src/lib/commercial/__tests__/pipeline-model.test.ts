import { describe, expect, it } from "vitest";
import { computePipelineSummary, type PipelineOpportunityInput } from "../pipeline-model";

function opp(overrides: Partial<PipelineOpportunityInput> = {}): PipelineOpportunityInput {
  return { stage: "discovery", expectedAcvChf: null, expectedTcvChf: 100_000, probabilityPercent: null, ...overrides };
}

describe("computePipelineSummary", () => {
  it("sums pipeline value across every open opportunity using TCV when available", () => {
    const result = computePipelineSummary([opp({ expectedTcvChf: 100_000 }), opp({ expectedTcvChf: 50_000 })], {
      targetBookingsChf: 1_000_000,
      bookedChf: 0,
    });
    expect(result.pipelineValueChf).toBe(150_000);
  });

  it("falls back to ACV when TCV is not set", () => {
    const result = computePipelineSummary([opp({ expectedTcvChf: null, expectedAcvChf: 75_000 })], { targetBookingsChf: 0, bookedChf: 0 });
    expect(result.pipelineValueChf).toBe(75_000);
  });

  it("uses the default stage probability when no explicit probability is configured", () => {
    const result = computePipelineSummary([opp({ stage: "sprint_committed", expectedTcvChf: 100_000, probabilityPercent: null })], {
      targetBookingsChf: 0,
      bookedChf: 0,
    });
    // sprint_committed default is 70% per opportunity-stages.ts
    expect(result.weightedPipelineValueChf).toBe(70_000);
  });

  it("an explicit probability always overrides the stage default", () => {
    const result = computePipelineSummary([opp({ stage: "sprint_committed", expectedTcvChf: 100_000, probabilityPercent: 20 })], {
      targetBookingsChf: 0,
      bookedChf: 0,
    });
    expect(result.weightedPipelineValueChf).toBe(20_000);
  });

  it("computes a standard 3x-style coverage ratio: pipeline / remaining gap", () => {
    const result = computePipelineSummary([opp({ expectedTcvChf: 300_000 })], { targetBookingsChf: 1_000_000, bookedChf: 700_000 });
    // remaining = 300,000; pipeline = 300,000 -> coverage = 1.0
    expect(result.coverageRatio).toBe(1);
  });

  it("coverage ratio is null once the target is already fully booked, never a fabricated infinity", () => {
    const result = computePipelineSummary([opp()], { targetBookingsChf: 500_000, bookedChf: 600_000 });
    expect(result.remainingToTargetChf).toBe(0);
    expect(result.coverageRatio).toBeNull();
  });

  it("never goes negative on remainingToTargetChf when already past target", () => {
    const result = computePipelineSummary([], { targetBookingsChf: 500_000, bookedChf: 900_000 });
    expect(result.remainingToTargetChf).toBe(0);
  });
});
