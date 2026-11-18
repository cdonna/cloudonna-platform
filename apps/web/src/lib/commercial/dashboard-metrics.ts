/**
 * Commercial Dashboard metrics (brief §15) — pure arithmetic over a
 * real opportunity list, composing target-model.ts/pipeline-model.ts
 * rather than recomputing their logic. No vanity metrics: every
 * number here is a deterministic count or sum, nothing modeled as a
 * prediction beyond the documented, overridable stage probabilities
 * pipeline-model.ts already uses.
 */
import { CLOSED_STAGES, type OpportunityStage } from "./opportunity-stages";
import { computePipelineSummary, type PipelineSummary } from "./pipeline-model";
import { FIRST_MILLION_TARGET_CHF } from "./target-model";
import type { CommercialPackageId } from "./packages";

export interface DashboardOpportunityInput {
  stage: OpportunityStage;
  commercialPackage: CommercialPackageId;
  expectedAcvChf: number | null;
  expectedTcvChf: number | null;
  probabilityPercent: number | null;
}

export interface CommercialDashboardSummary {
  targetBookingsChf: number;
  bookedChf: number;
  arrChf: number;
  pipeline: PipelineSummary;
  openOpportunityCount: number;
  byPackage: Record<CommercialPackageId, { open: number; closedWon: number }>;
  onTrackForTarget: boolean;
}

const RECURRING_PACKAGES: CommercialPackageId[] = ["team", "enterprise"];

function dealValue(o: { expectedAcvChf: number | null; expectedTcvChf: number | null }): number {
  return o.expectedTcvChf ?? o.expectedAcvChf ?? 0;
}

export function computeCommercialDashboard(opportunities: DashboardOpportunityInput[], targetBookingsChf = FIRST_MILLION_TARGET_CHF): CommercialDashboardSummary {
  const closedWon = opportunities.filter((o) => o.stage === "closed_won");
  const open = opportunities.filter((o) => !CLOSED_STAGES.includes(o.stage));

  const bookedChf = closedWon.reduce((sum, o) => sum + dealValue(o), 0);
  const arrChf = closedWon.filter((o) => RECURRING_PACKAGES.includes(o.commercialPackage)).reduce((sum, o) => sum + dealValue(o), 0);

  const pipeline = computePipelineSummary(
    open.map((o) => ({ stage: o.stage, expectedAcvChf: o.expectedAcvChf, expectedTcvChf: o.expectedTcvChf, probabilityPercent: o.probabilityPercent })),
    { targetBookingsChf, bookedChf },
  );

  const byPackage: Record<CommercialPackageId, { open: number; closedWon: number }> = {
    decision_sprint: { open: 0, closedWon: 0 },
    team: { open: 0, closedWon: 0 },
    enterprise: { open: 0, closedWon: 0 },
    strategic_decision_program: { open: 0, closedWon: 0 },
  };
  for (const o of open) byPackage[o.commercialPackage].open += 1;
  for (const o of closedWon) byPackage[o.commercialPackage].closedWon += 1;

  return {
    targetBookingsChf,
    bookedChf,
    arrChf,
    pipeline,
    openOpportunityCount: open.length,
    byPackage,
    onTrackForTarget: bookedChf + pipeline.weightedPipelineValueChf >= targetBookingsChf,
  };
}
