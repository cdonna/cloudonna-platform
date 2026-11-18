/**
 * Display-only workspace status (brief §76) — DRAFT/FRAMING/
 * ANALYZING/READY_FOR_REVIEW/DECIDED/IMPLEMENTING/OUTCOME_REVIEW/
 * ARCHIVED, derived purely from existing signals (decisions.status,
 * whether a human override exists, whether an outcome has been
 * recorded). Never persisted — decisions.status (draft/saved/archived)
 * remains the one stored status column; this is a read-only, richer
 * label computed for display, per the brief's own "do not create a
 * duplicate status system without need."
 */
export type WorkspaceDisplayStatus = "DRAFT" | "FRAMING" | "ANALYZING" | "READY_FOR_REVIEW" | "DECIDED" | "IMPLEMENTING" | "OUTCOME_REVIEW" | "ARCHIVED";

export interface WorkspaceStatusInput {
  decisionStatus: string;
  hasEngineResult: boolean;
  readinessLevel: "LOW" | "MEDIUM" | "HIGH";
  hasHumanDecision: boolean;
  implementationStarted: boolean;
  realizedOutcomeKnown: boolean;
}

export function deriveWorkspaceStatus(input: WorkspaceStatusInput): WorkspaceDisplayStatus {
  if (input.decisionStatus === "archived") return "ARCHIVED";
  if (input.realizedOutcomeKnown) return "OUTCOME_REVIEW";
  if (input.implementationStarted) return "IMPLEMENTING";
  if (input.hasHumanDecision) return "DECIDED";
  if (!input.hasEngineResult) return "DRAFT";
  if (input.readinessLevel === "HIGH") return "READY_FOR_REVIEW";
  if (input.readinessLevel === "MEDIUM") return "ANALYZING";
  return "FRAMING";
}
