import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleVendorRefreshRequest } from "../handle-vendor-refresh-request";
import { fakeSupabaseRouter } from "../../../../research/persistence/__tests__/test-helpers";

const VALID_BODY = { productSlug: "databricks", capabilityKey: "lakehouse" as const, question: "What does official documentation say about Delta Lake support?" };

describe("handleVendorRefreshRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabaseRouter({}) as unknown as SupabaseClient;
    const result = await handleVendorRefreshRequest(VALID_BODY, supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects a non-platform-staff caller explicitly, rather than silently returning an empty success", async () => {
    const supabase = { rpc: () => Promise.resolve({ data: false, error: null }) } as unknown as SupabaseClient;
    const result = await handleVendorRefreshRequest(VALID_BODY, supabase, "user-1");
    expect(result.status).toBe(403);
  });

  it("rejects an unknown product slug", async () => {
    const supabase = { rpc: () => Promise.resolve({ data: true, error: null }) } as unknown as SupabaseClient;
    const result = await handleVendorRefreshRequest({ ...VALID_BODY, productSlug: "not-a-real-product" }, supabase, "staff-1");
    expect(result.status).toBe(400);
  });

  it("reports an honest disabled status when no provider is configured, never a fabricated claim", async () => {
    const base = fakeSupabaseRouter({ vendor_capability_claims: { data: [], error: null } });
    const supabase = { ...base, rpc: () => Promise.resolve({ data: true, error: null }) } as unknown as SupabaseClient;
    const result = await handleVendorRefreshRequest(VALID_BODY, supabase, "staff-1");
    expect(result.status).toBe(200);
    const body = result.body as { status: string; proposedClaimIds: string[] };
    expect(body.status).toBe("retrieval_failed");
    expect(body.proposedClaimIds).toEqual([]);
  });
});
