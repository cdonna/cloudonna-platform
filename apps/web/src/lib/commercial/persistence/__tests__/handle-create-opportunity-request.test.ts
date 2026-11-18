import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCreateOpportunityRequest } from "../handle-create-opportunity-request";

function fakeSupabase(opts: { isStaff: boolean; insertResult?: { data: unknown; error: { message: string } | null } }) {
  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(opts.insertResult ?? { data: null, error: null })),
  };
  return {
    rpc: vi.fn(() => Promise.resolve({ data: opts.isStaff, error: null })),
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient;
}

const VALID_BODY = { accountId: "11111111-1111-1111-1111-111111111111", commercialPackage: "decision_sprint" as const };

describe("handleCreateOpportunityRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabase({ isStaff: false });
    const result = await handleCreateOpportunityRequest(VALID_BODY, supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects a non-platform-staff caller explicitly", async () => {
    const supabase = fakeSupabase({ isStaff: false });
    const result = await handleCreateOpportunityRequest(VALID_BODY, supabase, "user-1");
    expect(result.status).toBe(403);
  });

  it("rejects a malformed body", async () => {
    const supabase = fakeSupabase({ isStaff: true });
    const result = await handleCreateOpportunityRequest({ accountId: "not-a-uuid" }, supabase, "staff-1");
    expect(result.status).toBe(400);
  });

  it("creates a real opportunity for a known account and package", async () => {
    const supabase = fakeSupabase({
      isStaff: true,
      insertResult: {
        data: {
          id: "opp-1",
          account_id: VALID_BODY.accountId,
          primary_contact_id: null,
          inquiry_id: null,
          decision_id: null,
          commercial_package: "decision_sprint",
          stage: "inquiry",
          use_case: null,
          decision_value_chf: null,
          expected_acv_chf: null,
          expected_tcv_chf: null,
          probability_percent: null,
          source: null,
          next_action: null,
          next_action_due_at: null,
          target_close_date: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          commercial_accounts: { name: "Acme Corp" },
          decisions: null,
        },
        error: null,
      },
    });
    const result = await handleCreateOpportunityRequest(VALID_BODY, supabase, "staff-1");
    expect(result.status).toBe(200);
    const body = result.body as { accountName: string; commercialPackage: string };
    expect(body.accountName).toBe("Acme Corp");
    expect(body.commercialPackage).toBe("decision_sprint");
  });
});
