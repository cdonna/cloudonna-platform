import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDecisionOutput } from "../../../engine";
import { SAMPLE_PROFILE } from "../../../data";
import { handleResearchRunRequest } from "../handle-research-run-request";
import { fakeSupabaseRouter } from "./test-helpers";

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
  return fakeSupabaseRouter({
    decisions: { data: decisionRow(), error: null },
    profiles: { data: { email: "founder@example.com" }, error: null },
    research_evidence: { data: [], error: null },
    research_conflicts: { data: [], error: null },
    research_sessions: { data: { id: "session-1" }, error: null },
  });
}

describe("handleResearchRunRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = supabaseFor() as unknown as SupabaseClient;
    const result = await handleResearchRunRequest({ decisionId: "11111111-1111-1111-1111-111111111111" }, supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects a malformed body", async () => {
    const supabase = supabaseFor() as unknown as SupabaseClient;
    const result = await handleResearchRunRequest({ decisionId: "not-a-uuid" }, supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("returns 404 when the decision is not found or not accessible (RLS)", async () => {
    const supabase = fakeSupabaseRouter({ decisions: { data: null, error: null } }) as unknown as SupabaseClient;
    const result = await handleResearchRunRequest({ decisionId: "11111111-1111-1111-1111-111111111111" }, supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("completes honestly as failed (never fabricating evidence) when no research provider is configured", async () => {
    // No OPENAI_API_KEY in the test environment means selectResearchProvider
    // returns the honest deterministicResearchProvider — this exercises the
    // real "AI unavailable" path end to end through the actual handler,
    // without mocking the OpenAI SDK a second time at this layer (already
    // covered directly in providers/__tests__/openai-research-provider.test.ts).
    const supabase = supabaseFor() as unknown as SupabaseClient;
    const result = await handleResearchRunRequest({ decisionId: "11111111-1111-1111-1111-111111111111", criterionId: "cost", optionId: output.recommendation.platform.id }, supabase, "user-1");
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const body = result.body as { status: string; evidenceProposed: number };
    expect(body.status).toBe("failed");
    expect(body.evidenceProposed).toBe(0);
  });
});
