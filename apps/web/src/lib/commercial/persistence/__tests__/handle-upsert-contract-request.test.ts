import { describe, expect, it } from "vitest";
import { handleUpsertContractRequest } from "../handle-upsert-contract-request";
import { fakeSupabaseRouter } from "./test-helpers";

const OPPORTUNITY_ROW = {
  id: "opp-1",
  account_id: "acc-1",
  primary_contact_id: null,
  inquiry_id: null,
  decision_id: null,
  decision_title: null,
  decision_deadline: null,
  commercial_package: "team",
  stage: "sprint_proposed",
  use_case: null,
  decision_value_chf: null,
  expected_acv_chf: null,
  expected_tcv_chf: null,
  expected_bookings_chf: null,
  expected_arr_chf: null,
  probability_percent: null,
  forecast_category: null,
  currency: "CHF",
  planning_value_chf: null,
  source: null,
  next_action: null,
  next_action_due_at: null,
  target_close_date: null,
  lost_reason: null,
  lost_reason_note: null,
  won_reason: null,
  won_reason_note: null,
  closed_at: null,
  stage_changed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  commercial_accounts: { name: "Acme Corp" },
  decisions: null,
};

const CONTRACT_ROW = {
  id: "contract-1",
  opportunity_id: "opp-1",
  contract_start: null,
  contract_end: null,
  term_months: 12,
  billing_frequency: "annual",
  one_time_fee: 0,
  services_fee: 0,
  recurring_annual_fee: 75_000,
  discount_percent: 0,
  currency: "CHF",
  auto_renewal: false,
  payment_terms: null,
  contract_status: "signed",
  computed_bookings_chf: 75_000,
  computed_arr_chf: 75_000,
  computed_tcv_chf: 75_000,
  signed_at: "2026-01-05T00:00:00Z",
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
};

describe("handleUpsertContractRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabaseRouter({});
    const result = await handleUpsertContractRequest("opp-1", { recurringAnnualFee: 75_000 }, supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects a non-platform-staff caller", async () => {
    const supabase = fakeSupabaseRouter({}, false);
    const result = await handleUpsertContractRequest("opp-1", { recurringAnnualFee: 75_000 }, supabase, "user-1");
    expect(result.status).toBe(403);
  });

  it("returns 404 when the opportunity does not exist", async () => {
    const supabase = fakeSupabaseRouter({ commercial_opportunities: { data: null, error: null } });
    const result = await handleUpsertContractRequest("opp-missing", { recurringAnnualFee: 75_000 }, supabase, "staff-1");
    expect(result.status).toBe(404);
  });

  it("creates a new contract and computes its economics", async () => {
    const supabase = fakeSupabaseRouter({
      commercial_opportunities: { data: OPPORTUNITY_ROW, error: null },
      commercial_contracts: [{ data: null, error: null }, { data: CONTRACT_ROW, error: null }],
    });
    const result = await handleUpsertContractRequest("opp-1", { recurringAnnualFee: 75_000, termMonths: 12, contractStatus: "signed" }, supabase, "staff-1");
    expect(result.status).toBe(200);
    const body = result.body as { computedArrChf: number; computedTcvChf: number };
    expect(body.computedArrChf).toBe(75_000);
    expect(body.computedTcvChf).toBe(75_000);
  });
});
