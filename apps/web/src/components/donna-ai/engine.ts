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
  GOAL_OPPORTUNITY_TEXT,
  GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  INTERNAL_SKILLS_OPTIONS,
  IT_ORG_SIZE_OPTIONS,
  PREFERRED_CLOUD_OPTIONS,
  PREFERRED_VENDOR_OPTIONS,
  REVENUE_OPTIONS,
  RISK_APPETITE_OPTIONS,
  SAMPLE_PROFILE,
  TIMELINE_OPTIONS,
  WORKSHOP_LIBRARY,
} from "./data";
import { scoreAllPlatformsV2 } from "./scoring/engine";
import type { DimensionResult, RankedPlatform } from "./scoring/types";
import {
  REVIEW_STEP_INDEX,
  type CompanyInput,
  type ConstraintsInput,
  type DecisionOutput,
  type EvidenceItem,
  type LandscapeInput,
  type NextStepItem,
  type StepKey,
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
      return { ...state, company: { ...state.company, [action.field]: action.value } as CompanyInput };

    case "SET_LANDSCAPE_FIELD":
      return { ...state, landscape: { ...state.landscape, [action.field]: action.value } as LandscapeInput };

    case "SET_CONSTRAINT_FIELD":
      return { ...state, constraints: { ...state.constraints, [action.field]: action.value } as ConstraintsInput };

    case "TOGGLE_GOAL":
      return { ...state, goals: { ...state.goals, goals: toggleInArray(state.goals.goals, action.value) } };

    case "SET_NOTE": {
      const step: StepKey = action.step;
      return { ...state, [step]: { ...state[step], note: action.value } };
    }

    case "NEXT": {
      if (!canAdvanceFromStep(state, state.stepIndex)) return state;
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, REVIEW_STEP_INDEX) };
    }

    case "BACK":
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0) };

    case "GOTO_STEP":
      return { ...state, stepIndex: Math.max(0, Math.min(action.index, REVIEW_STEP_INDEX)) };

    case "LOAD_SAMPLE":
      return { ...SAMPLE_PROFILE, stepIndex: REVIEW_STEP_INDEX };

    case "RESET":
      return { ...EMPTY_WIZARD_STATE };

    case "RESTORE":
      return action.state;

    default:
      return state;
  }
}

/** Confidence reflects both input completeness and the quality of scoring signal found — not just "did you fill in the form." */
export function computeConfidence(state: WizardState, topResult: RankedPlatform): number {
  const categoriesFilled = [
    isCompanyComplete(state.company),
    isLandscapeComplete(state.landscape),
    state.goals.goals.length > 0,
    isConstraintsComplete(state.constraints),
  ].filter(Boolean).length;

  const notesWritten = [state.company.note, state.landscape.note, state.goals.note, state.constraints.note].filter(
    (note) => note.trim().length > 0,
  ).length;

  const architectureDimension = topResult.dimensions.find((d) => d.key === "architecture");
  const hasWeakSignal = (architectureDimension?.positiveEvidence.length ?? 0) === 0;

  let confidence = 55 + categoriesFilled * 6 + notesWritten * 5;
  if (hasWeakSignal) confidence -= 10;

  return Math.max(30, Math.min(96, confidence));
}

