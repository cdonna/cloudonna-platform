import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";
import { detectEvidenceGaps } from "../gap-detector";
import { planResearchTasks } from "../query-planner";

const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

describe("Research Query Planner", () => {
  it("never produces a task for a cell that is already SUPPORTED", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    const supportedCells = new Set(gaps.filter((g) => g.status === "supported").map((g) => `${g.optionId}:${g.criterionId}`));
    for (const task of tasks) {
      expect(supportedCells.has(`${task.optionId}:${task.criterionId}`)).toBe(false);
    }
  });

  it("produces exactly one task per non-supported gap cell", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    const nonSupported = gaps.filter((g) => g.status !== "supported");
    expect(tasks).toHaveLength(nonSupported.length);
  });

  it("every task names the real option and criterion in its question", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps);
    const task = tasks[0];
    const platform = ranked.find((r) => r.platform.id === task.optionId)!;
    expect(task.question).toContain(platform.platform.productName);
  });

  it("scope by criterionId narrows to only that criterion's tasks", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const tasks = planResearchTasks(ranked, gaps, { criterionId: "cost" });
    expect(tasks.every((t) => t.criterionId === "cost")).toBe(true);
  });

  it("scope by optionId narrows to only that option's tasks", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const optionId = ranked[0].platform.id;
    const tasks = planResearchTasks(ranked, gaps, { optionId });
    expect(tasks.every((t) => t.optionId === optionId)).toBe(true);
  });

  it("is deterministic for identical input", () => {
    const gaps = detectEvidenceGaps(ranked, []);
    const a = planResearchTasks(ranked, gaps);
    const b = planResearchTasks(ranked, gaps);
    expect(a).toEqual(b);
  });
});
