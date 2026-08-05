import type { ScoreDimensionKey } from "./types";

/**
 * Single source of truth for how much each dimension contributes to the
 * overall Donna Score. Weights sum to 1.0. Changing a weight here changes
 * the overall score everywhere — there is no other, hidden place weighting
 * happens.
 *
 * Rationale for the current weighting: Architecture, Business, and
 * Technology fit are weighted highest because they determine whether the
 * platform can do the job at all. Governance, AI Readiness, Security, and
 * Cost are weighted next — real differentiators, but secondary to basic
 * fit. Ecosystem and Time-to-Value matter but are more about delivery
 * experience than platform capability. Strategic fit is weighted lowest
 * deliberately: it reflects goal-alignment framing on top of a fit that
 * the other nine dimensions have already established.
 */
export const SCORE_WEIGHTS: Record<ScoreDimensionKey, number> = {
  architecture: 0.15,
  business: 0.12,
  technology: 0.12,
  governance: 0.1,
  aiReadiness: 0.1,
  security: 0.1,
  cost: 0.1,
  ecosystem: 0.08,
  timeToValue: 0.08,
  strategic: 0.05,
};

export const SCORE_DIMENSION_LABELS: Record<ScoreDimensionKey, string> = {
  architecture: "Architecture Fit",
  business: "Business Fit",
  technology: "Technology Fit",
  governance: "Governance Fit",
  aiReadiness: "AI Readiness",
  security: "Security Fit",
  ecosystem: "Ecosystem Fit",
  cost: "Cost Fit",
  timeToValue: "Time-to-Value Fit",
  strategic: "Strategic Fit",
};
