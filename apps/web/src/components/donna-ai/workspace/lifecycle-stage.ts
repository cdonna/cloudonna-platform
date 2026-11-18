/**
 * Lifecycle stage (brief §4/§52) — the canonical UNDERSTAND -> EVIDENCE
 * -> COMPARE -> SIMULATE -> CHALLENGE -> DECIDE -> ALIGN -> REMEMBER
 * progression, with each stage's completion derived from real product
 * state, never a stored "current step" column — a user may revisit an
 * earlier stage at any time (brief §52: "do not force the lifecycle to
 * be strictly linear").
 */
export const LIFECYCLE_STAGES = ["understand", "evidence", "compare", "simulate", "challenge", "decide", "align", "remember"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  understand: "Understand",
  evidence: "Evidence",
  compare: "Compare",
  simulate: "Simulate",
  challenge: "Challenge",
  decide: "Decide",
  align: "Align",
  remember: "Remember",
};

export interface LifecycleStageInput {
  isContextComplete: boolean;
  evidenceCoverage: number;
  hasResearchEvidence: boolean;
  optionCount: number;
  hasBusinessCase: boolean;
  hasScenarioOverrides: boolean;
  hasChallengerRun: boolean;
  hasHumanDecision: boolean;
  hasStakeholders: boolean;
  allStakeholdersReviewed: boolean;
  hasOutcomeRecorded: boolean;
}

/** A stage is "complete" once the product has real, visible evidence
 * that a human engaged with it — never merely "a value happens to be
 * non-null by default." */
export function computeStageCompletion(input: LifecycleStageInput): Record<LifecycleStage, boolean> {
  return {
    understand: input.isContextComplete,
    evidence: input.evidenceCoverage >= 0.5 || input.hasResearchEvidence,
    compare: input.optionCount >= 2,
    simulate: input.hasBusinessCase || input.hasScenarioOverrides,
    challenge: input.hasChallengerRun,
    decide: input.hasHumanDecision,
    align: input.hasStakeholders && input.allStakeholdersReviewed,
    remember: input.hasOutcomeRecorded,
  };
}

/** The first incomplete stage, in canonical order — the stage a user
 * returning to this decision most likely needs to act on next.
 * Returns "remember" (the natural resting stage) once every earlier
 * stage is complete, rather than falling off the end of the list. */
export function computeCurrentStage(completion: Record<LifecycleStage, boolean>): LifecycleStage {
  const firstIncomplete = LIFECYCLE_STAGES.find((stage) => stage !== "remember" && !completion[stage]);
  return firstIncomplete ?? "remember";
}
