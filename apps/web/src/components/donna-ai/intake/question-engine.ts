import type { WizardState } from "../types";

/**
 * Every field this engine can ask about, tiered by real scoring
 * materiality — not schema presence. Verified directly against
 * scoring/engine.ts before writing this list: `crm`, `analytics`,
 * `country`, `revenue`, and `itOrgSize` are read only by the old
 * wizard's own completeness gate and by cosmetic report copy
 * (buildCurrentSituation / buildReportText in engine.ts) — none of
 * them appear in scoreAllPlatformsV2 or any per-dimension scoring
 * function. `aiPlatform` has one narrow effect (+5 to aiReadiness,
 * only when a platform is already established/leading). Everything
 * else below measurably changes trait activation, a dimension score,
 * or both — see the per-field comments.
 */
export type QuestionField =
  | "goals" // strategicFit, technologyFit AI-weighting, governanceFit want-signal
  | "erp" // sap-native trait -> architectureFit
  | "cloud" // azure/aws/gcp/multi-cloud trait -> architectureFit
  | "dataWarehouse" // sap-native or multi-cloud trait -> architectureFit
  | "employees" // businessFit sizeMatch, enterprise-scale trait
  | "industry" // businessFit industryMatch
  | "budget" // costFit
  | "timeline" // timeToValueFit
  | "preferredVendor" // sap/microsoft -> trait, redundant once erp/cloud already imply it
  | "preferredCloud" // azure/aws/gcp -> trait, redundant once cloud already known
  | "riskAppetite" // securityFit, governed-data trait
  | "internalSkills" // ecosystemFit
  | "aiPlatform" // minor aiReadiness bonus only
  | "country" // no scoring effect — report copy only
  | "revenue" // no scoring effect — report copy only
  | "itOrgSize" // no scoring effect — report copy only
  | "crm" // no scoring effect — report copy only
  | "analytics"; // no scoring effect — report copy only

export type QuestionTier = 1 | 2 | 3 | 4 | 5 | 6;

export const TIER_LABEL: Record<QuestionTier, string> = {
  1: "Decision objective",
  2: "Current landscape",
  3: "Hard constraints",
  4: "Strategic preference",
  5: "Risk / implementation reality",
  6: "Secondary context",
};

interface QuestionSpec {
  field: QuestionField;
  tier: QuestionTier;
  isAnswered: (state: WizardState) => boolean;
  /** True when this field's marginal value is already covered by
   * another, already-answered field — e.g. asking "preferred vendor"
   * separately once `erp` is already known to be SAP is asking
   * something Donna can already infer. Evaluated against the *current*
   * state, so it only suppresses the question once the covering field
   * is actually known, not unconditionally. */
  isRedundant?: (state: WizardState) => boolean;
}

const QUESTIONS: QuestionSpec[] = [
  { field: "goals", tier: 1, isAnswered: (s) => s.goals.goals.length > 0 },
  { field: "erp", tier: 2, isAnswered: (s) => s.landscape.erp !== null },
  { field: "cloud", tier: 2, isAnswered: (s) => s.landscape.cloud !== null },
  { field: "dataWarehouse", tier: 2, isAnswered: (s) => s.landscape.dataWarehouse !== null },
  { field: "employees", tier: 2, isAnswered: (s) => s.company.employees !== null },
  { field: "industry", tier: 2, isAnswered: (s) => s.company.industry !== null },
  { field: "budget", tier: 3, isAnswered: (s) => s.constraints.budget !== null },
  { field: "timeline", tier: 3, isAnswered: (s) => s.constraints.timeline !== null },
  {
    field: "preferredVendor",
    tier: 4,
    isAnswered: (s) => s.constraints.preferredVendor !== null,
    isRedundant: (s) => s.landscape.erp === "sap-s4hana" || s.landscape.erp === "sap-ecc",
  },
  {
    field: "preferredCloud",
    tier: 4,
    isAnswered: (s) => s.constraints.preferredCloud !== null,
    isRedundant: (s) => s.landscape.cloud !== null && s.landscape.cloud !== "on-premise",
  },
  { field: "riskAppetite", tier: 5, isAnswered: (s) => s.constraints.riskAppetite !== null },
  { field: "internalSkills", tier: 5, isAnswered: (s) => s.constraints.internalSkills !== null },
  { field: "aiPlatform", tier: 6, isAnswered: (s) => s.landscape.aiPlatform !== null },
  { field: "country", tier: 6, isAnswered: (s) => s.company.country !== null },
  { field: "revenue", tier: 6, isAnswered: (s) => s.company.revenue !== null },
  { field: "itOrgSize", tier: 6, isAnswered: (s) => s.company.itOrgSize !== null },
  { field: "crm", tier: 6, isAnswered: (s) => s.landscape.crm !== null },
  { field: "analytics", tier: 6, isAnswered: (s) => s.landscape.analytics !== null },
];

