import {
  AI_PLATFORM_OPTIONS,
  ANALYTICS_OPTIONS,
  BASE_ASSUMPTIONS,
  BUDGET_OPTIONS,
  BUDGET_RISK_TEXT,
  CLOUD_OPTIONS,
  COUNTRY_OPTIONS,
  CRM_OPTIONS,
  DATA_WAREHOUSE_OPTIONS,
  EMPLOYEE_OPTIONS,
  EMPTY_WIZARD_STATE,
  ERP_OPTIONS,
  FALLBACK_OPPORTUNITIES,
  FALLBACK_RISKS,
  FIT_CATEGORY_TRAITS,
  GOAL_OPPORTUNITY_TEXT,
  GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  INTERNAL_SKILLS_OPTIONS,
  IT_ORG_SIZE_OPTIONS,
  PLATFORM_CATALOG,
  PREFERRED_CLOUD_OPTIONS,
  PREFERRED_VENDOR_OPTIONS,
  REVENUE_OPTIONS,
  RISK_APPETITE_OPTIONS,
  SAMPLE_PROFILE,
  SKILLS_RISK_TEXT,
  TIMELINE_OPTIONS,
  TIMELINE_RISK_TEXT,
  TRAIT_REASON_TEXT,
  VENDOR_RISK_TEXT,
  WORKSHOP_LIBRARY,
} from "./data";
import {
  REVIEW_STEP_INDEX,
  type CompanyInput,
  type ConstraintsInput,
  type DecisionOutput,
  type FitBreakdown,
  type FitCategory,
  type LandscapeInput,
  type NextStepItem,
  type PlatformProfile,
  type RankedPlatform,
  type ReasonItem,
  type StepKey,
  type Trait,
  type WizardAction,
  type WizardState,
  type WorkshopItem,
} from "./types";

function optionLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T | null,
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}

function isCompanyComplete(input: CompanyInput): boolean {
  return (
    input.industry !== null &&
    input.country !== null &&
    input.employees !== null &&
    input.revenue !== null &&
    input.itOrgSize !== null
  );
}

function isLandscapeComplete(input: LandscapeInput): boolean {
  return (
    input.erp !== null &&
    input.crm !== null &&
    input.analytics !== null &&
    input.dataWarehouse !== null &&
    input.cloud !== null &&
    input.aiPlatform !== null
  );
}

function isConstraintsComplete(input: ConstraintsInput): boolean {
  return (
    input.budget !== null &&
    input.timeline !== null &&
    input.riskAppetite !== null &&
    input.preferredCloud !== null &&
    input.preferredVendor !== null &&
    input.internalSkills !== null
  );
}

export function canAdvanceFromStep(state: WizardState, stepIndex: number): boolean {
  if (stepIndex === 0) return isCompanyComplete(state.company);
  if (stepIndex === 1) return isLandscapeComplete(state.landscape);
  if (stepIndex === 2) return state.goals.goals.length > 0;
  if (stepIndex === 3) return isConstraintsComplete(state.constraints);
  return true;
}

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_COMPANY_FIELD":
      return {
        ...state,
        company: { ...state.company, [action.field]: action.value } as CompanyInput,
      };

    case "SET_LANDSCAPE_FIELD":
      return {
        ...state,
        landscape: { ...state.landscape, [action.field]: action.value } as LandscapeInput,
      };

    case "SET_CONSTRAINT_FIELD":
      return {
        ...state,
        constraints: { ...state.constraints, [action.field]: action.value } as ConstraintsInput,
      };

    case "TOGGLE_GOAL":
      return {
        ...state,
        goals: { ...state.goals, goals: toggleInArray(state.goals.goals, action.value) },
      };

    case "SET_NOTE": {
      const step: StepKey = action.step;
      return { ...state, [step]: { ...state[step], note: action.value } };
    }

    case "NEXT": {
      if (!canAdvanceFromStep(state, state.stepIndex)) {
        return state;
      }
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, REVIEW_STEP_INDEX) };
    }

    case "BACK":
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0) };

    case "GOTO_STEP":
      return {
        ...state,
        stepIndex: Math.max(0, Math.min(action.index, REVIEW_STEP_INDEX)),
      };

    case "LOAD_SAMPLE":
      return { ...SAMPLE_PROFILE, stepIndex: REVIEW_STEP_INDEX };

    case "RESET":
      return { ...EMPTY_WIZARD_STATE };

    default:
      return state;
  }
}

