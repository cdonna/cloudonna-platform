/**
 * Decision Memory events (brief §19/§20) — computed, not stored.
 * version-diff.ts already detects exactly what changed between two
 * saved versions (constraints, vendors, priorities, scores,
 * recommendations, provenance); this module's only job is to name
 * that change as one of a fixed set of product-level event labels, so
 * the UI can show "Recommendation changed" instead of raw version
 * diff noise. No new table, no new storage — every event is derived
 * from VersionDiff + the optional HumanOverride already persisted on
 * decision_versions.
 */
import type { VersionDiff } from "../persistence/version-diff";
import type { HumanOverride } from "../persistence/decisions-repository";

export type DecisionEventType =
  | "DECISION_CREATED"
  | "CONTEXT_UPDATED"
  | "RECOMMENDATION_CHANGED"
  | "SCORE_CHANGED"
  | "SCENARIO_SAVED"
  | "HUMAN_REVIEW_RECORDED"
  | "ENGINE_UPDATED";

export interface DecisionEvent {
  type: DecisionEventType;
  label: string;
}

/** Events for the FIRST version of a decision — there is no prior
 * version to diff against, so this is the only case not derived from
 * a VersionDiff. */
export function classifyCreationEvent(humanOverride: HumanOverride | null): DecisionEvent[] {
  const events: DecisionEvent[] = [{ type: "DECISION_CREATED", label: "Decision created" }];
  if (humanOverride) events.push({ type: "HUMAN_REVIEW_RECORDED", label: "Final human decision recorded" });
  return events;
}

/** Events for version N, given its diff against version N-1 and
 * whether this specific version carries a human override and/or
 * scenario weight overrides (both already present on the persisted
 * version content, never re-derived). */
export function classifyVersionEvent(
  diff: VersionDiff,
  humanOverride: HumanOverride | null,
  hasScenarioOverrides: boolean,
): DecisionEvent[] {
  const events: DecisionEvent[] = [];

  if (hasScenarioOverrides) {
    events.push({ type: "SCENARIO_SAVED", label: "Scenario saved" });
  }

  if (diff.changedConstraints.length > 0 || diff.changedVendors.length > 0 || diff.changedPriorities.added.length > 0 || diff.changedPriorities.removed.length > 0) {
    events.push({ type: "CONTEXT_UPDATED", label: "Decision context updated" });
  }

  if (diff.changedRecommendations.primary.changed) {
    events.push({ type: "RECOMMENDATION_CHANGED", label: "Recommendation changed" });
  } else if (diff.changedScores.donnaScore.delta !== 0 || diff.changedScores.dimensions.length > 0) {
    events.push({ type: "SCORE_CHANGED", label: "Score changed" });
  }

  if (diff.changedProvenance.length > 0) {
    events.push({ type: "ENGINE_UPDATED", label: "Engine or scoring model updated" });
  }

  if (humanOverride) {
    events.push({ type: "HUMAN_REVIEW_RECORDED", label: "Final human decision recorded" });
  }

  if (events.length === 0) {
    events.push({ type: "CONTEXT_UPDATED", label: "Decision re-saved with no material change" });
  }

  return events;
}
