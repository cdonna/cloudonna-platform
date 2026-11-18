import { describe, expect, it } from "vitest";
import { computeRecentActivity } from "../recent-activity";

describe("computeRecentActivity", () => {
  it("sorts version and impact items together by timestamp, newest first", () => {
    const result = computeRecentActivity(
      [
        { versionNumber: 1, changeReason: null, createdAt: "2026-01-01T00:00:00Z" },
        { versionNumber: 2, changeReason: "Business case saved", createdAt: "2026-01-03T00:00:00Z" },
      ],
      [{ id: "impact-1", decisionId: "d1", changeId: "c1", affectedOption: "Option A", affectedCriterion: null, materiality: "high", recommendationImpact: "x", reviewRecommended: true, createdAt: "2026-01-02T00:00:00Z" }],
    );
    expect(result.map((r) => r.kind)).toEqual(["version", "impact", "version"]);
  });

  it("caps the result at the given limit", () => {
    const versions = Array.from({ length: 10 }, (_, i) => ({ versionNumber: i + 1, changeReason: null, createdAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z` }));
    const result = computeRecentActivity(versions, [], 3);
    expect(result).toHaveLength(3);
  });
});
