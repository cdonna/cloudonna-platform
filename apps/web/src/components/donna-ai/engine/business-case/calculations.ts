/**
 * Enterprise Business Case Engine — deterministic calculations (brief
 * §6/§7/§8/§9). Every function here is pure: same input, same output,
 * always. Nothing in this file calls an AI provider, and nothing
 * outside this file is allowed to compute a TCO/ROI/NPV/payback
 * number — see engine/business-case/provenance.ts for how confidence
 * in these numbers (not the numbers themselves) relates to evidence.
 */
import type {
  BenefitCategory,
  BusinessCaseOptionInput,
  BusinessCaseOptionOutput,
  BusinessCaseOutput,
  CostCategory,
  CostLineItem,
  BenefitLineItem,
  CostOfDelayInput,
  EconomicScenario,
  FinancialEstimate,
  FinancialSummary,
  TimeHorizonYears,
  YearlyCashFlow,
} from "./types";
import { computeFinancialConfidence } from "./provenance";

export const ECONOMIC_SCENARIOS: Record<"base" | "upside" | "downside", EconomicScenario> = {
  base: { name: "base", label: "Base" },
  upside: { name: "upside", label: "Upside" },
  downside: { name: "downside", label: "Downside" },
};

/**
 * Resolves one FinancialEstimate to a single number for a given
 * scenario. The one place the "costs and benefits move in opposite
 * directions under the same optimism" rule lives:
 *  - BASE always reads the base/point value.
 *  - UPSIDE (the more favorable business-case outcome) reads LOW for
 *    a cost and HIGH for a benefit.
 *  - DOWNSIDE reads HIGH for a cost and LOW for a benefit.
 *  - CUSTOM starts from base/point, then applies
 *    scenario.customMultipliers[category] if one is given for this
 *    exact category — a point estimate is otherwise scenario-
 *    invariant (there's no low/high range to read instead).
 */
export function resolveEstimate(estimate: FinancialEstimate, scenario: EconomicScenario, kind: "cost" | "benefit", category: CostCategory | BenefitCategory): number {
  let value: number;
  if (estimate.kind === "point") {
    value = estimate.value;
  } else if (scenario.name === "upside") {
    value = kind === "cost" ? estimate.low : estimate.high;
  } else if (scenario.name === "downside") {
    value = kind === "cost" ? estimate.high : estimate.low;
  } else {
    value = estimate.base;
  }

  if (scenario.name === "custom") {
    const multiplier = scenario.customMultipliers?.[category];
    if (multiplier !== undefined) return value * multiplier;
  }
  return value;
}

export function computeYearlyCashFlows(input: BusinessCaseOptionInput, scenario: EconomicScenario, horizonYears: TimeHorizonYears): YearlyCashFlow[] {
  const flows: YearlyCashFlow[] = [];
  let cumulative = 0;

  for (let year = 1; year <= horizonYears; year += 1) {
    const totalCost = input.costs.filter((c) => c.year === year).reduce((sum, c) => sum + resolveEstimate(c.estimate, scenario, "cost", c.category), 0);
    const totalBenefit = input.benefits.filter((b) => b.year === year).reduce((sum, b) => sum + resolveEstimate(b.estimate, scenario, "benefit", b.category), 0);
    const netCashFlow = totalBenefit - totalCost;
    cumulative += netCashFlow;
    flows.push({ year, totalCost, totalBenefit, netCashFlow, cumulativeCashFlow: cumulative });
  }

  return flows;
}

export function computeTCO(cashFlows: YearlyCashFlow[]): number {
  return cashFlows.reduce((sum, f) => sum + f.totalCost, 0);
}

export function computeTotalBenefits(cashFlows: YearlyCashFlow[]): number {
  return cashFlows.reduce((sum, f) => sum + f.totalBenefit, 0);
}

export function computeNetBenefit(tco: number, totalBenefits: number): number {
  return totalBenefits - tco;
}

/** Null when there is no real investment base to divide by — a
 * zero-cost "option" cannot have a meaningful ROI percentage, and
 * reporting one (even 0% or Infinity) would be a fabricated number
 * dressed as a calculation. */
export function computeROI(netBenefit: number, tco: number): number | null {
  if (tco === 0) return null;
  return Math.round((netBenefit / tco) * 1000) / 10; // one decimal place
}

export function computeNPV(cashFlows: YearlyCashFlow[], discountRatePercent: number): number {
  const r = discountRatePercent / 100;
  return Math.round(cashFlows.reduce((sum, f) => sum + f.netCashFlow / (1 + r) ** f.year, 0));
}

