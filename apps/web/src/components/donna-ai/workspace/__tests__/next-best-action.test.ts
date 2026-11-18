import { describe, expect, it } from "vitest";
import { computeNextBestAction } from "../next-best-action";
import type { DecisionReadiness } from "../decision-readiness";

const CLEAN: DecisionReadiness = { level: "HIGH", dimensions: [], blockers: [] };

describe("computeNextBestAction", () => {
  it("returns null once a human decision has been recorded — nothing left to recommend", () => {
    expect(computeNextBestAction(CLEAN, true)).toBeNull();
  });

  it("prioritizes a critical blocker over a missing dimension", () => {
    const readiness: DecisionReadiness = {
      level: "LOW",
      dimensions: [{ key: "economic_model", label: "Economic model completeness", status: "missing", detail: "x" }],
      blockers: [{ code: "hard_constraint_violated", message: "x", severity: "critical" }],
    };
    const action = computeNextBestAction(readiness, false);
    expect(action?.stage).toBe("understand");
  });

  it("recommends recording the decision once readiness is HIGH and nothing is missing", () => {
    const action = computeNextBestAction(CLEAN, false);
    expect(action).toEqual({ label: "Record the final human decision", stage: "decide" });
  });
});
