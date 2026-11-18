/**
 * Commercial conversion funnel (brief §19) — deterministic counts and
 * rates over real data only. "Reached stage X" is computed from the
 * HIGHEST stage index any logged commercial_activities stage-change
 * record (or the opportunity's current stage, as a fallback for an
 * opportunity created directly into a later stage with no logged
 * transition yet) ever shows for that opportunity — this correctly
 * credits a now-closed-lost deal with every stage it actually passed
 * through, rather than only its final stage.
 *
 * Team/Enterprise conversion counts come from real
 * commercial_conversions rows, never inferred from opportunity stage
 * alone.
 */
import { OPPORTUNITY_STAGES, type OpportunityStage } from "./opportunity-stages";

export const FUNNEL_STAGES = ["inquiry", "qualified", "discovery", "sprint_proposed", "closed_won"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  inquiry: "Inquiry",
  qualified: "Qualified",
  discovery: "Discovery",
  sprint_proposed: "Sprint Proposed",
  closed_won: "Sprint Won",
};

const STAGE_INDEX: Record<OpportunityStage, number> = Object.fromEntries(OPPORTUNITY_STAGES.map((s, i) => [s, i])) as Record<OpportunityStage, number>;

export interface FunnelActivityInput {
  opportunityId: string;
  /** The stage recorded in this activity's after_data, when the
   * activity's activity_type is "stage_changed". */
  stageAfter: OpportunityStage | null;
}

export interface FunnelOpportunityInput {
  id: string;
  stage: OpportunityStage;
}

export interface FunnelStageCount {
  stage: FunnelStage;
  count: number;
  /** Conversion rate from the PREVIOUS funnel stage — null for the
   * first stage, and null (not 0 or Infinity) whenever the previous
   * stage's count is zero, per brief §19's "if no data exists, show
   * insufficient data." */
  conversionRateFromPrevious: number | null;
}

export interface CommercialFunnelResult {
  stages: FunnelStageCount[];
  sprintCompletedCount: number;
  teamConversionCount: number;
  enterpriseExpansionCount: number;
  insufficientData: boolean;
}

function maxStageIndexReached(opportunity: FunnelOpportunityInput, activities: FunnelActivityInput[]): number {
  // closed_lost sorts AFTER closed_won in OPPORTUNITY_STAGES (it is a
  // distinct terminal state, not "further along" than won) — using it
  // as a floor would wrongly credit every lost deal with having
  // reached closed_won. Its real progress comes only from logged
  // activity history, floored at "inquiry" (every opportunity, by
  // definition, reached that).
  let maxIndex = opportunity.stage === "closed_lost" ? STAGE_INDEX.inquiry : STAGE_INDEX[opportunity.stage];
  for (const activity of activities) {
    if (activity.opportunityId !== opportunity.id || activity.stageAfter === null) continue;
    maxIndex = Math.max(maxIndex, STAGE_INDEX[activity.stageAfter]);
  }
  return maxIndex;
}

export function computeCommercialFunnel(
  opportunities: FunnelOpportunityInput[],
  activities: FunnelActivityInput[],
  options: { sprintCompletedCount: number; teamConversionCount: number; enterpriseExpansionCount: number },
): CommercialFunnelResult {
  const reachedIndexes = opportunities.map((o) => maxStageIndexReached(o, activities));
  const countAtOrPast = (stage: FunnelStage): number => reachedIndexes.filter((reached) => reached >= STAGE_INDEX[stage]).length;
  const countsByStage = FUNNEL_STAGES.map(countAtOrPast);

  const stages: FunnelStageCount[] = FUNNEL_STAGES.map((stage, i) => {
    const count = countsByStage[i];
    const previousCount = i === 0 ? null : countsByStage[i - 1];
    return { stage, count, conversionRateFromPrevious: previousCount === null || previousCount === 0 ? null : count / previousCount };
  });

  return {
    stages,
    sprintCompletedCount: options.sprintCompletedCount,
    teamConversionCount: options.teamConversionCount,
    enterpriseExpansionCount: options.enterpriseExpansionCount,
    insufficientData: opportunities.length === 0,
  };
}
