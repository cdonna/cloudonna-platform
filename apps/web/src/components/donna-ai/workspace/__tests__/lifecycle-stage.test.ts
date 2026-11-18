import { describe, expect, it } from "vitest";
import { computeCurrentStage, computeStageCompletion, type LifecycleStageInput } from "../lifecycle-stage";

const COMPLETE: LifecycleStageInput = {
  isContextComplete: true,
  evidenceCoverage: 1,
  hasResearchEvidence: true,
  optionCount: 3,
  hasBusinessCase: true,
  hasScenarioOverrides: false,
  hasChallengerRun: true,
  hasHumanDecision: true,
  hasStakeholders: true,
  allStakeholdersReviewed: true,
  hasOutcomeRecorded: true,
};

describe("computeStageCompletion / computeCurrentStage", () => {
  it("marks every stage complete and rests on remember when everything is done", () => {
    const completion = computeStageCompletion(COMPLETE);
    expect(Object.values(completion).every(Boolean)).toBe(true);
    expect(computeCurrentStage(completion)).toBe("remember");
  });

  it("returns the first incomplete stage, in canonical order, regardless of which later stages are done", () => {
    const completion = computeStageCompletion({ ...COMPLETE, hasBusinessCase: false, hasScenarioOverrides: false });
    expect(completion.simulate).toBe(false);
    expect(computeCurrentStage(completion)).toBe("simulate");
  });

  it("treats a decision with no context, no evidence, and one option as needing Understand first", () => {
    const completion = computeStageCompletion({ ...COMPLETE, isContextComplete: false });
    expect(computeCurrentStage(completion)).toBe("understand");
  });
});
