import { describe, expect, it } from "vitest";
import { computeHygieneIssues, type HygieneOpportunityInput } from "../pipeline-hygiene";

const CLEAN: HygieneOpportunityInput = {
  stage: "discovery",
  primaryContactId: "contact-1",
  nextAction: "Send proposal",
  nextActionDueAt: "2099-01-01",
  targetCloseDate: "2099-01-01",
  useCase: "Data platform migration",
  decisionDeadline: "2099-01-01",
  expectedBookingsChf: 25_000,
  expectedArrChf: null,
  expectedTcvChf: 25_000,
  stageChangedAt: new Date().toISOString(),
};

describe("computeHygieneIssues", () => {
  it("flags nothing for a fully-populated, fresh, open opportunity with an economic buyer", () => {
    expect(computeHygieneIssues(CLEAN, true)).toEqual([]);
  });

  it("never flags a closed opportunity (won or lost) — hygiene only applies to open pipeline", () => {
    expect(computeHygieneIssues({ ...CLEAN, stage: "closed_won" }, false)).toEqual([]);
    expect(computeHygieneIssues({ ...CLEAN, stage: "closed_lost" }, false)).toEqual([]);
  });

  it("flags every missing field independently", () => {
    const empty: HygieneOpportunityInput = {
      ...CLEAN,
      primaryContactId: null,
      nextAction: null,
      useCase: "",
      decisionDeadline: null,
      expectedBookingsChf: null,
      expectedArrChf: null,
      expectedTcvChf: null,
    };
    const issues = computeHygieneIssues(empty, false);
    expect(issues).toContain("no_primary_contact");
    expect(issues).toContain("no_next_action");
    expect(issues).toContain("no_decision_use_case");
    expect(issues).toContain("missing_decision_deadline");
    expect(issues).toContain("no_expected_value");
    expect(issues).toContain("missing_economic_buyer");
  });

  it("flags an overdue next action and a past close date", () => {
    const issues = computeHygieneIssues({ ...CLEAN, nextActionDueAt: "2020-01-01", targetCloseDate: "2020-01-01" }, true);
    expect(issues).toContain("next_action_overdue");
    expect(issues).toContain("close_date_in_past");
  });

  it("flags a stale stage only past the documented threshold", () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeHygieneIssues({ ...CLEAN, stageChangedAt: thirtyOneDaysAgo }, true)).toContain("stale_stage");
    expect(computeHygieneIssues({ ...CLEAN, stageChangedAt: tenDaysAgo }, true)).not.toContain("stale_stage");
  });
});
