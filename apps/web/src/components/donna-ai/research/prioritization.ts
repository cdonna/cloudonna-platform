/**
 * Research Prioritization (brief §30) — deterministic composite score:
 *
 *   priorityScore = criterionWeight x gapSeverity x sensitivityBoost
 *
 *  - criterionWeight: the Decision Engine's own SCORE_WEIGHTS value —
 *    a higher-weight criterion is worth researching first.
 *  - gapSeverity: MISSING=3, CONFLICTED=2.5, WEAK=1 (WEAK already has
 *    partial evidence; MISSING has none, which is the worse gap;
 *    CONFLICTED has signal but it disagrees, serious but not as blind
 *    as MISSING). Fixed constants, stated once, here.
 *  - sensitivityBoost: 2 when engine/scenario.ts's own
 *    findPivotalDimensions says this criterion's weight is within 10
 *    points of flipping the top-2, else 1 — reuses the existing
 *    Sensitivity Engine rather than re-deriving "does this matter to
 *    the ranking" a second way.
 *
 * No step here invents a probability or a confidence number — this is
 * a sort key, never shown to the user as a score.
 */
import { findPivotalDimensions } from "../engine/scenario";
import type { RankedPlatform } from "../scoring/types";
import type { ScoreDimensionKey } from "../types";
import { criterionWeight } from "./query-planner";
import type { GapCell, ResearchPriority, ResearchTask } from "./types";

const GAP_SEVERITY: Record<GapCell["status"], number> = {
  missing: 3,
  conflicted: 2.5,
  weak: 1,
  supported: 0,
};

const SENSITIVITY_FLIP_THRESHOLD_POINTS = 10;

function sensitivityBoost(criterionId: ScoreDimensionKey, ranked: RankedPlatform[]): number {
  const pivotal = findPivotalDimensions(ranked).find((p) => p.dimension === criterionId);
  if (!pivotal || pivotal.weightToTie === null) return 1;
  const deltaPoints = Math.abs(pivotal.weightToTie - pivotal.currentWeight) * 100;
  return deltaPoints <= SENSITIVITY_FLIP_THRESHOLD_POINTS ? 2 : 1;
}

function priorityLabel(score: number): ResearchPriority {
  if (score >= 0.6) return "high";
  if (score >= 0.2) return "medium";
  return "low";
}

export function prioritizeTasks(tasks: ResearchTask[], ranked: RankedPlatform[], gaps: GapCell[]): ResearchTask[] {
  const gapByKey = new Map(gaps.map((g) => [`${g.optionId}:${g.criterionId}`, g]));

  const scored = tasks.map((task) => {
    if (!task.criterionId) return { ...task, priorityScore: 0, priority: "low" as const };
    const gap = task.optionId ? gapByKey.get(`${task.optionId}:${task.criterionId}`) : undefined;
    const severity = gap ? GAP_SEVERITY[gap.status] : GAP_SEVERITY.missing;
    const score = criterionWeight(task.criterionId) * severity * sensitivityBoost(task.criterionId, ranked);
    return { ...task, priorityScore: Math.round(score * 1000) / 1000, priority: priorityLabel(score) };
  });

  return scored.sort((a, b) => b.priorityScore - a.priorityScore);
}