function activateTraits(state: WizardState): Set<Trait> {
  const traits = new Set<Trait>();

  if (state.company.employees === "enterprise" || state.company.employees === "global-enterprise") {
    traits.add("enterprise-scale");
  }

  if (state.landscape.erp === "sap-s4hana" || state.landscape.erp === "sap-ecc") {
    traits.add("sap-native");
  }
  if (state.landscape.dataWarehouse === "sap-bw") traits.add("sap-native");
  if (state.landscape.cloud === "azure") traits.add("azure-aligned");
  if (
    state.landscape.cloud === "aws" ||
    state.landscape.cloud === "gcp" ||
    state.landscape.cloud === "multi-cloud"
  ) {
    traits.add("multi-cloud");
  }
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
  if (state.constraints.preferredCloud === "aws" || state.constraints.preferredCloud === "gcp") {
    traits.add("multi-cloud");
  }
  if (state.constraints.riskAppetite === "low") traits.add("governed-data");

  return traits;
}

function scorePlatform(platform: PlatformProfile, activated: Set<Trait>): RankedPlatform {
  const matchedTraits = platform.traits.filter((trait) => activated.has(trait));
  const score = Math.min(34 + matchedTraits.length * 15, 98);
  return { platform, score, matchedTraits };
}

export function scoreAllPlatforms(state: WizardState): RankedPlatform[] {
  const activated = activateTraits(state);
  return PLATFORM_CATALOG.map((platform) => scorePlatform(platform, activated)).sort(
    (a, b) => b.score - a.score,
  );
}

export function computeFitBreakdown(recommendation: RankedPlatform): FitBreakdown[] {
  const categories: FitCategory[] = ["architecture", "business", "technology"];

  return categories.map((category) => {
    const categoryTraits = FIT_CATEGORY_TRAITS[category];
    const matched = recommendation.matchedTraits.filter((trait) =>
      categoryTraits.includes(trait),
    ).length;
    const score = Math.round((matched / categoryTraits.length) * 100);

    return {
      category,
      label:
        category === "architecture"
          ? "Architecture fit"
          : category === "business"
            ? "Business fit"
            : "Technology fit",
      score,
    };
  });
}

export function computeConfidence(state: WizardState): number {
  const categoriesFilled = [
    isCompanyComplete(state.company),
    isLandscapeComplete(state.landscape),
    state.goals.goals.length > 0,
    isConstraintsComplete(state.constraints),
  ].filter(Boolean).length;

  const notesWritten = [
    state.company.note,
    state.landscape.note,
    state.goals.note,
    state.constraints.note,
  ].filter((note) => note.trim().length > 0).length;

  return Math.min(55 + categoriesFilled * 6 + notesWritten * 5, 96);
}

function pickReasons(recommendation: RankedPlatform): ReasonItem[] {
  return recommendation.matchedTraits.slice(0, 3).map((trait) => ({
    trait,
    text: TRAIT_REASON_TEXT[trait],
  }));
}

function pickRisks(state: WizardState): string[] {
  const candidates = [
    state.constraints.budget ? BUDGET_RISK_TEXT[state.constraints.budget] : null,
    state.constraints.timeline ? TIMELINE_RISK_TEXT[state.constraints.timeline] : null,
    state.constraints.internalSkills ? SKILLS_RISK_TEXT[state.constraints.internalSkills] : null,
    state.constraints.preferredVendor ? VENDOR_RISK_TEXT[state.constraints.preferredVendor] : null,
  ].filter((text): text is string => text !== null);

  let index = 0;
  while (candidates.length < 2 && index < FALLBACK_RISKS.length) {
    candidates.push(FALLBACK_RISKS[index]);
    index += 1;
  }
  return candidates.slice(0, 3);
}

function pickOpportunities(state: WizardState): string[] {
  const opportunities = state.goals.goals.map((g) => GOAL_OPPORTUNITY_TEXT[g]);
  let index = 0;
  while (opportunities.length < 2 && index < FALLBACK_OPPORTUNITIES.length) {
    opportunities.push(FALLBACK_OPPORTUNITIES[index]);
    index += 1;
  }
  return opportunities.slice(0, 3);
}

function pickAssumptions(state: WizardState): string[] {
  const assumptions = [...BASE_ASSUMPTIONS];
  const stepsWithNotes: Array<{ label: string; note: string }> = [
    { label: "your company profile", note: state.company.note },
    { label: "your current landscape", note: state.landscape.note },
    { label: "your goals", note: state.goals.note },
    { label: "your constraints", note: state.constraints.note },
  ];

  for (const step of stepsWithNotes) {
    if (step.note.trim().length === 0) {
      assumptions.push(
        `No additional detail was provided for ${step.label} — assumed the selected options fully describe this area.`,
      );
    }
  }

  return assumptions.slice(0, 5);
}

