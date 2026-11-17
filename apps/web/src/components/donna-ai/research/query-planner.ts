/**
 * Research Query Planner (brief §5) — derives ResearchTask[] purely
 * from the decision's own already-computed state: the gap matrix
 * (research/gap-detector.ts), the Decision Engine's criteria/weights,
 * and the real option catalog. No AI call here; a task is a question
 * to go research, not an answer.
 */
import { SCORE_DIMENSION_LABELS, SCORE_WEIGHTS } from "../scoring/weights";
import type { RankedPlatform } from "../scoring/types";
import type { ScoreDimensionKey } from "../types";
import type { GapCell, ResearchTask, SourceType } from "./types";

/** Which source types are worth asking for, per criterion — a short,
 * fixed mapping, not a free-text prompt left for the model to guess.
 * Falls back to the two most generally useful types when a criterion
 * isn't named here. */
const CRITERION_SOURCE_TYPES: Partial<Record<ScoreDimensionKey, SourceType[]>> = {
  security: ["official-security-compliance", "official-architecture"],
  governance: ["official-security-compliance", "official-architecture"],
  architecture: ["official-architecture", "official-product-documentation"],
  cost: ["official-pricing-licensing"],
  technology: ["official-product-documentation", "official-release-notes"],
  aiReadiness: ["official-product-documentation", "official-release-notes"],
};
const DEFAULT_SOURCE_TYPES: SourceType[] = ["official-vendor-documentation", "official-product-documentation"];

function buildQuestion(platformName: string, criterionLabel: string): string {
  return `What does official ${platformName} documentation say about ${criterionLabel.toLowerCase()}?`;
}

function taskIdFor(cell: GapCell): string {
  return `task-${cell.optionId}-${cell.criterionId}`;
}

export interface QueryPlannerScope {
  criterionId?: ScoreDimensionKey;
  optionId?: string;
}

/**
 * One task per gap cell that is not already SUPPORTED, optionally
 * narrowed to a single criterion and/or option (brief §26's "Research
 * This Criterion" / "Research This Option" actions). `priorityScore`
 * is left at 0 here — research/prioritization.ts is the only module
 * that sets it, so there is exactly one place a task's ordering is
 * decided.
 */
export function planResearchTasks(ranked: RankedPlatform[], gaps: GapCell[], scope: QueryPlannerScope = {}): ResearchTask[] {
  const platformByid = new Map(ranked.map((r) => [r.platform.id, r]));

  return gaps
    .filter((cell) => cell.status !== "supported")
    .filter((cell) => (scope.criterionId ? cell.criterionId === scope.criterionId : true))
    .filter((cell) => (scope.optionId ? cell.optionId === scope.optionId : true))
    .map((cell) => {
      const platform = platformByid.get(cell.optionId);
      const platformName = platform ? `${platform.platform.vendor} ${platform.platform.productName}` : cell.optionId;
      const criterionLabel = SCORE_DIMENSION_LABELS[cell.criterionId];

      return {
        taskId: taskIdFor(cell),
        criterionId: cell.criterionId,
        optionId: cell.optionId,
        question: buildQuestion(platformName, criterionLabel),
        preferredSourceTypes: CRITERION_SOURCE_TYPES[cell.criterionId] ?? DEFAULT_SOURCE_TYPES,
        priority: "medium" as const,
        priorityScore: 0,
        reason: `${platformName} x ${criterionLabel} is currently ${cell.status.toUpperCase()}.`,
      };
    });
}

/** Exposed so prioritization.ts (and tests) don't need their own copy
 * of the weight lookup. */
export function criterionWeight(criterionId: ScoreDimensionKey): number {
  return SCORE_WEIGHTS[criterionId];
}