function pickRisks(state: WizardState): string[] {
  const candidates = [
    state.constraints.budget ? BUDGET_RISK_TEXT[state.constraints.budget] : null,
    state.constraints.timeline === "aggressive"
      ? "An aggressive timeline increases delivery risk — a phased rollout is worth considering."
      : null,
    state.constraints.internalSkills === "limited"
      ? "Implementation will likely require external expertise given limited internal capacity."
      : null,
    state.constraints.preferredVendor === "sap"
      ? "Concentrating on a single vendor increases commercial dependency over time."
      : null,
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
    { text: "Share this recommendation with your architecture review board.", horizon: "now" },
    hasAggressiveTimeline
      ? { text: "Define a phased rollout to de-risk your aggressive timeline.", horizon: "next" }
      : { text: "Run a proof-of-concept using two to three priority datasets.", horizon: "next" },
    { text: "Talk to the ClouDonna team about turning this into a full rollout plan.", horizon: "later" },
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
  if (state.constraints.budget === "tight") matches.push(byId("tco-validation"));
  if (state.constraints.timeline === "aggressive") matches.push(byId("migration-planning"));

  const unique = matches.filter((workshop, index) => matches.findIndex((w) => w.title === workshop.title) === index);

  let index = 0;
  while (unique.length < 2 && index < WORKSHOP_LIBRARY.length) {
    const candidate = WORKSHOP_LIBRARY[index];
    if (!unique.some((w) => w.title === candidate.title)) unique.push(candidate);
    index += 1;
  }

  return unique.slice(0, 3).map(({ title, description }) => ({ title, description }));
}

function buildCurrentSituation(state: WizardState): string {
  const parts = [
    { label: "ERP", value: optionLabel(ERP_OPTIONS, state.landscape.erp) },
    { label: "CRM", value: optionLabel(CRM_OPTIONS, state.landscape.crm) },
    { label: "analytics", value: optionLabel(ANALYTICS_OPTIONS, state.landscape.analytics) },
    { label: "data warehouse", value: optionLabel(DATA_WAREHOUSE_OPTIONS, state.landscape.dataWarehouse) },
    { label: "cloud", value: optionLabel(CLOUD_OPTIONS, state.landscape.cloud) },
    { label: "AI platform", value: optionLabel(AI_PLATFORM_OPTIONS, state.landscape.aiPlatform) },
  ]
    .filter((part) => part.value && part.value !== "Other / None" && part.value !== "None yet")
    .map((part) => `${part.value} for ${part.label}`);

  if (parts.length === 0) {
    return "No specific systems were identified in your current landscape.";
  }

  return `Currently running ${parts.join(", ")}.`;
}

function buildDecisionDrivers(state: WizardState): string[] {
  const drivers = state.goals.goals
    .map((goal) => optionLabel(GOAL_OPTIONS, goal))
    .filter((label): label is string => label !== null);

  if (state.constraints.timeline === "aggressive") drivers.push("Aggressive timeline");
  if (state.constraints.budget === "tight") drivers.push("Tight budget");
  if (state.constraints.riskAppetite === "low") drivers.push("Low risk appetite");

  return drivers;
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

  const architectureDimension = recommendation.dimensions.find((d) => d.key === "architecture");
  const topReason = architectureDimension?.positiveEvidence[0];

  if (!topReason) {
    return `For ${sizePhrase}, none of your selected priorities strongly differentiated between platforms, so ${recommendation.platform.productName} is shown as a starting point (overall score ${recommendation.overallScore}%). ${alternativesPhrase} and scored similarly — add more detail in Landscape, Goals or Constraints for a sharper recommendation.`;
  }

  return `For ${sizePhrase}, ${recommendation.platform.productName} is the strongest fit (overall score ${recommendation.overallScore}%): ${topReason.charAt(0).toLowerCase()}${topReason.slice(1)} ${alternativesPhrase} and scored lower on your stated priorities.`;
}

function collectEvidence(ranked: RankedPlatform): { positive: EvidenceItem[]; concerns: EvidenceItem[] } {
  const positive: EvidenceItem[] = [];
  const concerns: EvidenceItem[] = [];

  for (const dimension of ranked.dimensions as DimensionResult[]) {
    for (const text of dimension.positiveEvidence) positive.push({ dimension: dimension.key, text });
    for (const text of dimension.negativeEvidence) concerns.push({ dimension: dimension.key, text });
  }

  return { positive: positive.slice(0, 6), concerns: concerns.slice(0, 6) };
}

export function buildDecisionOutput(state: WizardState): DecisionOutput {
  const ranked = scoreAllPlatformsV2(state);
  const [recommendation, ...alternatives] = ranked;
  const { positive, concerns } = collectEvidence(recommendation);

  return {
    recommendation,
    alternativeRecommendation: alternatives[0] ?? null,
    alternatives,
    donnaScore: recommendation.overallScore,
    confidenceScore: computeConfidence(state, recommendation),
    dimensions: recommendation.dimensions,
    currentSituation: buildCurrentSituation(state),
    decisionDrivers: buildDecisionDrivers(state),
    executiveSummary: buildExecutiveSummary(state, recommendation, alternatives.length),
    positiveEvidence: positive,
    concerns,
    risks: pickRisks(state).map((text) => ({ text })),
    opportunities: pickOpportunities(state).map((text) => ({ text })),
    assumptions: pickAssumptions(state).map((text) => ({ text })),
    nextSteps: pickNextSteps(state),
    workshops: pickWorkshops(state),
  };
}

function labelList<T extends string>(options: Array<{ value: T; label: string }>, values: T[]): string {
  return values.map((value) => options.find((option) => option.value === value)?.label ?? value).join(", ");
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
    "Current situation",
    output.currentSituation,
    "",
    `Decision drivers: ${output.decisionDrivers.join(", ") || "—"}`,
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
    `Recommendation: ${output.recommendation.platform.productName} — Donna Score ${output.donnaScore}% · Confidence ${output.confidenceScore}%`,
    output.alternativeRecommendation
      ? `Alternative recommendation: ${output.alternativeRecommendation.platform.productName} — ${output.alternativeRecommendation.overallScore}%`
      : "",
    "",
    "Score breakdown",
    ...output.dimensions.map((d) => `- ${d.label}: ${d.score}% (weight ${Math.round(d.weight * 100)}%)`),
    "",
    "Positive evidence",
    ...output.positiveEvidence.map((e) => `- ${e.text}`),
    "",
    "Concerns",
    ...output.concerns.map((e) => `- ${e.text}`),
    "",
    "Alternatives considered",
    ...output.alternatives.map((alt) => `- ${alt.platform.productName} — ${alt.overallScore}%`),
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
    "This is illustrative alpha output based on curated mock data. No live market data was used, no AI model was called, and this assessment is not persisted.",
  ];

  return lines.join("\n");
}

export function downloadReport(state: WizardState, output: DecisionOutput): void {
  const text = buildReportText(state, output);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = output.recommendation.platform.productName
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
