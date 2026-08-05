import { EMPLOYEE_OPTIONS, INDUSTRY_OPTIONS, TRAIT_REASON_TEXT } from "../data";
import type { Trait, WizardState } from "../types";
import type { MaturityBand, VendorPlatformProfile } from "../vendor-intelligence/types";
import { VENDOR_CATALOG } from "../vendor-intelligence/catalog";
import { SCORE_DIMENSION_LABELS, SCORE_WEIGHTS } from "./weights";
import type { DimensionResult, RankedPlatform, ScoreDimensionKey } from "./types";

const BAND_SCORE: Record<MaturityBand, number> = {
  emerging: 40,
  developing: 58,
  established: 75,
  leading: 92,
};

const COST_TIER_BASE: Record<VendorPlatformProfile["costTier"], number> = {
  entry: 90,
  mid: 75,
  premium: 55,
  "enterprise-custom": 40,
};

const TIME_TO_VALUE_BASE: Record<VendorPlatformProfile["timeToValue"], number> = {
  weeks: 95,
  "1-3-months": 78,
  "3-6-months": 55,
  "6-plus-months": 35,
};

function clamp(value: number, min = 5, max = 98): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function optionLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T | null,
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}

/** Traits activated by the wizard input — the same mechanism the v1 engine used, now scoped to feed Architecture Fit specifically. */
function activateTraits(state: WizardState): Set<Trait> {
  const traits = new Set<Trait>();

  if (state.company.employees === "enterprise" || state.company.employees === "global-enterprise") {
    traits.add("enterprise-scale");
  }

  if (state.landscape.erp === "sap-s4hana" || state.landscape.erp === "sap-ecc") traits.add("sap-native");
  if (state.landscape.dataWarehouse === "sap-bw") traits.add("sap-native");
  if (state.landscape.cloud === "azure") traits.add("azure-aligned");
  if (state.landscape.cloud === "aws") traits.add("aws-aligned");
  if (state.landscape.cloud === "gcp") traits.add("gcp-aligned");
  if (state.landscape.cloud === "multi-cloud") traits.add("multi-cloud");
  if (
    state.landscape.dataWarehouse === "snowflake" ||
    state.landscape.dataWarehouse === "databricks" ||
    state.landscape.dataWarehouse === "bigquery"
  ) {
    traits.add("multi-cloud");
  }

  for (const goal of state.goals.goals) {
    if (goal === "modernization") traits.add("modern-architecture");
    if (goal === "business-ai" || goal === "innovation") traits.add("ai-ready");
    if (goal === "governance" || goal === "data-products") traits.add("governed-data");
    if (goal === "cost-reduction") traits.add("cost-efficient");
  }

  if (state.constraints.budget === "tight") traits.add("cost-efficient");
  if (state.constraints.preferredVendor === "sap") traits.add("sap-native");
  if (state.constraints.preferredVendor === "microsoft") traits.add("azure-aligned");
  if (state.constraints.preferredCloud === "azure") traits.add("azure-aligned");
  if (state.constraints.preferredCloud === "aws") traits.add("aws-aligned");
  if (state.constraints.preferredCloud === "gcp") traits.add("gcp-aligned");
  if (state.constraints.riskAppetite === "low") traits.add("governed-data");

  return traits;
}

function architectureFit(state: WizardState, platform: VendorPlatformProfile, activated: Set<Trait>): DimensionResult {
  const matched = platform.traits.filter((trait) => activated.has(trait));
  const score = clamp(30 + matched.length * 16);

  return {
    key: "architecture",
    label: SCORE_DIMENSION_LABELS.architecture,
    score,
    weight: SCORE_WEIGHTS.architecture,
    positiveEvidence: matched.map((trait) => TRAIT_REASON_TEXT[trait]),
    negativeEvidence:
      matched.length === 0
        ? ["No specific architectural alignment found between your landscape and this platform."]
        : [],
  };
}

function businessFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const industryLabel = optionLabel(INDUSTRY_OPTIONS, state.company.industry);
  const sizeLabel = optionLabel(EMPLOYEE_OPTIONS, state.company.employees);
  const industryMatch = state.company.industry !== null && platform.industryFit.includes(state.company.industry);
  const sizeMatch = state.company.employees !== null && platform.companySizeFit.includes(state.company.employees);

  const score = clamp(40 + (industryMatch ? 29 : 0) + (sizeMatch ? 29 : 0));
  const positive: string[] = [];
  const negative: string[] = [];

  if (industryMatch) positive.push(`Commonly deployed in ${industryLabel}.`);
  else if (industryLabel) negative.push(`Less commonly deployed in ${industryLabel} specifically.`);

  if (sizeMatch) positive.push(`Fits organizations of your size (${sizeLabel} employees).`);
  else if (sizeLabel) negative.push(`Not typically positioned for organizations of your size (${sizeLabel} employees).`);

  return { key: "business", label: SCORE_DIMENSION_LABELS.business, score, weight: SCORE_WEIGHTS.business, positiveEvidence: positive, negativeEvidence: negative };
}

