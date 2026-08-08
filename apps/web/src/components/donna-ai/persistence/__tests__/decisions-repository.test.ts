import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appendDecisionVersion, getDecisionDetail, saveDecision } from "../decisions-repository";
import type { SaveDecisionRequest } from "../save-decision-schema";
import type { AppendDecisionVersionRequest } from "../append-decision-version-schema";
import type { DeterministicDecisionOutput } from "../../intelligence/types";

const SAMPLE_REQUEST: SaveDecisionRequest = {
  title: "Test decision",
  organizationId: "11111111-1111-1111-1111-111111111111",
  workspaceId: "22222222-2222-2222-2222-222222222222",
  projectId: "33333333-3333-3333-3333-333333333333",
  decisionInput: { wizardState: {} as never },
  enrichment: null,
  provider: { providerId: "deterministic-v1", model: null },
  fallback: { status: "ok", reason: null },
};

describe("saveDecision", () => {
  it("returns a safe, generic reason and never the raw Postgres message on RLS rejection", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'new row violates row-level security policy for table "decisions"' },
      }),
    } as unknown as SupabaseClient;

    const result = await saveDecision(supabase, SAMPLE_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("You do not have access to save decisions in this project.");
      expect(result.reason).not.toContain("row-level security policy for table");
    }
  });

  it("returns the saved id and human-readable id on success", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [{ out_id: "abc-123", out_human_readable_id: "CDD-2026-000042" }], error: null }),
    } as unknown as SupabaseClient;

    const result = await saveDecision(supabase, SAMPLE_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    expect(result).toEqual({ ok: true, data: { id: "abc-123", humanReadableId: "CDD-2026-000042" } });
  });

  it("passes an empty evidence-reference array through when enrichment is null (no AI narrative to cite)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_id: "id", out_human_readable_id: "CDD-2026-000004" }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await saveDecision(supabase, SAMPLE_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    const callArgs = rpc.mock.calls[0][1] as { p_evidence_references: unknown[] };
    expect(callArgs.p_evidence_references).toEqual([]);
  });
});

const SAMPLE_APPEND_REQUEST: AppendDecisionVersionRequest = {
  decisionInput: { wizardState: {} as never },
  enrichment: null,
  provider: { providerId: "deterministic-v1", model: null },
  fallback: { status: "ok", reason: null },
  changeReason: "Budget increased after Q3 planning",
};

describe("appendDecisionVersion", () => {
  it("returns a safe, generic reason and never the raw Postgres message on RLS rejection", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'new row violates row-level security policy for table "decision_versions"' },
      }),
    } as unknown as SupabaseClient;

    const result = await appendDecisionVersion(supabase, "decision-1", SAMPLE_APPEND_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).not.toContain("row-level security policy for table");
    }
  });

  it("returns a safe, generic reason for a decision that is missing or not accessible, never confirming or denying existence", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "Decision not found or not accessible." } }),
    } as unknown as SupabaseClient;

    const result = await appendDecisionVersion(supabase, "decision-1", SAMPLE_APPEND_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    expect(result).toEqual({ ok: false, reason: "The decision could not be saved." });
  });

  it("returns the new version's id and version number on success", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [{ out_version_id: "ver-2", out_version_number: 2 }], error: null }),
    } as unknown as SupabaseClient;

    const result = await appendDecisionVersion(supabase, "decision-1", SAMPLE_APPEND_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    expect(result).toEqual({ ok: true, data: { id: "ver-2", versionNumber: 2 } });
  });

  it("passes the decision id and change reason through to the RPC call", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_version_id: "ver-2", out_version_number: 2 }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await appendDecisionVersion(supabase, "decision-1", SAMPLE_APPEND_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    const callArgs = rpc.mock.calls[0][1] as { p_decision_id: string; p_change_reason: string };
    expect(callArgs.p_decision_id).toBe("decision-1");
    expect(callArgs.p_change_reason).toBe("Budget increased after Q3 planning");
  });

  it("passes an empty evidence-reference array through when enrichment is null", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_version_id: "ver-2", out_version_number: 2 }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await appendDecisionVersion(supabase, "decision-1", SAMPLE_APPEND_REQUEST, {} as DeterministicDecisionOutput, {
      schemaVersion: "decision-report/1",
      scoringEngineVersion: "donna-score-v2",
      knowledgeBaseVersion: "vendor-catalog-v1",
    });

    const callArgs = rpc.mock.calls[0][1] as { p_evidence_references: unknown[] };
    expect(callArgs.p_evidence_references).toEqual([]);
  });
});

describe("getDecisionDetail", () => {
  it("returns a generic 'not found' for both a truly missing decision and a cross-tenant one — RLS makes them indistinguishable, and so must this function", async () => {
    // PostgREST's real behavior for a decision hidden by RLS is
    // identical to a genuinely nonexistent one: zero rows, no error.
    // .maybeSingle() surfaces that as `data: null` either way.
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getDecisionDetail(supabase, "00000000-0000-0000-0000-000000000000");

    expect(result).toEqual({ ok: false, reason: "Decision not found." });
  });
});