function pickNextSteps(state: WizardState): NextStepItem[] {
  const hasAggressiveTimeline = state.constraints.timeline === "aggressive";

  return [
    {
      text: "Validate data governance and security requirements with your IT and security stakeholders.",
      horizon: "now",
    },
    {
      text: "Share this recommendation with your architecture review board.",
      horizon: "now",
    },
    hasAggressiveTimeline
      ? {
          text: "Define a phased rollout to de-risk your aggressive timeline.",
          horizon: "next",
        }
      : {
          text: "Run a proof-of-concept using two to three priority datasets.",
          horizon: "next",
        },
    {
      text: "Talk to the ClouDonna team about turning this into a full rollout plan.",
      horizon: "later",
    },
  ];
}

function pickWorkshops(state: WizardState): WorkshopItem[] {
  const matches: WorkshopItem[] = [];
  const byId = (id: string) => WORKSHOP_LIBRARY.find((w) => w.id === id)!;

  matches.push(byId("architecture-deep-dive"));

  if (state.goals.goals.includes("governance") || state.goals.goals.includes("data-products")) {
    matches.push(byId("governance-readiness"));
  }
  if (state.goals.goals.includes("business-ai") || state.goals.goals.includes("innovation")) {
    matches.push(byId("ai-readiness"));
  }
  if (state.constraints.budget === "tight") {
    matches.push(byId("tco-validation"));
  }
  if (state.constraints.timeline === "aggressive") {
    matches.push(byId("migration-planning"));
  }

  const unique = matches.filter(
    (workshop, index) => matches.findIndex((w) => w.title === workshop.title) === index,
  );

  let index = 0;
  while (unique.length < 2 && index < WORKSHOP_LIBRARY.length) {
    const candidate = WORKSHOP_LIBRARY[index];
    if (!unique.some((w) => w.title === candidate.title)) {
      unique.push(candidate);
    }
    index += 1;
  }

  return unique.slice(0, 3).map(({ title, description }) => ({ title, description }));
}

function buildExecutiveSummary(
  state: WizardState,
  recommendation: RankedPlatform,
  alternativesCount: number,
): string {
  const industryLabel = optionLabel(INDUSTRY_OPTIONS, state.company.industry);
  const sizeLabel = optionLabel(EMPLOYEE_OPTIONS, state.company.employees);
  const sizePhrase =
    sizeLabel && industryLabel
      ? `your ${sizeLabel}-employee ${industryLabel.toLowerCase()} company`
      : industryLabel
        ? `your ${industryLabel.toLowerCase()} organization`
        : "your organization";
  const alternativesPhrase = `${alternativesCount} alternative${alternativesCount === 1 ? " was" : "s were"} evaluated`;

  if (recommendation.matchedTraits.length === 0) {
    return `For ${sizePhrase}, none of your selected priorities strongly differentiated between platforms, so ${recommendation.platform.name} is shown as a starting point. ${alternativesPhrase} and scored similarly — add more detail in Landscape, Goals or Constraints for a sharper recommendation.`;
  }

  const topReason = TRAIT_REASON_TEXT[recommendation.matchedTraits[0]];

  return `For ${sizePhrase}, ${recommendation.platform.name} is the strongest fit: ${topReason.charAt(0).toLowerCase()}${topReason.slice(1)} ${alternativesPhrase} and scored lower on your stated priorities.`;
}

export function buildDecisionOutput(state: WizardState): DecisionOutput {
  const ranked = scoreAllPlatforms(state);
  const [recommendation, ...alternatives] = ranked;

  return {
    recommendation,
    alternativeRecommendation: alternatives[0] ?? null,
    alternatives,
    donnaScore: recommendation.score,
    confidenceScore: computeConfidence(state),
    fitBreakdown: computeFitBreakdown(recommendation),
    executiveSummary: buildExecutiveSummary(state, recommendation, alternatives.length),
    reasons: pickReasons(recommendation),
    risks: pickRisks(state).map((text) => ({ text })),
    opportunities: pickOpportunities(state).map((text) => ({ text })),
    assumptions: pickAssumptions(state).map((text) => ({ text })),
    nextSteps: pickNextSteps(state),
    workshops: pickWorkshops(state),
  };
}

