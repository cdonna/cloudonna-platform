/** Decision Sprint delivery status (brief §13). */
export const DECISION_SPRINT_STATUSES = [
  "scoping",
  "committed",
  "active",
  "evidence_gathering",
  "analysis",
  "executive_review",
  "completed",
  "on_hold",
  "cancelled",
] as const;

export type DecisionSprintStatus = (typeof DECISION_SPRINT_STATUSES)[number];

export const DECISION_SPRINT_STATUS_LABELS: Record<DecisionSprintStatus, string> = {
  scoping: "Scoping",
  committed: "Committed",
  active: "Active",
  evidence_gathering: "Evidence Gathering",
  analysis: "Analysis",
  executive_review: "Executive Review",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export const ACTIVE_SPRINT_STATUSES: DecisionSprintStatus[] = ["committed", "active", "evidence_gathering", "analysis", "executive_review"];
export const CLOSED_SPRINT_STATUSES: DecisionSprintStatus[] = ["completed", "cancelled"];
