import "server-only";

/**
 * The framework-independent handler behind
 * app/api/decisions/[id]/versions/route.ts (Sprint 6.2, Slice C) — same
 * pattern as handle-save-decision-request.ts, testable with plain
 * objects, the route file stays a thin, obviously-correct adapter.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { KNOWLEDGE_BASE_VERSION, SCHEMA_VERSION, SCORING_ENGINE_VERSION } from "../engine/engine-version";
import { applyScenarioToOutput } from "../engine/apply-scenario";
import { buildDecisionOutput } from "../engine";
import { appendDecisionVersionRequestSchema } from "./append-decision-version-schema";
import { appendDecisionVersion } from "./decisions-repository";

export interface AppendDecisionVersionHandlerResult {
  status: number;
  body: { id: string; versionNumber: number } | { error: string };
}

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
  //
  // Decision Engine V1.1 (brief §9/§28): scenarioOverrides is a bounded
  // set of weight numbers (validated by the schema, clamped again
  // inside the scenario engine itself) — never a client-supplied
  // output. The actual persisted output is still 100% derived here,
  // from the real wizard state, through the real scoring engine, then
  // re-weighted by applyScenarioToOutput using only those numbers.
  let deterministicOutput;
  try {
    const wizardState = request.decisionInput.wizardState as never;
    const baseOutput = buildDecisionOutput(wizardState);
    const overrides = request.decisionInput.scenarioOverrides;
    deterministicOutput = overrides ? applyScenarioToOutput(wizardState, baseOutput, overrides) : baseOutput;
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
