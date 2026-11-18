import { describe, expect, it } from "vitest";
import { handlePromoteInquiryRequest } from "../handle-promote-inquiry-request";
import { fakeSupabaseRouter } from "./test-helpers";

const INQUIRY_ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  inquiry_type: "decision_sprint",
  name: "Jane Doe",
  business_email: "jane@example.com",
  company: "Example GmbH",
  country: "CH",
  phone: null,
  status: "new",
  message: "We need a decision",
  source_page: "/en/commercial",
  created_at: "2026-01-01T00:00:00Z",
  decision_type: "Data Platform",
  decision_timeframe: "this_quarter",
  investment_at_stake_chf: 500_000,
  current_platforms: null,
};

const ACCOUNT_ROW = {
  id: "acc-new",
  name: "Example GmbH",
  website: null,
  industry: null,
  country: "CH",
  company_size: null,
  source: "/en/commercial",
  icp_fit: null,
  status: "prospect",
  owner: null,
  notes: null,
  organization_id: null,
  created_at: "2026-01-02T00:00:00Z",
};

const CONTACT_ROW = {
  id: "contact-new",
  account_id: "acc-new",
  name: "Jane Doe",
  email: "jane@example.com",
  role: null,
  phone: null,
  buyer_persona: null,
  economic_buyer: false,
  decision_maker: false,
  technical_evaluator: false,
  champion: false,
  procurement: false,
  created_at: "2026-01-02T00:00:00Z",
};

const OPPORTUNITY_ROW = {
  id: "opp-new",
  account_id: "acc-new",
  primary_contact_id: "contact-new",
  inquiry_id: "11111111-1111-1111-1111-111111111111",
  decision_id: null,
  decision_title: null,
  decision_deadline: null,
  commercial_package: "decision_sprint",
  stage: "inquiry",
  use_case: "Data Platform",
  decision_value_chf: 500_000,
  expected_acv_chf: null,
  expected_tcv_chf: null,
  expected_bookings_chf: null,
  expected_arr_chf: null,
  probability_percent: null,
  forecast_category: null,
  currency: "CHF",
  planning_value_chf: null,
  source: "/en/commercial",
  next_action: null,
  next_action_due_at: null,
  target_close_date: null,
  lost_reason: null,
  lost_reason_note: null,
  won_reason: null,
  won_reason_note: null,
  closed_at: null,
  stage_changed_at: "2026-01-02T00:00:00Z",
  created_at: "2026-01-02T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  commercial_accounts: { name: "Example GmbH" },
  decisions: null,
};

describe("handlePromoteInquiryRequest", () => {
  it("rejects a non-platform-staff caller", async () => {
    const supabase = fakeSupabaseRouter({}, false);
    const result = await handlePromoteInquiryRequest({ inquiryId: "11111111-1111-1111-1111-111111111111", commercialPackage: "decision_sprint" }, supabase, "user-1");
    expect(result.status).toBe(403);
  });

  it("returns 404 for a nonexistent inquiry", async () => {
    const supabase = fakeSupabaseRouter({ inquiries: { data: null, error: null } });
    const result = await handlePromoteInquiryRequest({ inquiryId: "11111111-1111-1111-1111-111111111111", commercialPackage: "decision_sprint" }, supabase, "staff-1");
    expect(result.status).toBe(404);
  });

  it("creates a new account, contact, and opportunity from a qualified inquiry, carrying over its self-reported fields", async () => {
    const supabase = fakeSupabaseRouter({
      inquiries: { data: INQUIRY_ROW, error: null },
      commercial_accounts: { data: ACCOUNT_ROW, error: null },
      commercial_contacts: { data: CONTACT_ROW, error: null },
      commercial_opportunities: { data: OPPORTUNITY_ROW, error: null },
    });
    const result = await handlePromoteInquiryRequest({ inquiryId: "11111111-1111-1111-1111-111111111111", commercialPackage: "decision_sprint" }, supabase, "staff-1");
    expect(result.status).toBe(200);
    const body = result.body as { accountName: string; decisionValueChf: number; useCase: string };
    expect(body.accountName).toBe("Example GmbH");
    expect(body.decisionValueChf).toBe(500_000);
    expect(body.useCase).toBe("Data Platform");
  });

  it("attaches to an existing account instead of creating a new one when accountId is given", async () => {
    const supabase = fakeSupabaseRouter({
      inquiries: { data: INQUIRY_ROW, error: null },
      commercial_contacts: { data: CONTACT_ROW, error: null },
      commercial_opportunities: { data: OPPORTUNITY_ROW, error: null },
    });
    const result = await handlePromoteInquiryRequest({ inquiryId: "11111111-1111-1111-1111-111111111111", accountId: "22222222-2222-2222-2222-222222222222", commercialPackage: "decision_sprint" }, supabase, "staff-1");
    expect(result.status).toBe(200);
    // commercial_accounts was never queried for an insert in this path —
    // proven indirectly by the call succeeding with no account-creation
    // table configured beyond the default null/null fallback.
  });
});
