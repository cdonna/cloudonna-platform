/**
 * Opportunity stages (brief §11) — matches the opportunity_stage
 * Postgres enum exactly. Default probabilities are explicit,
 * documented numbers a sales process can use as a starting point for
 * weighted-pipeline math (brief §14) — never presented as a
 * scientifically-derived prediction, and always overridable per
 * opportunity (commercial_opportunities.probability_percent is
 * nullable and independent of this table).
 */

export const OPPORTUNITY_STAGES = [
  "inquiry",
  "qualified",
  "discovery",
  "sprint_proposed",
  "sprint_committed",
  "sprint_active",
  "team_expansion",
  "enterprise_evaluation",
  "commercial_negotiation",
  "closed_won",
  "closed_lost",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  inquiry: "Inquiry",
  qualified: "Qualified",
  discovery: "Discovery",
  sprint_proposed: "Sprint Proposed",
  sprint_committed: "Sprint Committed",
  sprint_active: "Sprint Active",
  team_expansion: "Team Expansion",
  enterprise_evaluation: "Enterprise Evaluation",
  commercial_negotiation: "Commercial Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

/** Default sales-stage probability, as a documented planning default
 * — not a statistical model. A real opportunity's own
 * `probability_percent`, when explicitly set, always takes
 * precedence over this table (see pipeline-model.ts). */
export const DEFAULT_STAGE_PROBABILITY_PERCENT: Record<OpportunityStage, number> = {
  inquiry: 5,
  qualified: 15,
  discovery: 30,
  sprint_proposed: 45,
  sprint_committed: 70,
  sprint_active: 85,
  team_expansion: 60,
  enterprise_evaluation: 40,
  commercial_negotiation: 75,
  closed_won: 100,
  closed_lost: 0,
};

export const OPEN_STAGES: OpportunityStage[] = OPPORTUNITY_STAGES.filter((s) => s !== "closed_won" && s !== "closed_lost");
export const CLOSED_STAGES: OpportunityStage[] = ["closed_won", "closed_lost"];
