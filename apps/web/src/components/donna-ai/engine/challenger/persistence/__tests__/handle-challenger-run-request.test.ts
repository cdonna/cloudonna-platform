import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDecisionOutput } from "../../../../engine";
import { SAMPLE_PROFILE } from "../../../../data";
import { handleChallengerRunRequest } from "../handle-challenger-run-request";
import { fakeSupabaseRouter } from "../../../../research/persistence/__tests__/test-helpers";

const output = buildDecisionOutput(SAMPLE_PROFILE);

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
      deterministic_output_json: output,
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

function supabaseFor() {
  return fakeSupabaseRouter({ decisions: { data: decisionRow(), error: null }, profiles: { data: { email: "founder@example.com" }, error: null } });
}

describe("handleChallengerRunRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const result = await handleChallengerRunRequest({ decisionId: "11111111-1111-1111-1111-111111111111" }, supabaseFor() as unknown as SupabaseClient, null);
    expect(result.status).toBe(401);
  });

  it("rejects a malformed body", async () => {
    const result = await handleChallengerRunRequest({ decisionId: "not-a-uuid" }, supabaseFor() as unknown as SupabaseClient, "user-1");
    expect(result.status).toBe(400);
  });

  it("returns 404 when the decision is not found or not accessible", async () => {
    const supabase = fakeSupabaseRouter({ decisions: { data: null, error: null } }) as unknown as SupabaseClient;
    const result = await handleChallengerRunRequest({ decisionId: "11111111-1111-1111-1111-111111111111" }, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("returns real deterministic challenges for a known decision, even with no AI provider configured", async () => {
    const result = await handleChallengerRunRequest({ decisionId: "11111111-1111-1111-1111-111111111111" }, supabaseFor() as unknown as SupabaseClient, "user-1");
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const body = result.body as { challenges: unknown[]; aiStatus: string };
    expect(Array.isArray(body.challenges)).toBe(true);
    expect(body.aiStatus).toBe("disabled"); // no OPENAI_API_KEY in the test environment
  });
});
