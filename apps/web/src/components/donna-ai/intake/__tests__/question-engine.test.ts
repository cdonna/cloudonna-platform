import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE } from "../../data";
import type { WizardState } from "../../types";
import {
  canOfferRecommendation,
  computeDecisionReadiness,
  selectMissingQuestions,
  selectNextQuestion,
} from "../question-engine";

function stateWith(overrides: Partial<{
  goals: WizardState["goals"]["goals"];
  erp: WizardState["landscape"]["erp"];
  cloud: WizardState["landscape"]["cloud"];
  dataWarehouse: WizardState["landscape"]["dataWarehouse"];
  employees: WizardState["company"]["employees"];
  industry: WizardState["company"]["industry"];
  budget: WizardState["constraints"]["budget"];
  timeline: WizardState["constraints"]["timeline"];
  riskAppetite: WizardState["constraints"]["riskAppetite"];
  internalSkills: WizardState["constraints"]["internalSkills"];
  preferredVendor: WizardState["constraints"]["preferredVendor"];
  preferredCloud: WizardState["constraints"]["preferredCloud"];
}>): WizardState {
  return {
    ...EMPTY_WIZARD_STATE,
    company: {
      ...EMPTY_WIZARD_STATE.company,
      employees: overrides.employees ?? null,
      industry: overrides.industry ?? null,
    },
    landscape: {
      ...EMPTY_WIZARD_STATE.landscape,
      erp: overrides.erp ?? null,
      cloud: overrides.cloud ?? null,
      dataWarehouse: overrides.dataWarehouse ?? null,
    },
    goals: { ...EMPTY_WIZARD_STATE.goals, goals: overrides.goals ?? [] },
    constraints: {
      ...EMPTY_WIZARD_STATE.constraints,
      budget: overrides.budget ?? null,
      timeline: overrides.timeline ?? null,
      riskAppetite: overrides.riskAppetite ?? null,
      internalSkills: overrides.internalSkills ?? null,
      preferredVendor: overrides.preferredVendor ?? null,
      preferredCloud: overrides.preferredCloud ?? null,
    },
  };
}

describe("selectNextQuestion / selectMissingQuestions", () => {
  it("asks about goals before anything else on a fully empty state", () => {
    expect(selectNextQuestion(EMPTY_WIZARD_STATE)).toBe("goals");
  });

  it("moves to tier 2 landscape/company fields once goals are answered", () => {
    const state = stateWith({ goals: ["modernization"] });
    const next = selectNextQuestion(state);
    expect(["erp", "cloud", "dataWarehouse", "employees", "industry"]).toContain(next);
  });

  it("never surfaces tier 6 secondary-context fields by default", () => {
    const state = stateWith({
      goals: ["modernization"],
      erp: "sap-s4hana",
      cloud: "azure",
      dataWarehouse: "snowflake",
      employees: "enterprise",
      industry: "manufacturing",
      budget: "moderate",
      timeline: "standard",
      riskAppetite: "low",
      internalSkills: "moderate",
    });
    const missing = selectMissingQuestions(state);
    expect(missing).not.toContain("country");
    expect(missing).not.toContain("crm");
    expect(missing).not.toContain("analytics");
    expect(missing).not.toContain("aiPlatform");
  });

  it("surfaces tier 6 fields only when includeSecondary is requested", () => {
    const state = stateWith({ goals: ["modernization"], erp: "sap-s4hana", cloud: "azure", dataWarehouse: "snowflake" });
    const missing = selectMissingQuestions(state, { includeSecondary: true });
    expect(missing).toContain("country");
  });

  it("does not ask preferredVendor once erp already implies the same vendor alignment", () => {
    const state = stateWith({ goals: ["modernization"], erp: "sap-s4hana", cloud: "azure", dataWarehouse: "snowflake", employees: "enterprise", industry: "manufacturing", budget: "moderate", timeline: "standard" });
    expect(selectMissingQuestions(state)).not.toContain("preferredVendor");
  });

  it("does ask preferredVendor when erp is unknown", () => {
    const state = stateWith({ goals: ["modernization"], cloud: "azure", dataWarehouse: "snowflake", employees: "enterprise", industry: "manufacturing", budget: "moderate", timeline: "standard" });
    expect(selectMissingQuestions(state)).toContain("preferredVendor");
  });

  it("returns null once every tier 1-5 question has an answer", () => {
    const state = stateWith({
      goals: ["modernization"],
      erp: "sap-s4hana",
      cloud: "azure",
      dataWarehouse: "snowflake",
      employees: "enterprise",
      industry: "manufacturing",
      budget: "moderate",
      timeline: "standard",
      riskAppetite: "low",
      internalSkills: "moderate",
    });
    expect(selectNextQuestion(state)).toBeNull();
  });
});

describe("computeDecisionReadiness", () => {
  it("is not-enough-context on an empty state", () => {
    expect(computeDecisionReadiness(EMPTY_WIZARD_STATE)).toBe("not-enough-context");
  });

  it("is not-enough-context when goals are set but almost nothing else is known", () => {
    const state = stateWith({ goals: ["modernization"] });
    expect(computeDecisionReadiness(state)).toBe("not-enough-context");
  });

  it("is enough-to-compare once about half the core fields are known", () => {
    const state = stateWith({ goals: ["modernization"], erp: "sap-s4hana", cloud: "azure", dataWarehouse: "snowflake" });
    expect(computeDecisionReadiness(state)).toBe("enough-to-compare");
  });

  it("is enough-to-recommend once all 8 core fields are known but depth fields are not", () => {
    const state = stateWith({
      goals: ["modernization"],
      erp: "sap-s4hana",
      cloud: "azure",
      dataWarehouse: "snowflake",
      employees: "enterprise",
      industry: "manufacturing",
      budget: "moderate",
      timeline: "standard",
    });
    expect(computeDecisionReadiness(state)).toBe("enough-to-recommend");
  });

  it("is high-confidence once core and depth fields are all known", () => {
    const state = stateWith({
      goals: ["modernization"],
      erp: "sap-s4hana",
      cloud: "azure",
      dataWarehouse: "snowflake",
      employees: "enterprise",
      industry: "manufacturing",
      budget: "moderate",
      timeline: "standard",
      riskAppetite: "low",
      internalSkills: "moderate",
    });
    expect(computeDecisionReadiness(state)).toBe("high-confidence");
  });

  it("canOfferRecommendation is false until enough-to-compare is reached", () => {
    expect(canOfferRecommendation(EMPTY_WIZARD_STATE)).toBe(false);
    const compareReady = stateWith({ goals: ["modernization"], erp: "sap-s4hana", cloud: "azure", dataWarehouse: "snowflake" });
    expect(canOfferRecommendation(compareReady)).toBe(true);
  });
});
