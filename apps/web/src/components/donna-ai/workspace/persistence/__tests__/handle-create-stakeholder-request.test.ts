import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCreateStakeholderRequest } from "../handle-create-stakeholder-request";

const DECISION_ID = "11111111-1111-1111-1111-111111111111";

function fakeSupabase(opts: { decision: { data: unknown; error: unknown } | null; insertResult?: { data: unknown; error: unknown } }) {
  return {
    from: vi.fn((table: string) => {
      if (table === "decisions") {
        const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(() => Promise.resolve(opts.decision ?? { data: null, error: null })) };
        return chain;
      }
      const chain = { insert: vi.fn(() => chain), select: vi.fn(() => chain), single: vi.fn(() => Promise.resolve(opts.insertResult ?? { data: null, error: null })) };
      return chain;
    }),
  } as unknown as SupabaseClient;
}

describe("handleCreateStakeholderRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabase({ decision: null });
    const result = await handleCreateStakeholderRequest(DECISION_ID, { name: "Jane Doe" }, supabase, null);
    expect(result.status).toBe(401);
  });

  it("returns 404 for a decision the caller cannot see", async () => {
    const supabase = fakeSupabase({ decision: { data: null, error: null } });
    const result = await handleCreateStakeholderRequest(DECISION_ID, { name: "Jane Doe" }, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("rejects a blank name", async () => {
    const supabase = fakeSupabase({ decision: { data: { organization_id: "org-1" }, error: null } });
    const result = await handleCreateStakeholderRequest(DECISION_ID, { name: "" }, supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("creates a stakeholder defaulting to not_reviewed alignment", async () => {
    const supabase = fakeSupabase({
      decision: { data: { organization_id: "org-1" }, error: null },
      insertResult: {
        data: { id: "s1", decision_id: DECISION_ID, name: "Jane Doe", role: "Economic Buyer", email: null, alignment_status: "not_reviewed", notes: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
        error: null,
      },
    });
    const result = await handleCreateStakeholderRequest(DECISION_ID, { name: "Jane Doe", role: "Economic Buyer" }, supabase, "user-1");
    expect(result.status).toBe(200);
    const body = result.body as { alignmentStatus: string; name: string };
    expect(body.alignmentStatus).toBe("not_reviewed");
    expect(body.name).toBe("Jane Doe");
  });
});
