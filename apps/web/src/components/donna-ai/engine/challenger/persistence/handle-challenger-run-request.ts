import "server-only";

/**
 * Framework-independent handler behind POST /api/challenger/run.
 * Stateless by design in V1 (brief §12/§13): challenges are
 * recomputed fresh on every call from the decision's current
 * engineResult, never persisted to their own table — re-running
 * "Challenge Recommendation" after new evidence or a new business
 * case has been saved naturally picks that up, since it always reads
 * the CURRENT version, not a stale cached list. Documented as a known
 * limitation (no accept/dismiss persistence yet) rather than a
 * table built mechanically ahead of a real need.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadIntelligenceConfig } from "../../../intelligence/config";
import { getDecisionDetail } from "../../../persistence/decisions-repository";
import { runChallengeSession } from "../challenger-orchestrator";
import { selectChallengerProvider } from "../select-challenger-provider";
import type { DecisionChallenge } from "../types";

const challengerRunRequestSchema = z.object({ decisionId: z.string().uuid() }).strict();

export interface ChallengerRunHandlerResult {
  status: number;
  body: { challenges: DecisionChallenge[]; aiStatus: string } | { error: string };
}

export async function handleChallengerRunRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<ChallengerRunHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to challenge a recommendation." } };

  const parsed = challengerRunRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const decisionResult = await getDecisionDetail(supabase, parsed.data.decisionId);
  if (!decisionResult.ok) return { status: 404, body: { error: decisionResult.reason } };

  const engineResult = decisionResult.data.version.deterministicOutput.engineResult;
  if (!engineResult) return { status: 400, body: { error: "This decision has no engine result to challenge." } };

  const provider = selectChallengerProvider(loadIntelligenceConfig());
  const result = await runChallengeSession(provider, { engineResult, businessCase: engineResult.businessCase ?? null });

  return { status: 200, body: { challenges: result.challenges, aiStatus: result.aiStatus } };
}