function labelList<T extends string>(
  options: Array<{ value: T; label: string }>,
  values: T[],
): string {
  return values
    .map((value) => options.find((option) => option.value === value)?.label ?? value)
    .join(", ");
}

export function buildReportText(state: WizardState, output: DecisionOutput): string {
  const lines = [
    "ClouDonna — Donna AI Recommendation (Public Alpha preview)",
    "",
    "Company profile",
    `Industry: ${optionLabel(INDUSTRY_OPTIONS, state.company.industry) ?? "—"}`,
    `Country: ${optionLabel(COUNTRY_OPTIONS, state.company.country) ?? "—"}`,
    `Employees: ${optionLabel(EMPLOYEE_OPTIONS, state.company.employees) ?? "—"}`,
    `Revenue: ${optionLabel(REVENUE_OPTIONS, state.company.revenue) ?? "—"}`,
    `IT organization size: ${optionLabel(IT_ORG_SIZE_OPTIONS, state.company.itOrgSize) ?? "—"}`,
    "",
    "Current landscape",
    `ERP: ${optionLabel(ERP_OPTIONS, state.landscape.erp) ?? "—"}`,
    `CRM: ${optionLabel(CRM_OPTIONS, state.landscape.crm) ?? "—"}`,
    `Analytics: ${optionLabel(ANALYTICS_OPTIONS, state.landscape.analytics) ?? "—"}`,
    `Data warehouse: ${optionLabel(DATA_WAREHOUSE_OPTIONS, state.landscape.dataWarehouse) ?? "—"}`,
    `Cloud: ${optionLabel(CLOUD_OPTIONS, state.landscape.cloud) ?? "—"}`,
    `AI platform: ${optionLabel(AI_PLATFORM_OPTIONS, state.landscape.aiPlatform) ?? "—"}`,
    "",
    `Goals: ${labelList(GOAL_OPTIONS, state.goals.goals) || "—"}`,
    "",
    "Constraints",
    `Budget: ${optionLabel(BUDGET_OPTIONS, state.constraints.budget) ?? "—"}`,
    `Timeline: ${optionLabel(TIMELINE_OPTIONS, state.constraints.timeline) ?? "—"}`,
    `Risk appetite: ${optionLabel(RISK_APPETITE_OPTIONS, state.constraints.riskAppetite) ?? "—"}`,
    `Preferred cloud: ${optionLabel(PREFERRED_CLOUD_OPTIONS, state.constraints.preferredCloud) ?? "—"}`,
    `Preferred vendor: ${optionLabel(PREFERRED_VENDOR_OPTIONS, state.constraints.preferredVendor) ?? "—"}`,
    `Internal skills: ${optionLabel(INTERNAL_SKILLS_OPTIONS, state.constraints.internalSkills) ?? "—"}`,
    "",
    "Executive summary",
    output.executiveSummary,
    "",
    `Recommendation: ${output.recommendation.platform.name} — Donna Score ${output.donnaScore}% · Confidence ${output.confidenceScore}%`,
    output.alternativeRecommendation
      ? `Alternative recommendation: ${output.alternativeRecommendation.platform.name} — ${output.alternativeRecommendation.score}%`
      : "",
    "",
    "Why this recommendation",
    ...output.reasons.map((reason) => `- ${reason.text}`),
    "",
    "Alternatives considered",
    ...output.alternatives.map(
      (alternative) => `- ${alternative.platform.name} — ${alternative.score}%`,
    ),
    "",
    "Risks to validate",
    ...output.risks.map((risk) => `- ${risk.text}`),
    "",
    "Opportunities",
    ...output.opportunities.map((opportunity) => `- ${opportunity.text}`),
    "",
    "Assumptions",
    ...output.assumptions.map((assumption) => `- ${assumption.text}`),
    "",
    "Suggested next steps",
    ...output.nextSteps.map((step) => `- [${step.horizon}] ${step.text}`),
    "",
    "Suggested workshops",
    ...output.workshops.map((workshop) => `- ${workshop.title}: ${workshop.description}`),
    "",
    "This is illustrative demo output from the ClouDonna Public Alpha and not a certified recommendation.",
  ];

  return lines.join("\n");
}

export function downloadReport(state: WizardState, output: DecisionOutput): void {
  const text = buildReportText(state, output);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = output.recommendation.platform.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const link = document.createElement("a");
  link.href = url;
  link.download = `donna-ai-${slug || "recommendation"}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
