/**
 * Commercial scenario planning (brief §58/§59) — BASE/UPSIDE/DOWNSIDE,
 * deterministic arithmetic only. A scenario is a *possible path* to
 * close the CHF 1M gap, never a statistical forecast — same framing
 * as target-model.ts's DEFAULT_FIRST_MILLION_SCENARIO, generalized to
 * three named cases and a sprint-to-team conversion rate instead of a
 * fixed team count.
 */
export type ScenarioId = "base" | "upside" | "downside";

export interface ScenarioInput {
  scenarioId: ScenarioId;
  numberOfSprints: number;
  sprintAspChf: number;
  /** 0-1 — what fraction of completed sprints convert to a Team
   * contract. An explicit planning input, never derived from real
   * conversion history unless the caller chooses to pass real
   * historical data in. */
  sprintToTeamConversionRate: number;
  teamAspChf: number;
  enterpriseWins: number;
  enterpriseAspChf: number;
}

export interface ScenarioResult extends ScenarioInput {
  sprintsBookingsChf: number;
  impliedTeamCount: number;
  teamBookingsChf: number;
  teamArrChf: number;
  enterpriseBookingsChf: number;
  enterpriseArrChf: number;
  totalBookingsChf: number;
  totalArrChf: number;
}

export function computeScenario(input: ScenarioInput): ScenarioResult {
  const sprintsBookingsChf = input.numberOfSprints * input.sprintAspChf;
  // Fractional teams are allowed in the model (e.g. 10 sprints x 30%
  // = 3 teams) — rounding down would silently understate the
  // scenario; the UI is responsible for presenting this as "~3.0".
  const impliedTeamCount = input.numberOfSprints * input.sprintToTeamConversionRate;
  const teamBookingsChf = impliedTeamCount * input.teamAspChf;
  const teamArrChf = teamBookingsChf; // Team is annual-recurring; booked value == first-year ARR.
  const enterpriseBookingsChf = input.enterpriseWins * input.enterpriseAspChf;
  const enterpriseArrChf = enterpriseBookingsChf; // Same reasoning as Team.

  return {
    ...input,
    sprintsBookingsChf,
    impliedTeamCount,
    teamBookingsChf,
    teamArrChf,
    enterpriseBookingsChf,
    enterpriseArrChf,
    totalBookingsChf: sprintsBookingsChf + teamBookingsChf + enterpriseBookingsChf,
    totalArrChf: teamArrChf + enterpriseArrChf,
  };
}

/** Planning defaults (brief §58) — the same worked numbers as
 * target-model.ts's DEFAULT_FIRST_MILLION_SCENARIO for BASE, with
 * UPSIDE/DOWNSIDE as explicit, documented variations on count and
 * conversion rate — never auto-derived from real pipeline data. */
export const DEFAULT_SCENARIOS: Record<ScenarioId, ScenarioInput> = {
  base: {
    scenarioId: "base",
    numberOfSprints: 10,
    sprintAspChf: 25_000,
    sprintToTeamConversionRate: 0.5,
    teamAspChf: 75_000,
    enterpriseWins: 2,
    enterpriseAspChf: 200_000,
  },
  upside: {
    scenarioId: "upside",
    numberOfSprints: 14,
    sprintAspChf: 28_000,
    sprintToTeamConversionRate: 0.6,
    teamAspChf: 85_000,
    enterpriseWins: 3,
    enterpriseAspChf: 220_000,
  },
  downside: {
    scenarioId: "downside",
    numberOfSprints: 7,
    sprintAspChf: 22_000,
    sprintToTeamConversionRate: 0.35,
    teamAspChf: 70_000,
    enterpriseWins: 1,
    enterpriseAspChf: 180_000,
  },
};
