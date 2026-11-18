import { describe, expect, it, type Mock } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDecisionOutput } from "../../../../engine";
import { buildEngineResult } from "../../../../engine/recommendation";
import { SAMPLE_PROFILE } from "../../../../data";
import { handleDecisionVendorKnowledgeRequest } from "../handle-decision-vendor-knowledge-request";
import { fakeSupabaseRouter } from "../../../../research/persistence/__tests__/test-helpers";

const output = buildDecisionOutput(SAMPLE_PROFILE);
const engineResult = buildEngineResult(SAMPLE_PROFILE, output);
const winnerId = engineResult.recommendedOption.id;

function decisionRow() {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organization_id: "org-1",
    human_readable_id: "CDD-2026-000001",
    title: "Test decision",
    status: "saved",
    created_at: "2026-01-01T00:00:00.000Z",
    decision_versions: {
      version_number: 1,
      decision_input_json: { wizardState: SAMPLE_PROFILE },
      deterministic_output_json: { ...output, engineResult },
      validated_enrichment_json: null,
      provider_metadata_json: { providerId: "deterministic-v2", model: null },
      fallback_metadata_json: { status: "ok", reason: null },
      evidence_references_json: [],
      schema_version: "decision-report/1",
      scoring_engine_version: "donna-score-v2",
      knowledge_base_version: "vendor-catalog-v1",
      generated_at: "2026-01-01T00:00:00.000Z",
      created_by: "user-1",
      created_at: "2026-01-01T00:00:00.000Z",
      change_reason: null,
      human_override_json: null,
    },
  };
}

function claimRow() {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    vendor_slug: "Vendor",
    product_slug: winnerId,
    capability_key: "architecture",
    claim: "Supports open table formats.",
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
  };
}

function supabaseFor() {
  return fakeSupabaseRouter({
    decisions: { data: decisionRow(), error: null },
    organization_members: { data: null, error: null },
    vendor_capability_claims: { data: [claimRow()], error: null },
    vendor_capability_evidence: { data: [], error: null },
    decision_vendor_claim_refs: { data: [], error: null },
  });
}

describe("handleDecisionVendorKnowledgeRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const result = await handleDecisionVendorKnowledgeRequest("11111111-1111-1111-1111-111111111111", winnerId, supabaseFor() as unknown as SupabaseClient, null);
    expect(result.status).toBe(401);
  });

  it("returns 404 when the decision is not found or not accessible", async () => {
    const supabase = fakeSupabaseRouter({ decisions: { data: null, error: null } }) as unknown as SupabaseClient;
    const result = await handleDecisionVendorKnowledgeRequest("11111111-1111-1111-1111-111111111111", winnerId, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("returns the product's vendor knowledge and records a decision-time snapshot reference", async () => {
    const supabase = supabaseFor() as unknown as SupabaseClient;
    const result = await handleDecisionVendorKnowledgeRequest("11111111-1111-1111-1111-111111111111", winnerId, supabase, "user-1");
    expect(result.status).toBe(200);
    const body = result.body as { productSlug: string; claims: unknown[] };
    expect(body.productSlug).toBe(winnerId);
    expect(body.claims).toHaveLength(1);
    // The decision-time snapshot write actually happened — not just a
    // table lookup that happens to return an empty result.
    const fromCalls = (supabase.from as unknown as Mock).mock.calls.map((call: unknown[]) => call[0]);
    expect(fromCalls).toContain("decision_vendor_claim_refs");
  });
});