/**
 * Ordered list of fields still worth asking about, tier first. By
 * default stops at tier 5 (`includeSecondary: false`) — tier 6 fields
 * have zero measured effect on ranking, scoring, risk, architecture,
 * TCO, or confidence (see the QuestionField comment above), so forcing
 * them on every user would be asking "because the field exists," which
 * section 4 of the brief explicitly rules out. Pass
 * `includeSecondary: true` for the "Add more context" deep path.
 */
/** The real tier for a given field — used by the UI's small tier
 * indicator (e.g. "Hard constraints" while asking about budget), which
 * previously hardcoded every non-goals question as tier 2 regardless
 * of what it actually asked. */
export function tierForField(field: QuestionField): QuestionTier {
  return QUESTIONS.find((question) => question.field === field)?.tier ?? 6;
}

export function selectMissingQuestions(state: WizardState, options: { includeSecondary?: boolean } = {}): QuestionField[] {
  const { includeSecondary = false } = options;

  return QUESTIONS.filter((question) => {
    if (!includeSecondary && question.tier === 6) return false;
    if (question.isAnswered(state)) return false;
    if (question.isRedundant?.(state)) return false;
    return true;
  })
    .sort((a, b) => a.tier - b.tier)
    .map((question) => question.field);
}

/** The single next question to ask — the adaptive loop asks one at a
 * time (same "conversation, not a form" discipline as
 * ConversationalFieldFlow), so only the head of the priority order
 * matters at any given moment. */
export function selectNextQuestion(state: WizardState, options: { includeSecondary?: boolean } = {}): QuestionField | null {
  return selectMissingQuestions(state, options)[0] ?? null;
}

export type DecisionReadiness = "not-enough-context" | "enough-to-compare" | "enough-to-recommend" | "high-confidence";

export const READINESS_LABEL: Record<DecisionReadiness, string> = {
  "not-enough-context": "Not enough context yet",
  "enough-to-compare": "Enough to compare platforms",
  "enough-to-recommend": "Enough for a recommendation",
  "high-confidence": "High-confidence recommendation",
};

/** The 8 fields with directly measured scoring impact (tiers 1–3) —
 * the same fields activateTraits() and the per-dimension scorers in
 * scoring/engine.ts actually read. Deliberately excludes tier 4/5
 * (real but secondary/redundant-prone signal) and tier 6 (no scoring
 * effect at all) from the core count, so readiness reflects genuine
 * decision quality, not just form completion. */
function countCoreFieldsKnown(state: WizardState): number {
  return [
    state.goals.goals.length > 0,
    state.landscape.erp !== null,
    state.landscape.cloud !== null,
    state.landscape.dataWarehouse !== null,
    state.company.employees !== null,
    state.company.industry !== null,
    state.constraints.budget !== null,
    state.constraints.timeline !== null,
  ].filter(Boolean).length;
}

/** Tier 5 — risk appetite and internal skills — refine confidence and
 * risk framing without changing which platform wins, so they gate the
 * top readiness tier without being required for a recommendation at all. */
function countDepthFieldsKnown(state: WizardState): number {
  return [state.constraints.riskAppetite !== null, state.constraints.internalSkills !== null].filter(Boolean).length;
}

/**
 * Deterministic, pure, and testable on purpose — this is the one place
 * "does Donna know enough yet" gets decided, and it must never depend
 * on anything but the state itself (no timers, no randomness, no
 * network). See the Founder report's "DECISION READINESS MODEL"
 * section for the reasoning behind each threshold.
 */
export function computeDecisionReadiness(state: WizardState): DecisionReadiness {
  const coreKnown = countCoreFieldsKnown(state);
  const depthKnown = countDepthFieldsKnown(state);

  if (state.goals.goals.length === 0 || coreKnown < 3) return "not-enough-context";
  if (coreKnown < 6) return "enough-to-compare";
  if (coreKnown < 8 || depthKnown < 2) return "enough-to-recommend";
  return "high-confidence";
}

/** "Enough to compare" or better is the line for offering "Get
 * recommendation" instead of forcing another question — matches
 * section 6's "stop asking when the engine has enough information to
 * produce a meaningful recommendation," read together with section 7's
 * "some users will want a fast answer." Compare, not recommend, is the
 * deliberately lower bar: a meaningful recommendation can exist before
 * every core field is known, and buildDecisionOutput/computeConfidence
 * already communicate the resulting uncertainty honestly via a lower
 * confidenceScore — the gate here is about not blocking the user, not
 * about pretending less-complete input is as strong as more. */
export function canOfferRecommendation(state: WizardState): boolean {
  const readiness = computeDecisionReadiness(state);
  return readiness === "enough-to-compare" || readiness === "enough-to-recommend" || readiness === "high-confidence";
}
