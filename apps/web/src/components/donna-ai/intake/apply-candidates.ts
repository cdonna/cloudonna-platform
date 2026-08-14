import type { GoalTag, WizardState } from "../types";
import type { ExtractedField, ExtractionCandidates, ExtractionFieldKey, ExtractionResult } from "./extraction-types";

/**
 * The one place extraction output turns into real WizardState. This is
 * a plain data transform, not a second reducer — it builds the exact
 * shape SET_COMPANY_FIELD / SET_LANDSCAPE_FIELD / SET_CONSTRAINT_FIELD /
 * TOGGLE_GOAL would have produced had the user clicked through the
 * manual wizard, so buildDecisionOutput downstream never has to know
 * adaptive intake exists (see the Founder report's "ENGINE
 * COMPATIBILITY" section).
 *
 * Only `acceptedKeys` (and matching goal tags in `acceptedGoals`) are
 * actually written — a candidate the user never confirmed, or
 * explicitly declined, must not silently become a fact in WizardState.
 * The confirmation screen is what decides `acceptedKeys`, not this
 * function.
 */
export function applyExtractionResult(
  base: WizardState,
  extraction: ExtractionResult,
  acceptedKeys: ReadonlySet<ExtractionFieldKey>,
  acceptedGoals: ReadonlySet<GoalTag>,
): WizardState {
  const candidates = extraction.candidates;
  const get = <K extends ExtractionFieldKey>(key: K): ExtractionCandidates[K] | undefined =>
    acceptedKeys.has(key) ? candidates[key] : undefined;

  const industry = get("industry") as ExtractedField<WizardState["company"]["industry"]> | undefined;
  const country = get("country") as ExtractedField<WizardState["company"]["country"]> | undefined;
  const employees = get("employees") as ExtractedField<WizardState["company"]["employees"]> | undefined;

  const erp = get("erp") as ExtractedField<WizardState["landscape"]["erp"]> | undefined;
  const crm = get("crm") as ExtractedField<WizardState["landscape"]["crm"]> | undefined;
  const analytics = get("analytics") as ExtractedField<WizardState["landscape"]["analytics"]> | undefined;
  const dataWarehouse = get("dataWarehouse") as ExtractedField<WizardState["landscape"]["dataWarehouse"]> | undefined;
  const cloud = get("cloud") as ExtractedField<WizardState["landscape"]["cloud"]> | undefined;
  const aiPlatform = get("aiPlatform") as ExtractedField<WizardState["landscape"]["aiPlatform"]> | undefined;

  const budget = get("budget") as ExtractedField<WizardState["constraints"]["budget"]> | undefined;
  const timeline = get("timeline") as ExtractedField<WizardState["constraints"]["timeline"]> | undefined;
  const riskAppetite = get("riskAppetite") as ExtractedField<WizardState["constraints"]["riskAppetite"]> | undefined;
  const preferredCloud = get("preferredCloud") as ExtractedField<WizardState["constraints"]["preferredCloud"]> | undefined;
  const preferredVendor = get("preferredVendor") as ExtractedField<WizardState["constraints"]["preferredVendor"]> | undefined;
  const internalSkills = get("internalSkills") as ExtractedField<WizardState["constraints"]["internalSkills"]> | undefined;

  const goals = extraction.goals.filter((g) => acceptedGoals.has(g.value)).map((g) => g.value);

  // additionalSystems holds every landscape match beyond the first per
  // category (see extraction-types.ts) — real systems the statement
  // named that a single-value slot has no room for. Never dropped:
  // folded into landscape.note as plain, readable text, which already
  // flows into the report/assumptions the same way any other note does.
  // Scoring is untouched — only `candidates[category]`'s first match
  // (handled above) ever reaches WizardState's scored fields.
  const additionalSystemsNote =
    extraction.additionalSystems.length > 0
      ? `Also currently in use: ${extraction.additionalSystems.map((s) => s.label).join(", ")}.`
      : "";

  return {
    ...base,
    company: {
      ...base.company,
      industry: industry?.value ?? base.company.industry,
      country: country?.value ?? base.company.country,
      employees: employees?.value ?? base.company.employees,
      note: extraction.statement,
    },
    landscape: {
      ...base.landscape,
      erp: erp?.value ?? base.landscape.erp,
      crm: crm?.value ?? base.landscape.crm,
      analytics: analytics?.value ?? base.landscape.analytics,
      dataWarehouse: dataWarehouse?.value ?? base.landscape.dataWarehouse,
      cloud: cloud?.value ?? base.landscape.cloud,
      aiPlatform: aiPlatform?.value ?? base.landscape.aiPlatform,
      note: additionalSystemsNote || base.landscape.note,
    },
    goals: {
      ...base.goals,
      goals: Array.from(new Set([...base.goals.goals, ...goals])),
    },
    constraints: {
      ...base.constraints,
      budget: budget?.value ?? base.constraints.budget,
      timeline: timeline?.value ?? base.constraints.timeline,
      riskAppetite: riskAppetite?.value ?? base.constraints.riskAppetite,
      preferredCloud: preferredCloud?.value ?? base.constraints.preferredCloud,
      preferredVendor: preferredVendor?.value ?? base.constraints.preferredVendor,
      internalSkills: internalSkills?.value ?? base.constraints.internalSkills,
    },
  };
}
