import "server-only";

/**
 * The framework-independent handler behind app/api/decisions/route.ts —
 * same "no NextRequest/NextResponse dependency" pattern Sprint 5's
 * intelligence/handle-decision-request.ts already established, for the
 * same reason: testable with plain objects, and the route file stays a
 * thin, obviously-correct adapter.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { KNOWLEDGE_BASE_VERSION, SCHEMA_VERSION, SCORING_ENGINE_VERSION } from "../engine/engine-version";
import { applyScenarioToOutput } from "../engine/apply-scenario";
import { attachBusinessCase } from "../engine/attach-business-case";
import { buildDecisionOutput } from "../engine";
import { saveDecisionRequestSchema } from "./save-decision-schema";
import { saveDecision } from "./decisions-repository";

export interface SaveDecisionHandlerResult {
  status: number;
  body: { id: string; humanReadableId: string } | { error: string };
}

export async function handleSaveDecisionRequest(
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<SaveDecisionHandlerResult> {
  // Authentication is checked first, before any parsing — an anonymous
  // request never reaches validation logic, let alone the database.
  // "No anonymous persistence" is enforced here as the very first line,
  // not discovered downstream via an RLS rejection.
  if (!userId) {
    return { status: 401, body: { error: "Sign in to save a decision." } };
  }

  const parsed = saveDecisionRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "The request could not be processed." } };
  }
  const request = parsed.data;

  // The deterministic score is never trusted from the client — it is
  // recomputed here, from the client-supplied (but now validated)
  // wizard state, using the exact same pure function every other code
  // path calls. This is a stronger guarantee than a Zod schema over
  // DeterministicDecisionOutput could ever provide: it doesn't merely
  // confirm the shape looks plausible, it proves the persisted score
  // IS the real, current, unmodified deterministic answer for this
  // input — closing the obvious "edit the JSON before re-submitting"
  // tampering path structurally. See
  // docs/sprint-6/21-security-review.md.
  let deterministicOutput;
  try {
    const wizardState = request.decisionInput.wizardState as never;
    const baseOutput = buildDecisionOutput(wizardState);
    const overrides = request.decisionInput.scenarioOverrides;
    const scenarioApplied = overrides ? applyScenarioToOutput(wizardState, baseOutput, overrides) : baseOutput;
    deterministicOutput = attachBusinessCase(scenarioApplied, request.decisionInput);
  } catch {
    return { status: 400, body: { error: "The request could not be processed." } };
  }

  const result = await saveDecision(supabase, request, deterministicOutput, {
    schemaVersion: SCHEMA_VERSION,
    scoringEngineVersion: SCORING_ENGINE_VERSION,
    knowledgeBaseVersion: KNOWLEDGE_BASE_VERSION,
  });

  if (!result.ok) {
    return { status: 400, body: { error: result.reason } };
  }

  return { status: 200, body: { id: result.data.id, humanReadableId: result.data.humanReadableId } };
}
