import "server-only";

/**
 * The framework-independent handler behind app/api/decisions/route.ts —
 * same "no NextRequest/NextResponse dependency" pattern Sprint 5's
 * intelligence/handle-decision-request.ts already established, for the
 * same reason: testable with plain objects, and the route file stays a
 * thin, obviously-correct adapter.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDecisionOutput } from "../engine";
import { saveDecisionRequestSchema } from "./save-decision-schema";
import { saveDecision } from "./decisions-repository";

export interface SaveDecisionHandlerResult {
  status: number;
  body: { id: string; humanReadableId: string } | { error: string };
}

/** Bumped by hand whenever its respective layer changes in a
 * scoring-relevant way — see docs/sprint-6/18-persistence-schema.md,
 * "Provenance fields." Not derived automatically from anything; a
 * human judgment call, same as Sprint 5's own schema_version story. */
const SCHEMA_VERSION = "decision-report/1";
const SCORING_ENGINE_VERSION = "donna-score-v2";
const KNOWLEDGE_BASE_VERSION = "vendor-catalog-v1";

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
    deterministicOutput = buildDecisionOutput(request.decisionInput.wizardState as never);
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
