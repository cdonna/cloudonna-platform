/**
 * Sprint 6.2 — Score Change Explanation.
 *
 * Pure domain logic, no I/O, no AI/LLM call of any kind: every reason
 * string produced here is derived directly from a field that
 * version-diff.ts already detected as changed. There is no code path
 * that can produce a reason for a change that isn't present in the
 * VersionDiff it was given — see docs/roadmap/sprint-6.2.md, "Score
 * Change Explanation ... Do not hallucinate. Only explain actual
 * detected differences."
 */
import { GOAL_LABELS, type FieldChange, type VersionDiff } from "./version-diff";

export interface ScoreChangeExplanation {
  fromVersion: number;
  toVersion: number;
  fromScore: number;
  toScore: number;
  delta: number;
  reasons: string[];
}

function describeFieldChange(change: FieldChange): string {
  if (change.direction) {
    return `${change.label} ${change.direction} from ${change.from} to ${change.to}`;
  }
  return `${change.label} changed from ${change.from} to ${change.to}`;
}

export function explainScoreChange(diff: VersionDiff): ScoreChangeExplanation {
  const reasons: string[] = [];

  for (const change of diff.changedConstraints) {
    reasons.push(describeFieldChange(change));
  }

  for (const goal of diff.changedPriorities.added) {
    reasons.push(`${GOAL_LABELS[goal]} goal added`);
  }
  for (const goal of diff.changedPriorities.removed) {
    reasons.push(`${GOAL_LABELS[goal]} goal removed`);
  }

  for (const change of diff.changedVendors) {
    reasons.push(describeFieldChange(change));
  }

  if (diff.changedRecommendations.primary.changed) {
    const from = diff.changedRecommendations.primary.from?.name ?? "no recommendation";
    const to = diff.changedRecommendations.primary.to?.name ?? "no recommendation";
    reasons.push(`Recommended platform changed from ${from} to ${to}`);
  }
  if (diff.changedRecommendations.alternative.changed) {
    const from = diff.changedRecommendations.alternative.from?.name ?? "no alternative";
    const to = diff.changedRecommendations.alternative.to?.name ?? "no alternative";
    reasons.push(`Alternative recommendation changed from ${from} to ${to}`);
  }

  for (const dimension of diff.changedScores.dimensions) {
    const direction = dimension.delta > 0 ? "improved" : "declined";
    reasons.push(`${dimension.label} score ${direction} from ${dimension.from} to ${dimension.to}`);
  }

  // Provenance reasons come last, deliberately — they explain *why a
  // score could differ even with identical input* (the engine or
  // knowledge base itself changed), a categorically different kind of
  // reason from every input-driven one above it.
  for (const change of diff.changedProvenance) {
    reasons.push(describeFieldChange(change));
  }

  return {
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    fromScore: diff.changedScores.donnaScore.from,
    toScore: diff.changedScores.donnaScore.to,
    delta: diff.changedScores.donnaScore.delta,
    reasons,
  };
}
