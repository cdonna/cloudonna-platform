import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleUpsertDecisionOutcomeRequest } from "../handle-upsert-decision-outcome-request";

function fakeSupabase(opts: { decision: { data: unknown; error: unknown } | null; upsertResult?: { data: unknown; error: unknown } }) {
  return {
    from: vi.fn((table: string) => {
      if (table === "decisions") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          maybeSingle: vi.fn(() => Promise.resolve(opts.decision ?? { data: null, error: null })),
        };
        return chain;
      }
      const chain = {
        upsert: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve(opts.upsertResult ?? { data: null, error: null })),
      };
      return chain;
    }),
  } as unknown as SupabaseClient;
}

const DECISION_ID = "11111111-1111-1111-1111-111111111111";

describe("handleUpsertDecisionOutcomeRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabase({ decision: null });
    const result = await handleUpsertDecisionOutcomeRequest(DECISION_ID, {}, supabase, null);
    expect(result.status).toBe(401);
  });

  it("returns 404 for a decision the caller cannot see (RLS returns nothing, not an error)", async () => {
    const supabase = fakeSupabase({ decision: { data: null, error: null } });
    const result = await handleUpsertDecisionOutcomeRequest(DECISION_ID, { finalDecision: "Chose vendor A" }, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("writes the outcome using the decision's OWN organization_id, not any organization the caller might separately belong to", async () => {
    const supabase = fakeSupabase({
      decision: { data: { organization_id: "org-1" }, error: null },
      upsertResult: {
        data: {
          id: "outcome-1",
          decision_id: DECISION_ID,
          recommendation: null,
          final_decision: "Chose vendor A",
          implementation_started: false,
          realized_outcome_known: false,
          business_case_variance_percent: null,
          customer_feedback: null,
          updated_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      },
    });
    const result = await handleUpsertDecisionOutcomeRequest(DECISION_ID, { finalDecision: "Chose vendor A" }, supabase, "user-1");
    expect(result.status).toBe(200);
    const body = result.body as { finalDecision: string };
    expect(body.finalDecision).toBe("Chose vendor A");
  });
});
