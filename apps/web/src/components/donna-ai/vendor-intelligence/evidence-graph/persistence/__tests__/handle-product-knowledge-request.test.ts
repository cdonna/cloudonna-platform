import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleProductKnowledgeRequest } from "../handle-product-knowledge-request";
import { fakeSupabaseRouter } from "../../../../research/persistence/__tests__/test-helpers";

function claimRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    vendor_slug: "Databricks",
    product_slug: "databricks",
    capability_key: "lakehouse",
    claim: "Supports Delta Lake open table format.",
    verification_status: "verified",
    lifecycle_status: "active",
    evidence_quality: "high",
    valid_from: null,
    valid_to: null,
    last_verified_at: "2026-10-01T00:00:00.000Z",
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

describe("handleProductKnowledgeRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabaseRouter({}) as unknown as SupabaseClient;
    const result = await handleProductKnowledgeRequest("databricks", supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects an unknown product slug without querying the database", async () => {
    const supabase = fakeSupabaseRouter({}) as unknown as SupabaseClient;
    const result = await handleProductKnowledgeRequest("not-a-real-product", supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("returns real claims with computed coverage for a known product", async () => {
    const supabase = fakeSupabaseRouter({
      organization_members: { data: null, error: null },
      vendor_capability_claims: { data: [claimRow()], error: null },
      vendor_capability_evidence: {
        data: [{ claim_id: "22222222-2222-2222-2222-222222222222", polarity: "supports", evidence_sources: { source_category: "official_product_documentation", published_at: "2026-10-01" } }],
        error: null,
      },
    }) as unknown as SupabaseClient;

    const result = await handleProductKnowledgeRequest("databricks", supabase, "user-1");
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const body = result.body as { productSlug: string; claims: unknown[]; coverage: { capabilityCoverage: { total: number } } };
    expect(body.productSlug).toBe("databricks");
    expect(body.claims).toHaveLength(1);
    expect(body.coverage.capabilityCoverage.total).toBe(28);
  });

  it("returns an empty, honest claim list rather than an error when a product has no claims yet", async () => {
    const supabase = fakeSupabaseRouter({
      organization_members: { data: null, error: null },
      vendor_capability_claims: { data: [], error: null },
    }) as unknown as SupabaseClient;

    const result = await handleProductKnowledgeRequest("databricks", supabase, "user-1");
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const body = result.body as { claims: unknown[] };
    expect(body.claims).toEqual([]);
  });
});
