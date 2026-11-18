import { describe, expect, it } from "vitest";
import { computeVelocity } from "../sales-velocity";

describe("computeVelocity", () => {
  it("reports insufficient data with fewer than 2 samples", () => {
    expect(computeVelocity([]).insufficientData).toBe(true);
    expect(computeVelocity([{ fromTimestamp: "2026-01-01", toTimestamp: "2026-01-05" }]).insufficientData).toBe(true);
  });

  it("never fabricates an average when data is insufficient", () => {
    const result = computeVelocity([{ fromTimestamp: "2026-01-01", toTimestamp: "2026-01-05" }]);
    expect(result.averageDays).toBeNull();
  });

  it("computes a real average across genuine samples", () => {
    const result = computeVelocity([
      { fromTimestamp: "2026-01-01T00:00:00Z", toTimestamp: "2026-01-05T00:00:00Z" },
      { fromTimestamp: "2026-01-01T00:00:00Z", toTimestamp: "2026-01-11T00:00:00Z" },
    ]);
    expect(result.insufficientData).toBe(false);
    expect(result.averageDays).toBe(7);
    expect(result.sampleSize).toBe(2);
  });

  it("ignores a negative-duration sample (data error) rather than letting it skew the average", () => {
    const result = computeVelocity([
      { fromTimestamp: "2026-01-05T00:00:00Z", toTimestamp: "2026-01-01T00:00:00Z" },
      { fromTimestamp: "2026-01-01T00:00:00Z", toTimestamp: "2026-01-05T00:00:00Z" },
    ]);
    expect(result.insufficientData).toBe(true);
    expect(result.sampleSize).toBe(1);
  });
});
