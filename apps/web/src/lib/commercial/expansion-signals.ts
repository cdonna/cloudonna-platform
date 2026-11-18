/**
 * Team -> Enterprise expansion signals (brief §18) — computed,
 * read-only recommendations surfaced for human review. Nothing here
 * writes anything or creates an opportunity; a staff member who
 * agrees records the outcome via commercial_conversions themselves.
 *
 * Only signals genuinely derivable from existing data are computed.
 * Others the brief lists (governance requirement, cross-team
 * standardization need) are real signals a human notices in
 * conversation, not something this schema tracks structurally —
 * documented here as deliberately NOT computed, rather than faked.
 */
export type ExpansionSignalCode = "multiple_decisions" | "multiple_executive_stakeholders" | "multiple_completed_sprints";

export const EXPANSION_SIGNAL_LABELS: Record<ExpansionSignalCode, string> = {
  multiple_decisions: "Multiple decisions linked to this account",
  multiple_executive_stakeholders: "Multiple executive stakeholders engaged",
  multiple_completed_sprints: "More than one completed Decision Sprint",
};

export interface ExpansionSignalInput {
  accountId: string;
  distinctDecisionCount: number;
  executiveStakeholderCount: number;
  completedSprintCount: number;
}

export interface ExpansionSignalResult {
  accountId: string;
  signals: ExpansionSignalCode[];
  recommendExpansionReview: boolean;
}

export function computeExpansionSignals(input: ExpansionSignalInput): ExpansionSignalResult {
  const signals: ExpansionSignalCode[] = [];
  if (input.distinctDecisionCount > 1) signals.push("multiple_decisions");
  if (input.executiveStakeholderCount > 1) signals.push("multiple_executive_stakeholders");
  if (input.completedSprintCount > 1) signals.push("multiple_completed_sprints");

  return { accountId: input.accountId, signals, recommendExpansionReview: signals.length > 0 };
}
