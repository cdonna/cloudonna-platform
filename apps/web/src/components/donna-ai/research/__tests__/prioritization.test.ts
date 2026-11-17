import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";
import { detectEvidenceGaps } from "../gap-detector";
import { planResearchTasks } from "../query-planner";
import { prioritizeTasks } from "../prioritization";

const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

describe("Research Prioritization", () => {
  it("sorts tasks by priorityScore, descending", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    const prioritized = prioritizeTasks(tasks, ranked, gaps);
    for (let i = 1; i < prioritized.length; i += 1) {
      expect(prioritized[i - 1].priorityScore).toBeGreaterThanOrEqual(prioritized[i].priorityScore);
    }
  });

  it("assigns a MISSING-gap task a higher score than an otherwise-identical WEAK-gap task on the same criterion", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    if (tasks.length === 0) return;
    const sample = tasks[0];
    const missingGaps = [{ ...gaps.find((g) => g.optionId === sample.optionId && g.criterionId === sample.criterionId)!, status: "missing" as const }];
    const weakGaps = [{ ...missingGaps[0], status: "weak" as const }];

    const [missingScored] = prioritizeTasks([sample], ranked, missingGaps);
    const [weakScored] = prioritizeTasks([sample], ranked, weakGaps);
    expect(missingScored.priorityScore).toBeGreaterThan(weakScored.priorityScore);
  });

  it("never assigns a negative priority score", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    const prioritized = prioritizeTasks(tasks, ranked, gaps);
    for (const task of prioritized) {
      expect(task.priorityScore).toBeGreaterThanOrEqual(0);
    }
  });

  it("is deterministic for identical input", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    const a = prioritizeTasks(tasks, ranked, gaps);
    const b = prioritizeTasks(tasks, ranked, gaps);
    expect(a).toEqual(b);
  });
});
