import { describe, expect, it } from "vitest";
import { computeRevenuePosition, type RevenuePositionOpportunityInput } from "../revenue-position";

const BASE_OPP: RevenuePositionOpportunityInput = {
  id: "opp-1",
  accountId: "acc-1",
  accountName: "Acme",
  stage: "closed_won",
  commercialPackage: "team",
  primaryContactId: "contact-1",
  nextAction: null,
  nextActionDueAt: null,
  targetCloseDate: null,
  useCase: "Data platform",
  decisionDeadline: "2099-01-01",
  expectedBookingsChf: 75_000,
  expectedArrChf: 75_000,
  expectedAcvChf: 75_000,
  expectedTcvChf: 75_000,
  stageChangedAt: new Date().toISOString(),
};

describe("computeRevenuePosition", () => {
  it("a closed_won opportunity with NO signed contract contributes zero real bookings — never guesses from expected values", () => {
    const result = computeRevenuePosition([BASE_OPP], [], [], [], [], new Set());
    expect(result.bookedChf).toBe(0);
    expect(result.arrChf).toBe(0);
  });

  it("sums bookings/ARR/TCV only from signed or active contracts", () => {
    const result = computeRevenuePosition(
      [BASE_OPP],
      [
        { opportunityId: "opp-1", contractStatus: "signed", computedBookingsChf: 75_000, computedArrChf: 75_000, computedTcvChf: 225_000, currency: "CHF" },
        { opportunityId: "opp-2", contractStatus: "draft", computedBookingsChf: 1_000_000, computedArrChf: 1_000_000, computedTcvChf: 1_000_000, currency: "CHF" },
      ],
      [],
      [],
      [],
      new Set(),
    );
    expect(result.bookedChf).toBe(75_000);
    expect(result.arrChf).toBe(75_000);
    expect(result.tcvChf).toBe(225_000);
  });

  it("excludes a non-CHF contract with no CHF equivalent and reports the exclusion count, never fabricating an FX figure", () => {
    const result = computeRevenuePosition(
      [],
      [{ opportunityId: "opp-1", contractStatus: "signed", computedBookingsChf: null, computedArrChf: null, computedTcvChf: null, currency: "EUR" }],
      [],
      [],
      [],
      new Set(),
    );
    expect(result.bookedChf).toBe(0);
    expect(result.excludedNonChfContractCount).toBe(1);
  });

  it("counts cash collected only in CHF invoices", () => {
    const result = computeRevenuePosition(
      [],
      [],
      [
        { currency: "CHF", paidAmount: 10_000 },
        { currency: "EUR", paidAmount: 5_000 },
      ],
      [],
      [],
      new Set(),
    );
    expect(result.cashCollectedChf).toBe(10_000);
  });

  it("flags capacity at limit once active sprints reach MAX_CONCURRENT_DECISION_SPRINTS", () => {
    const result = computeRevenuePosition([], [], [], [{ status: "active" }, { status: "evidence_gathering" }], [], new Set());
    expect(result.capacity.atCapacity).toBe(true);
    expect(result.sprintsActive).toBe(2);
  });

  it("sorts top open opportunities by deal value, descending", () => {
    const small = { ...BASE_OPP, id: "small", stage: "qualified" as const, expectedTcvChf: 10_000 };
    const big = { ...BASE_OPP, id: "big", stage: "qualified" as const, expectedTcvChf: 500_000 };
    const result = computeRevenuePosition([small, big], [], [], [], [], new Set());
    expect(result.topOpenOpportunities[0].id).toBe("big");
  });

  it("flags hygiene issues only for open opportunities, never closed ones", () => {
    const openWithIssues = { ...BASE_OPP, id: "open-1", stage: "discovery" as const, nextAction: null, primaryContactId: null };
    const result = computeRevenuePosition([openWithIssues, BASE_OPP], [], [], [], [], new Set());
    expect(result.opportunitiesWithHygieneIssues).toHaveLength(1);
    expect(result.opportunitiesWithHygieneIssues[0].opportunity.id).toBe("open-1");
  });
});
