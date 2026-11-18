/**
 * Pipeline planning metrics (brief §14) — deterministic arithmetic
 * over real opportunity records, never a statistical prediction.
 * "Coverage ratio" and "weighted pipeline" are standard sales-planning
 * terms given an honest, auditable computation here, not dressed up
 * as more scientific than they are.
 */
import { DEFAULT_STAGE_PROBABILITY_PERCENT, type OpportunityStage } from "./opportunity-stages";

export interface PipelineOpportunityInput {
  stage: OpportunityStage;
  expectedAcvChf: number | null;
  expectedTcvChf: number | null;
  /** Explicit, sales-set probability for this specific opportunity —
   * when present, always wins over the stage default (brief §14:
   * "allow simple sales-stage probabilities if explicitly
   * configured"). */
  probabilityPercent: number | null;
}

export interface PipelineSummary {
  openOpportunityCount: number;
  /** Pipeline value = sum of expected TCV (falling back to expected
   * ACV when TCV isn't set) across every OPEN opportunity — closed
   * opportunities are bookings, not pipeline. */
  pipelineValueChf: number;
  weightedPipelineValueChf: number;
  targetBookingsChf: number;
  bookedChf: number;
  /** pipelineValue / remainingToTarget — the standard sales-planning
   * reading: a 3x coverage ratio means the open pipeline is three
   * times the size of the gap still left to the target, a common
   * rule-of-thumb healthy level (not asserted as true for ClouDonna
   * specifically — just the conventional meaning of the number).
   * Null when there is no remaining gap (target already booked) or
   * pipelineValue is zero — never a fabricated infinity. */
  coverageRatio: number | null;
  remainingToTargetChf: number;
}

function effectiveProbability(o: PipelineOpportunityInput): number {
  return o.probabilityPercent ?? DEFAULT_STAGE_PROBABILITY_PERCENT[o.stage];
}

function dealValue(o: PipelineOpportunityInput): number {
  return o.expectedTcvChf ?? o.expectedAcvChf ?? 0;
}

export function computePipelineSummary(
  openOpportunities: PipelineOpportunityInput[],
  input: { targetBookingsChf: number; bookedChf: number },
): PipelineSummary {
  const pipelineValueChf = openOpportunities.reduce((sum, o) => sum + dealValue(o), 0);
  const weightedPipelineValueChf = openOpportunities.reduce((sum, o) => sum + dealValue(o) * (effectiveProbability(o) / 100), 0);
  const remainingToTargetChf = Math.max(input.targetBookingsChf - input.bookedChf, 0);
  const coverageRatio = remainingToTargetChf > 0 ? pipelineValueChf / remainingToTargetChf : null;

  return {
    openOpportunityCount: openOpportunities.length,
    pipelineValueChf,
    weightedPipelineValueChf,
    targetBookingsChf: input.targetBookingsChf,
    bookedChf: input.bookedChf,
    coverageRatio,
    remainingToTargetChf,
  };
}
