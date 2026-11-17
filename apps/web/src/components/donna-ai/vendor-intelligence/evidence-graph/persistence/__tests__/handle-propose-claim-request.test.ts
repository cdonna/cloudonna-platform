import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleProposeClaimRequest } from "../handle-propose-claim-request";
import { fakeSupabaseRouter } from "../../../../research/persistence/__tests__/test-helpers";

const VALID_BODY = {
  productSlug: "databricks",
  capabilityKey: "lakehouse" as const,
  claim: "Supports Delta Lake open table format.",
  scope: "global" as const,
  source: {
    url: "https://docs.databricks.com/lakehouse/delta.html",
    title: "Delta Lake overview",
    publisher: "docs.databricks.com",
    sourceCategory: "official_product_documentation" as const,
    publishedAt: "2026-06-01",
    excerpt: "Databricks supports Delta Lake as its open table format.",
  },
};

function existingClaimRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "claim-existing",
    vendor_slug: "Databricks",
    product_slug: "databricks",
    capability_key: "lakehouse",
    claim: "Already known fact about lakehouse support.",
    verification_status: "verified",
    lifecycle_status: "active",
    evidence_quality: "high",
    valid_from: null,
    valid_to: null,
    last_verified_at: null,
    version: 1,
    superseded_by: null,
    scope: "global",
    organization_id: null,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("handleProposeClaimRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabaseRouter({}) as unknown as SupabaseClient;
    const result = await handleProposeClaimRequest(VALID_BODY, supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects an unknown product slug", async () => {
    const supabase = fakeSupabaseRouter({}) as unknown as SupabaseClient;
    const result = await handleProposeClaimRequest({ ...VALID_BODY, productSlug: "not-a-real-product" }, supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("rejects a malformed body (invalid capability key)", async () => {
    const supabase = fakeSupabaseRouter({}) as unknown as SupabaseClient;
    const result = await handleProposeClaimRequest({ ...VALID_BODY, capabilityKey: "not-a-real-capability" }, supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("recognizes a genuine duplicate and returns the existing claim instead of inserting a new one", async () => {
    const supabase = fakeSupabaseRouter({
      vendor_capability_claims: { data: [existingClaimRow({ claim: "Supports Delta Lake open table format." })], error: null },
    }) as unknown as SupabaseClient;

    const result = await handleProposeClaimRequest(VALID_BODY, supabase, "user-1");
    expect(result.status).toBe(200);
    const body = result.body as { duplicateOf: string | null };
    expect(body.duplicateOf).toBe("claim-existing");
  });

  it("new GLOBAL-scope claims start PROPOSED, never auto-published as active", async () => {
    const supabase = fakeSupabaseRouter({
      // First call: the active-claims list read (empty — no existing
      // claims to conflict/duplicate against). Second call: the insert,
      // returning the new row.
      vendor_capability_claims: [
        { data: [], error: null },
        { data: { id: "new-claim", lifecycle_status: "proposed" }, error: null },
      ],
      // First call: lookup by canonical_url (no existing source).
      // Second call: the insert, returning the new source's id.
      evidence_sources: [
        { data: null, error: null },
        { data: { id: "new-source" }, error: null },
      ],
      vendor_capability_evidence: { data: null, error: null },
    }) as unknown as SupabaseClient;

    const result = await handleProposeClaimRequest(VALID_BODY, supabase, "user-1");
    expect(result.status).toBe(200);
    const body = result.body as { lifecycleStatus: string; duplicateOf: string | null };
    expect(body.lifecycleStatus).toBe("proposed");
    expect(body.duplicateOf).toBeNull();
  });

  it("requires an organization for an organization_private claim", async () => {
    const supabase = fakeSupabaseRouter({ organization_members: { data: null, error: null } }) as unknown as SupabaseClient;
    const result = await handleProposeClaimRequest({ ...VALID_BODY, scope: "organization_private" as const }, supabase, "user-1");
    expect(result.status).toBe(400);
  });
});