function technologyFit(state: WizardState, platform: VendorPlatformProfile, activated: Set<Trait>): DimensionResult {
  const techTraits: Trait[] = ["ai-ready", "hyperscale-infra", "operational-workload", "vendor-neutral"];
  const matchedTraits = platform.traits.filter((trait) => techTraits.includes(trait) && activated.has(trait));
  const wantsAi = state.goals.goals.includes("business-ai") || state.goals.goals.includes("innovation");

  const traitScore = clamp(35 + matchedTraits.length * 20);
  const aiScore = BAND_SCORE[platform.aiCapabilities];
  const score = clamp(wantsAi ? traitScore * 0.4 + aiScore * 0.6 : traitScore * 0.7 + aiScore * 0.3);

  const positive: string[] = matchedTraits.map((trait) => TRAIT_REASON_TEXT[trait]);
  const negative: string[] = [];

  if (wantsAi && (platform.aiCapabilities === "emerging" || platform.aiCapabilities === "developing")) {
    negative.push("AI capabilities are still developing relative to your stated AI ambitions.");
  }
  if (wantsAi && (platform.aiCapabilities === "established" || platform.aiCapabilities === "leading")) {
    positive.push(`AI capabilities are ${platform.aiCapabilities}, aligning with your business AI goals.`);
  }

  return { key: "technology", label: SCORE_DIMENSION_LABELS.technology, score, weight: SCORE_WEIGHTS.technology, positiveEvidence: positive, negativeEvidence: negative };
}

function governanceFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const wantsGovernance =
    state.goals.goals.includes("governance") || state.goals.goals.includes("data-products") || state.goals.goals.includes("compliance");
  const strongBand = platform.governance === "established" || platform.governance === "leading";

  let score = BAND_SCORE[platform.governance];
  if (wantsGovernance) score += strongBand ? 6 : -10;
  score = clamp(score);

  const positive: string[] = [`Governance capability is rated ${platform.governance}.`];
  const negative: string[] = [];
  if (wantsGovernance && !strongBand) {
    negative.push("Governance maturity may not fully match your stated governance/compliance goals.");
  }

  return { key: "governance", label: SCORE_DIMENSION_LABELS.governance, score, weight: SCORE_WEIGHTS.governance, positiveEvidence: positive, negativeEvidence: negative };
}

function aiReadinessFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const wantsAi = state.goals.goals.includes("business-ai") || state.goals.goals.includes("innovation");
  const hasAiPlatform = state.landscape.aiPlatform !== null && state.landscape.aiPlatform !== "none-yet";

  let score = BAND_SCORE[platform.aiCapabilities];
  if (hasAiPlatform && (platform.aiCapabilities === "established" || platform.aiCapabilities === "leading")) score += 5;
  score = clamp(score);

  const positive: string[] = [`AI readiness is rated ${platform.aiCapabilities}.`];
  const negative: string[] = [];
  if (wantsAi && (platform.aiCapabilities === "emerging" || platform.aiCapabilities === "developing")) {
    negative.push("May require additional investment to reach your AI ambitions.");
  }

  return { key: "aiReadiness", label: SCORE_DIMENSION_LABELS.aiReadiness, score, weight: SCORE_WEIGHTS.aiReadiness, positiveEvidence: positive, negativeEvidence: negative };
}

function securityFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const lowRiskAppetite = state.constraints.riskAppetite === "low";
  const strongSecurity = platform.security === "established" || platform.security === "leading";

  let score = BAND_SCORE[platform.security];
  if (lowRiskAppetite) score += strongSecurity ? 5 : -10;
  score = clamp(score);

  const positive: string[] = [`Security posture is rated ${platform.security}.`];
  const negative: string[] = [];
  if (lowRiskAppetite && !strongSecurity) {
    negative.push("Security posture should be validated carefully given your stated low risk appetite.");
  }

  return { key: "security", label: SCORE_DIMENSION_LABELS.security, score, weight: SCORE_WEIGHTS.security, positiveEvidence: positive, negativeEvidence: negative };
}

function ecosystemFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const limitedSkills = state.constraints.internalSkills === "limited";
  const strongPartnerNetwork = platform.partnerNetwork === "established" || platform.partnerNetwork === "leading";

  let score = (BAND_SCORE[platform.ecosystemStrength] + BAND_SCORE[platform.partnerNetwork]) / 2;
  if (limitedSkills) score += strongPartnerNetwork ? 6 : -8;
  score = clamp(score);

  const positive: string[] = [`Ecosystem strength ${platform.ecosystemStrength}, partner network ${platform.partnerNetwork}.`];
  const negative: string[] = [];
  if (limitedSkills && !strongPartnerNetwork) {
    negative.push("Limited internal skills plus a thinner partner network may slow delivery.");
  }

  return { key: "ecosystem", label: SCORE_DIMENSION_LABELS.ecosystem, score, weight: SCORE_WEIGHTS.ecosystem, positiveEvidence: positive, negativeEvidence: negative };
}

function costFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const base = COST_TIER_BASE[platform.costTier];
  const budget = state.constraints.budget;

  let score = base;
  if (budget === "flexible") score = base + (100 - base) * 0.5;
  else if (budget === "moderate") score = base + (100 - base) * 0.2;
  score = clamp(score);

  const positive: string[] = [];
  const negative: string[] = [];
  if (budget === "tight" && (platform.costTier === "premium" || platform.costTier === "enterprise-custom")) {
    negative.push(`Cost tier (${platform.costTier}) may be difficult to justify against a tight budget.`);
  } else {
    positive.push(`Cost tier is ${platform.costTier}: ${platform.pricingModel}`);
  }

  return { key: "cost", label: SCORE_DIMENSION_LABELS.cost, score, weight: SCORE_WEIGHTS.cost, positiveEvidence: positive, negativeEvidence: negative };
}

function timeToValueFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const base = TIME_TO_VALUE_BASE[platform.timeToValue];
  const timeline = state.constraints.timeline;

  let score = base;
  if (timeline === "extended") score = base + (100 - base) * 0.5;
  score = clamp(score);

  const positive: string[] = [];
  const negative: string[] = [];
  if (timeline === "aggressive" && (platform.timeToValue === "3-6-months" || platform.timeToValue === "6-plus-months")) {
    negative.push(`Typical time-to-value (${platform.timeToValue}) may not match your aggressive timeline.`);
  } else {
    positive.push(`Typical time-to-value: ${platform.timeToValue}.`);
  }

  return { key: "timeToValue", label: SCORE_DIMENSION_LABELS.timeToValue, score, weight: SCORE_WEIGHTS.timeToValue, positiveEvidence: positive, negativeEvidence: negative };
}

const GOAL_TRAIT_MAP: Partial<Record<string, Trait>> = {
  modernization: "modern-architecture",
  "business-ai": "ai-ready",
  governance: "governed-data",
  "data-products": "governed-data",
  "cost-reduction": "cost-efficient",
  compliance: "governed-data",
  innovation: "ai-ready",
};

function strategicFit(state: WizardState, platform: VendorPlatformProfile): DimensionResult {
  const selectedGoals = state.goals.goals;
  if (selectedGoals.length === 0) {
    return { key: "strategic", label: SCORE_DIMENSION_LABELS.strategic, score: 50, weight: SCORE_WEIGHTS.strategic, positiveEvidence: [], negativeEvidence: ["No goals selected to evaluate strategic alignment against."] };
  }

  const matchedGoals = selectedGoals.filter((goal) => {
    const trait = GOAL_TRAIT_MAP[goal];
    return trait !== undefined && platform.traits.includes(trait);
  });

  const score = clamp(30 + (70 * matchedGoals.length) / selectedGoals.length);
  const positive =
    matchedGoals.length > 0
      ? [`Aligns with ${matchedGoals.length} of your ${selectedGoals.length} stated goal(s).`]
      : [];
  const negative =
    matchedGoals.length < selectedGoals.length
      ? [`Does not clearly address ${selectedGoals.length - matchedGoals.length} of your stated goal(s).`]
      : [];

  return { key: "strategic", label: SCORE_DIMENSION_LABELS.strategic, score, weight: SCORE_WEIGHTS.strategic, positiveEvidence: positive, negativeEvidence: negative };
}

function scorePlatform(state: WizardState, platform: VendorPlatformProfile): RankedPlatform {
  const activated = activateTraits(state);

  const dimensions: DimensionResult[] = [
    architectureFit(state, platform, activated),
    businessFit(state, platform),
    technologyFit(state, platform, activated),
    governanceFit(state, platform),
    aiReadinessFit(state, platform),
    securityFit(state, platform),
    ecosystemFit(state, platform),
    costFit(state, platform),
    timeToValueFit(state, platform),
    strategicFit(state, platform),
  ];

  const overallScore = clamp(dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0));

  return { platform, overallScore, dimensions };
}

export function scoreAllPlatformsV2(state: WizardState): RankedPlatform[] {
  return VENDOR_CATALOG.map((platform) => scorePlatform(state, platform)).sort(
    (a, b) => b.overallScore - a.overallScore,
  );
}

export function getDimension(ranked: RankedPlatform, key: ScoreDimensionKey): DimensionResult | undefined {
  return ranked.dimensions.find((dimension) => dimension.key === key);
}
