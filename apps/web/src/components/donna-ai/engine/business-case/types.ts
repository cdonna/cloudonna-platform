/**
 * Enterprise Business Case Engine (brief §5-§10) — domain types. Pure
 * data shapes, no I/O. Every financial number in this product either
 * comes from here (deterministic) or is explicitly tagged
 * AI_INTERPRETATION/ASSUMPTION — the LLM never sets a TCO, ROI, or
 * NPV figure directly (brief §10).
 */
import type { EvidenceType } from "@/components/showcase/EvidenceTag";

export type CostCategory =
  | "implementation"
  | "migration"
  | "subscriptionLicense"
  | "consumption"
  | "infrastructure"
  | "operations"
  | "support"
  | "internalFte"
  | "externalServices"
  | "trainingSkills"
  | "dataEgress"
  | "changeManagement";

export type BenefitCategory =
  | "runCostReduction"
  | "productivityGain"
  | "timeToMarketImprovement"
  | "infrastructureConsolidation"
  | "licenseConsolidation"
  | "automationBenefit"
  | "riskAvoidance"
  | "revenueEnablement"
  | "costOfDelayAvoided";

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  implementation: "Implementation",
  migration: "Migration",
  subscriptionLicense: "Subscription / License",
  consumption: "Consumption",
  infrastructure: "Infrastructure",
  operations: "Operations",
  support: "Support",
  internalFte: "Internal FTE",
  externalServices: "External services",
  trainingSkills: "Training / skills",
  dataEgress: "Data egress",
  changeManagement: "Change management",
};

export const BENEFIT_CATEGORY_LABELS: Record<BenefitCategory, string> = {
  runCostReduction: "Run cost reduction",
  productivityGain: "Productivity gain",
  timeToMarketImprovement: "Time-to-market improvement",
  infrastructureConsolidation: "Infrastructure consolidation",
  licenseConsolidation: "License consolidation",
  automationBenefit: "Automation benefit",
  riskAvoidance: "Risk avoidance",
  revenueEnablement: "Revenue enablement",
  costOfDelayAvoided: "Cost of delay avoided",
};

/** Every financial figure's provenance — the same six-type taxonomy
 * the rest of the product already uses (components/showcase/EvidenceTag.tsx),
 * reused rather than inventing a parallel financial-specific vocabulary. */
export type FinancialProvenance = EvidenceType;

/**
 * A point estimate, OR a LOW/BASE/HIGH range (brief §8) — never both
 * unset. `resolveEstimate` (calculations.ts) is the only place that
 * turns this into one number for a given scenario.
 */
export type FinancialEstimate =
  | { kind: "point"; value: number }
  | { kind: "range"; low: number; base: number; high: number };

export interface CostLineItem {
  category: CostCategory;
  label: string;
  /** Which year (1-based) this cost is incurred in — a cost need not
   * repeat every year (e.g. implementation is typically year 1 only). */
  year: number;
  estimate: FinancialEstimate;
  provenance: FinancialProvenance;
  /** Free-text note — e.g. which evidence or assumption this number
   * rests on. Never itself a source of truth, just context. */
  note: string | null;
}

export interface BenefitLineItem {
  category: BenefitCategory;
  label: string;
  year: number;
  estimate: FinancialEstimate;
  provenance: FinancialProvenance;
  note: string | null;
}

export type TimeHorizonYears = 1 | 3 | 5;

/** brief §9 — Cost of Delay. Never auto-assumed; every field is
 * optional and absence means "not modeled," not zero. */
export interface CostOfDelayInput {
  monthlyDelayCost: FinancialEstimate | null;
  revenueOpportunityDelay: FinancialEstimate | null;
  legacyRunCostExtension: FinancialEstimate | null;
  transformationDelayCost: FinancialEstimate | null;
  delayMonths: number;
}

export type EconomicScenarioName = "base" | "upside" | "downside" | "custom";

/** Which estimate band each scenario reads from a FinancialEstimate —
 * fixed, documented, the only place this mapping lives. A "custom"
 * scenario carries its own explicit per-category adjustment instead. */
export interface EconomicScenario {
  name: EconomicScenarioName;
  label: string;
  /** For "custom" only: a multiplier applied to the BASE value of
   * every cost/benefit line, per category — e.g. { consumption: 1.3 }
   * to model consumption costs running 30% over base. Absent for
   * base/upside/downside, which instead select low/base/high directly. */
  customMultipliers?: Partial<Record<CostCategory | BenefitCategory, number>>;
}

export interface BusinessCaseOptionInput {
  optionId: string;
  costs: CostLineItem[];
  benefits: BenefitLineItem[];
  costOfDelay: CostOfDelayInput | null;
}

export interface BusinessCaseInput {
  horizonYears: TimeHorizonYears;
  discountRatePercent: number;
  options: BusinessCaseOptionInput[];
}

export interface YearlyCashFlow {
  year: number;
  totalCost: number;
  totalBenefit: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface FinancialSummary {
  tco: number;
  totalBenefits: number;
  netBenefit: number;
  /** Null when net benefit is zero or negative, or investment is
   * zero — ROI is only meaningful when there is a real cost base to
   * divide by. Never a fabricated number to fill the field. */
  roiPercent: number | null;
  npv: number;
  /** Null when the cumulative cash flow never turns positive within
   * the modeled horizon — "no payback within N years" is itself the
   * honest answer, not a number to invent. */
  paybackYears: number | null;
}

export interface BusinessCaseOptionOutput {
  optionId: string;
  cashFlows: YearlyCashFlow[];
  summary: FinancialSummary;
  /** Rolled up from every line item's provenance — see
   * provenance.ts. Never set directly by an AI call. */
  confidence: { level: "high" | "medium" | "low"; reasons: string[] };
}

export interface BusinessCaseOutput {
  scenario: EconomicScenarioName;
  horizonYears: TimeHorizonYears;
  discountRatePercent: number;
  options: BusinessCaseOptionOutput[];
}
