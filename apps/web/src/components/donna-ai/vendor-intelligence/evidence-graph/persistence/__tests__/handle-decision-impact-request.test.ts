import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDecisionOutput } from "../../../../engine";
import { buildEngineResult } from "../../../../engine/recommendation";
import { SAMPLE_PROFILE } from "../../../../data";
import { handleDecisionImpactRequest } from "../handle-decision-impact-request";
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
    vendor_slug: "Databricks",
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

function impactRow() {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    decision_id: "11111111-1111-1111-1111-111111111111",
    change_id: "44444444-4444-4444-4444-444444444444",
    affected_option: winnerId,
    affected_criterion: "architecture",
    materiality: "high",
    recommendation_impact: "This change affects the current winner on a high-weight criterion.",
    review_recommended: true,
    created_at: "2026-11-17T00:00:00.000Z",
  };
}

function supabaseFor() {
  return fakeSupabaseRouter({
    decisions: { data: decisionRow(), error: null },
    vendor_capability_claims: { data: claimRow(), error: null },
    decision_impacts: { data: impactRow(), error: null },
  });
}

const VALID_BODY = {
  changeId: "44444444-4444-4444-4444-444444444444",
  claimId: "22222222-2222-2222-2222-222222222222",
  changeType: "capability_changed" as const,
};

describe("handleDecisionImpactRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const result = await handleDecisionImpactRequest("11111111-1111-1111-1111-111111111111", VALID_BODY, supabaseFor() as unknown as SupabaseClient, null);
    expect(result.status).toBe(401);
  });

  it("rejects a malformed body", async () => {
    const result = await handleDecisionImpactRequest("11111111-1111-1111-1111-111111111111", { changeId: "not-a-uuid" }, supabaseFor() as unknown as SupabaseClient, "user-1");
    expect(result.status).toBe(400);
  });

  it("returns 404 when the decision is not found or not accessible", async () => {
    const supabase = fakeSupabaseRouter({ decisions: { data: null, error: null } }) as unknown as SupabaseClient;
    const result = await handleDecisionImpactRequest("11111111-1111-1111-1111-111111111111", VALID_BODY, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("returns 404 when the claim is not found or not accessible", async () => {
    const supabase = fakeSupabaseRouter({ decisions: { data: decisionRow(), error: null }, vendor_capability_claims: { data: null, error: null } }) as unknown as SupabaseClient;
    const result = await handleDecisionImpactRequest("11111111-1111-1111-1111-111111111111", VALID_BODY, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("computes and persists a real materiality result for a known decision and claim", async () => {
    const result = await handleDecisionImpactRequest("11111111-1111-1111-1111-111111111111", VALID_BODY, supabaseFor() as unknown as SupabaseClient, "user-1");
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const body = result.body as { affectedOption: string; materiality: string };
    expect(body.affectedOption).toBe(winnerId);
    expect(["low", "medium", "high"]).toContain(body.materiality);
  });
});