/**
 * Linear interpolation within the crossing year for a fractional
 * payback period — e.g. cumulative cash flow of -100 at year 2 and
 * +50 at year 3 pays back at year 2 + 100/150 ≈ 2.67. Null when
 * cumulative cash flow never turns positive within the modeled
 * horizon: "no payback within N years" is the honest answer, never a
 * number invented past the horizon the user actually asked about.
 */
export function computePaybackYears(cashFlows: YearlyCashFlow[]): number | null {
  if (cashFlows.length === 0) return null;
  if (cashFlows[0].cumulativeCashFlow >= 0) return 0;

  for (let i = 1; i < cashFlows.length; i += 1) {
    const previous = cashFlows[i - 1];
    const current = cashFlows[i];
    if (current.cumulativeCashFlow >= 0 && previous.cumulativeCashFlow < 0) {
      const fraction = -previous.cumulativeCashFlow / (current.cumulativeCashFlow - previous.cumulativeCashFlow);
      return Math.round((previous.year + fraction) * 100) / 100;
    }
  }
  return null;
}

export function summarizeOption(cashFlows: YearlyCashFlow[], discountRatePercent: number): FinancialSummary {
  const tco = computeTCO(cashFlows);
  const totalBenefits = computeTotalBenefits(cashFlows);
  const netBenefit = computeNetBenefit(tco, totalBenefits);
  return {
    tco,
    totalBenefits,
    netBenefit,
    roiPercent: computeROI(netBenefit, tco),
    npv: computeNPV(cashFlows, discountRatePercent),
    paybackYears: computePaybackYears(cashFlows),
  };
}

export function computeBusinessCaseOption(input: BusinessCaseOptionInput, scenario: EconomicScenario, horizonYears: TimeHorizonYears, discountRatePercent: number): BusinessCaseOptionOutput {
  const cashFlows = computeYearlyCashFlows(input, scenario, horizonYears);
  return {
    optionId: input.optionId,
    cashFlows,
    summary: summarizeOption(cashFlows, discountRatePercent),
    confidence: computeFinancialConfidence(input),
  };
}

export function computeBusinessCase(
  options: BusinessCaseOptionInput[],
  scenario: EconomicScenario,
  horizonYears: TimeHorizonYears,
  discountRatePercent: number,
): BusinessCaseOutput {
  return {
    scenario: scenario.name,
    horizonYears,
    discountRatePercent,
    options: options.map((o) => computeBusinessCaseOption(o, scenario, horizonYears, discountRatePercent)),
  };
}

export interface CostOfDelayResult {
  totalCost: number;
  breakdown: Array<{ label: string; amount: number }>;
}

/** Cost-of-delay figures aren't tied to any CostCategory (they aren't
 * part of an option's own cost structure at all), so they can't go
 * through resolveEstimate's category-keyed custom-multiplier lookup
 * without borrowing an unrelated category — this resolves the
 * base/upside/downside band directly instead. Custom scenarios always
 * read BASE for cost-of-delay in V1 (documented limitation: a custom
 * scenario's multipliers apply to option cost/benefit lines only). */
function resolveDelayEstimate(estimate: FinancialEstimate, scenario: EconomicScenario): number {
  if (estimate.kind === "point") return estimate.value;
  if (scenario.name === "upside") return estimate.low;
  if (scenario.name === "downside") return estimate.high;
  return estimate.base;
}

/**
 * Cost of Delay (brief §9) — deliberately kept SEPARATE from each
 * option's own TCO/NPV rather than blended into it: delay cost is
 * roughly option-independent (it is the cost of not deciding at all,
 * or deciding later, not a property of whichever option eventually
 * wins) — conflating the two would answer a different question than
 * either one asks on its own. Returns null when every field is
 * unset, never a fabricated zero.
 */
export function computeCostOfDelay(input: CostOfDelayInput | null, scenario: EconomicScenario): CostOfDelayResult | null {
  if (!input) return null;

  const breakdown: Array<{ label: string; amount: number }> = [];
  if (input.monthlyDelayCost) {
    breakdown.push({ label: "Monthly delay cost", amount: resolveDelayEstimate(input.monthlyDelayCost, scenario) * input.delayMonths });
  }
  if (input.revenueOpportunityDelay) {
    breakdown.push({ label: "Revenue opportunity delay", amount: resolveDelayEstimate(input.revenueOpportunityDelay, scenario) });
  }
  if (input.legacyRunCostExtension) {
    breakdown.push({ label: "Legacy run-cost extension", amount: resolveDelayEstimate(input.legacyRunCostExtension, scenario) });
  }
  if (input.transformationDelayCost) {
    breakdown.push({ label: "Transformation delay cost", amount: resolveDelayEstimate(input.transformationDelayCost, scenario) });
  }

  if (breakdown.length === 0) return null;
  return { totalCost: breakdown.reduce((sum, b) => sum + b.amount, 0), breakdown };
}

export type { CostLineItem, BenefitLineItem };
