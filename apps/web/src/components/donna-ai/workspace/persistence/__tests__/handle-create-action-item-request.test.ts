import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCreateActionItemRequest } from "../handle-create-action-item-request";

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

describe("handleCreateActionItemRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabase({ decision: null });
    const result = await handleCreateActionItemRequest(DECISION_ID, { action: "Invite security review" }, supabase, null);
    expect(result.status).toBe(401);
  });

  it("returns 404 for a decision the caller cannot see", async () => {
    const supabase = fakeSupabase({ decision: { data: null, error: null } });
    const result = await handleCreateActionItemRequest(DECISION_ID, { action: "Invite security review" }, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("creates an action item defaulting to open status", async () => {
    const supabase = fakeSupabase({
      decision: { data: { organization_id: "org-1" }, error: null },
      insertResult: { data: { id: "a1", decision_id: DECISION_ID, action: "Invite security review", owner: "Security", target_date: null, status: "open", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }, error: null },
    });
    const result = await handleCreateActionItemRequest(DECISION_ID, { action: "Invite security review", owner: "Security" }, supabase, "user-1");
    expect(result.status).toBe(200);
    const body = result.body as { status: string; action: string };
    expect(body.status).toBe("open");
    expect(body.action).toBe("Invite security review");
  });
});
