import { describe, expect, it } from "vitest";
import { checkStopConditions, MAX_TASKS_PER_SESSION } from "../stop-conditions";

const base = { tasksCompleted: 0, tasksRemaining: 1, duplicateCount: 0, proposedCount: 0, noSourceFoundStreak: 0, elapsedMs: 0 };

describe("Research Stop Conditions", () => {
  it("stops when no tasks remain", () => {
    expect(checkStopConditions({ ...base, tasksRemaining: 0 })).toEqual({ stop: true, reason: "all_tasks_completed" });
  });

  it("stops once the max task count is reached, even with tasks remaining", () => {
    expect(checkStopConditions({ ...base, tasksCompleted: MAX_TASKS_PER_SESSION, tasksRemaining: 5 })).toEqual({
      stop: true,
      reason: "max_task_count_reached",
    });
  });

  it("stops once the time budget is exceeded", () => {
    expect(checkStopConditions({ ...base, elapsedMs: 10_000_000 })).toEqual({ stop: true, reason: "time_budget_reached" });
  });

  it("stops when duplicate ratio is high with enough samples", () => {
    expect(checkStopConditions({ ...base, proposedCount: 3, duplicateCount: 5 })).toEqual({ stop: true, reason: "duplicate_ratio_high" });
  });

  it("does not stop for duplicate ratio with too few samples", () => {
    const result = checkStopConditions({ ...base, proposedCount: 0, duplicateCount: 1 });
    expect(result.reason).not.toBe("duplicate_ratio_high");
  });

  it("stops after three consecutive no-source-found results", () => {
    expect(checkStopConditions({ ...base, noSourceFoundStreak: 3 })).toEqual({ stop: true, reason: "no_authoritative_sources_found" });
  });

  it("does not stop when nothing has triggered", () => {
    expect(checkStopConditions(base)).toEqual({ stop: false, reason: null });
  });
});
