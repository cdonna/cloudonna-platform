/**
 * Shared by both persistence handlers (save + append) so the "compute
 * business case + executive recommendation, then attach to
 * engineResult" step exists in exactly one place, not two copies that
 * could drift. Pure composition of already-existing, already-tested
 * engine modules — this file adds no calculation of its own.
 */
import { computeBusinessCase, ECONOMIC_SCENARIOS } from "./business-case/calculations";
import type { BusinessCaseOptionInput, EconomicScenario, EconomicScenarioName, TimeHorizonYears } from "./business-case/types";
import { computeExecutiveRecommendation } from "./executive-recommendation";
import type { DecisionOutput } from "../types";

export interface BusinessCaseRequestFields {
  businessCaseInputs?: BusinessCaseOptionInput[] | null;
  economicScenario?: EconomicScenarioName;
  discountRatePercent?: number;
  horizonYears?: TimeHorizonYears;
}

function resolveScenario(name: EconomicScenarioName | undefined): EconomicScenario {
  if (name === "upside" || name === "downside") return ECONOMIC_SCENARIOS[name];
  return ECONOMIC_SCENARIOS.base; // "custom" with no multipliers supplied also falls back to base — never guessed
}

/**
 * Returns `output` unchanged when no businessCaseInputs were given —
 * the whole point of this being optional (brief §7: "where enough
 * inputs exist calculate deterministically," never invent a business
 * case that wasn't asked for).
 */
export function attachBusinessCase(output: DecisionOutput, fields: BusinessCaseRequestFields): DecisionOutput {
  if (!fields.businessCaseInputs || fields.businessCaseInputs.length === 0 || !output.engineResult) {
    return output;
  }

  const scenario = resolveScenario(fields.economicScenario);
  const horizonYears = fields.horizonYears ?? 3;
  const discountRatePercent = fields.discountRatePercent ?? 8;

  const businessCase = computeBusinessCase(fields.businessCaseInputs, scenario, horizonYears, discountRatePercent);
  const ranked = [output.recommendation, ...output.alternatives];
  // Overrides the executiveRecommendation buildEngineResult already
  // attached with economic: null — same strategic/architecture
  // lenses, now with a real economic lens behind them.
  const executiveRecommendation = computeExecutiveRecommendation(ranked, businessCase);

  return { ...output, engineResult: { ...output.engineResult, businessCase, executiveRecommendation } };
}
