/**
 * Financial Sensitivity (brief §17) — deterministic only, same
 * discipline as engine/scenario.ts's dimension-weight sensitivity:
 * every number here is derived by direct calculation, never
 * estimated or asked of an LLM. "Only show such statements when
 * deterministically calculated" (brief §17) — if a function below
 * returns null, the caller must not say anything about that case,
 * not fill in a plausible-sounding guess.
 */
import { computeNPV, computeYearlyCashFlows, resolveEstimate } from "./calculations";
import type { BenefitCategory, BusinessCaseOptionInput, CostCategory, EconomicScenario, TimeHorizonYears } from "./types";

export interface DriverContribution {
  kind: "cost" | "benefit";
  category: CostCategory | BenefitCategory;
  totalAmount: number;
}

/** Ranks every cost/benefit category present by its total resolved
 * dollar amount across the modeled horizon — the "largest financial
 * driver" (brief §17). Categories with no line items simply don't
 * appear; nothing is padded in at zero. */
export function identifyLargestDrivers(input: BusinessCaseOptionInput, scenario: EconomicScenario): DriverContribution[] {
  const byCost = new Map<CostCategory, number>();
  for (const c of input.costs) {
    byCost.set(c.category, (byCost.get(c.category) ?? 0) + resolveEstimate(c.estimate, scenario, "cost", c.category));
  }
  const byBenefit = new Map<BenefitCategory, number>();
  for (const b of input.benefits) {
    byBenefit.set(b.category, (byBenefit.get(b.category) ?? 0) + resolveEstimate(b.estimate, scenario, "benefit", b.category));
  }

  const drivers: DriverContribution[] = [
    ...Array.from(byCost.entries()).map(([category, totalAmount]) => ({ kind: "cost" as const, category, totalAmount })),
    ...Array.from(byBenefit.entries()).map(([category, totalAmount]) => ({ kind: "benefit" as const, category, totalAmount })),
  ];

  return drivers.sort((a, b) => b.totalAmount - a.totalAmount);
}

export interface UncertaintyContribution {
  kind: "cost" | "benefit";
  category: CostCategory | BenefitCategory;
  label: string;
  spread: number;
}

/** Ranks every RANGE-type line item by (high - low) — the "largest
 * uncertainty" (brief §17). Point estimates contribute no uncertainty
 * signal by construction (there is no range to measure), so they
 * never appear here — never fabricating a spread for a figure that
 * was given as a single number. */
export function identifyLargestUncertainty(input: BusinessCaseOptionInput): UncertaintyContribution[] {
  const contributions: UncertaintyContribution[] = [];
  for (const c of input.costs) {
    if (c.estimate.kind === "range") contributions.push({ kind: "cost", category: c.category, label: c.label, spread: c.estimate.high - c.estimate.low });
  }
  for (const b of input.benefits) {
    if (b.estimate.kind === "range") contributions.push({ kind: "benefit", category: b.category, label: b.label, spread: b.estimate.high - b.estimate.low });
  }
  return contributions.sort((a, b) => b.spread - a.spread);
}

function npvFor(input: BusinessCaseOptionInput, scenario: EconomicScenario, horizonYears: TimeHorizonYears, discountRatePercent: number): number {
  return computeNPV(computeYearlyCashFlows(input, scenario, horizonYears), discountRatePercent);
}

/**
 * Scales every line item of `targetCategory`/`targetKind` belonging
 * to `optionA` by a multiplier `k` (all else held at the given
 * scenario's resolved values) and returns a new synthetic option
 * input reflecting that — the building block findRoiFlipMultiplier
 * uses twice (once at k=0, once at k=1) to exploit NPV's linearity in
 * any single line item's value, rather than searching iteratively.
 */
function scaleCategory(input: BusinessCaseOptionInput, kind: "cost" | "benefit", category: CostCategory | BenefitCategory, multiplier: number): BusinessCaseOptionInput {
  const scaleEstimate = (estimate: BusinessCaseOptionInput["costs"][number]["estimate"]) =>
    estimate.kind === "point" ? { ...estimate, value: estimate.value * multiplier } : { ...estimate, low: estimate.low * multiplier, base: estimate.base * multiplier, high: estimate.high * multiplier };

  if (kind === "cost") {
    return { ...input, costs: input.costs.map((c) => (c.category === category ? { ...c, estimate: scaleEstimate(c.estimate) } : c)) };
  }
  return { ...input, benefits: input.benefits.map((b) => (b.category === category ? { ...b, estimate: scaleEstimate(b.estimate) } : b)) };
}

/**
 * The exact multiplier k such that scaling optionA's `targetCategory`
 * line items by k makes optionA's NPV equal optionB's NPV, holding
 * everything else fixed at the given scenario — brief §17's "ROI flip
 * condition" / "Databricks becomes preferable if annual SAP operating
 * savings fall below X" example, computed exactly rather than
 * searched for: NPV_A(k) is affine in k (scaling one line item only
 * ever scales its own discounted contribution), so two evaluations
 * (k=0 and k=1) fully determine the line. Returns null when the
 * category has no line items in optionA (nothing to scale) or when
 * its resolved contribution is exactly zero (scaling zero can never
 * change anything, so there is no finite multiplier that flips it).
 */
export function findRoiFlipMultiplier(
  optionA: BusinessCaseOptionInput,
  optionB: BusinessCaseOptionInput,
  targetKind: "cost" | "benefit",
  targetCategory: CostCategory | BenefitCategory,
  scenario: EconomicScenario,
  horizonYears: TimeHorizonYears,
  discountRatePercent: number,
): number | null {
  const hasCategory = (targetKind === "cost" ? optionA.costs : optionA.benefits).some((item) => item.category === targetCategory);
  if (!hasCategory) return null;

  const npvBAt = npvFor(optionB, scenario, horizonYears, discountRatePercent);
  const npvAAt1 = npvFor(optionA, scenario, horizonYears, discountRatePercent);
  const npvAAt0 = npvFor(scaleCategory(optionA, targetKind, targetCategory, 0), scenario, horizonYears, discountRatePercent);

  const slope = npvAAt1 - npvAAt0; // d(NPV_A)/dk, since NPV is affine in k
  if (slope === 0) return null;

  // Solve npvAAt0 + k*slope = npvB for k. Rounded for float-noise only
  // (1e-9), not for display — callers format this for presentation;
  // rounding here to a coarse number of decimals would introduce a
  // small but real residual into any further calculation using k.
  const k = (npvBAt - npvAAt0) / slope;
  return Math.round(k * 1e9) / 1e9;
}
