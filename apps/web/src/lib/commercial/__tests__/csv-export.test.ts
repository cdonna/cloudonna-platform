import { describe, expect, it } from "vitest";
import { buildOpportunitiesCsv } from "../csv-export";
import type { CommercialOpportunitySummary } from "../repository";

const OPP: CommercialOpportunitySummary = {
  id: "opp-1",
  accountId: "acc-1",
  accountName: "Acme, Inc.",
  primaryContactId: null,
  inquiryId: null,
  decisionId: null,
  decisionTitle: null,
  decisionDeadline: null,
  linkedDecisionTitle: null,
  commercialPackage: "team",
  stage: "qualified",
  useCase: null,
  decisionValueChf: null,
  expectedAcvChf: null,
  expectedTcvChf: 75_000,
  expectedBookingsChf: 75_000,
  expectedArrChf: 75_000,
  probabilityPercent: null,
  forecastCategory: null,
  currency: "CHF",
  planningValueChf: null,
  source: null,
  nextAction: "Send proposal",
  nextActionDueAt: "2026-02-01",
  targetCloseDate: "2026-02-15",
  lostReason: null,
  lostReasonNote: null,
  wonReason: null,
  wonReasonNote: null,
  closedAt: null,
  stageChangedAt: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("buildOpportunitiesCsv", () => {
  it("produces a header row plus one row per opportunity", () => {
    const csv = buildOpportunitiesCsv([OPP]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Account");
  });

  it("escapes a comma inside a field rather than corrupting the CSV", () => {
    const csv = buildOpportunitiesCsv([OPP]);
    expect(csv).toContain('"Acme, Inc."');
  });
});
