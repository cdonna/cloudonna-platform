import "server-only";

/**
 * The framework-independent handler behind
 * app/api/decisions/[id]/versions/route.ts (Sprint 6.2, Slice C) — same
 * pattern as handle-save-decision-request.ts, testable with plain
 * objects, the route file stays a thin, obviously-correct adapter.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDecisionOutput } from "../engine";
import { appendDecisionVersionRequestSchema } from "./append-decision-version-schema";
import { appendDecisionVersion } from "./decisions-repository";

export interface AppendDecisionVersionHandlerResult {
  status: number;
  body: { id: string; versionNumber: number } | { error: string };
}

/** Duplicated from handle-save-decision-request.ts's own copy of these
 * constants, deliberately — see append-decision-version-schema.ts's
 * file-level comment for why this slice keeps its files self-contained
 * rather than touching the existing save-path files. Both copies must
 * be bumped together whenever the underlying layer changes in a
 * scoring-relevant way; a future consolidation (a single shared
 * provenance-versions module) is a reasonable follow-up, not done here
 * to keep this slice's diff isolated. */
const SCHEMA_VERSION = "decision-report/1";
const SCORING_ENGINE_VERSION = "donna-score-v2";
const KNOWLEDGE_BASE_VERSION = "vendor-catalog-v1";

export async function handleAppendDecisionVersionRequest(
  decisionId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<AppendDecisionVersionHandlerResult> {
  // Authentication checked first, before any parsing — identical
  // discipline to handle-save-decision-request.ts's own first line.
  if (!userId) {
    return { status: 401, body: { error: "Sign in to save a new version." } };
  }

  const parsed = appendDecisionVersionRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "The request could not be processed." } };
  }
  const request = parsed.data;

  // The deterministic score is never trusted from the client — always
  // recomputed here, exactly as the original save path does. Re-running
  // an existing decision and appending the result as a new version
  // carries the identical tampering risk the original save boundary was
  // built to close, and gets the identical fix.
  let deterministicOutput;
  try {
    deterministicOutput = buildDecisionOutput(request.decisionInput.wizardState as never);
  } catch {
    return { status: 400, body: { error: "The request could not be processed." } };
  }

  const result = await appendDecisionVersion(supabase, decisionId, request, deterministicOutput, {
    schemaVersion: SCHEMA_VERSION,
    scoringEngineVersion: SCORING_ENGINE_VERSION,
    knowledgeBaseVersion: KNOWLEDGE_BASE_VERSION,
  });

  if (!result.ok) {
    return { status: 400, body: { error: result.reason } };
  }

  return { status: 200, body: { id: result.data.id, versionNumber: result.data.versionNumber } };
}
