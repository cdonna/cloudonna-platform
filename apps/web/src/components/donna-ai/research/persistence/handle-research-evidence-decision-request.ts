import "server-only";

/**
 * Framework-independent handler shared by both
 * POST /api/research/evidence/[id]/accept and .../reject. The only
 * state transition PROPOSED evidence can ever go through (brief §11)
 * — decided_by/decided_at are set by the decide_research_evidence()
 * RPC itself from auth.uid(), never from this handler's own input.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { decideResearchEvidence } from "./research-repository";

export interface ResearchEvidenceDecisionHandlerResult {
  status: number;
  body: { id: string; status: string } | { error: string };
}

export async function handleResearchEvidenceDecisionRequest(
  evidenceId: string,
  decision: "accepted" | "rejected",
  supabase: SupabaseClient,
  userId: string | null,
): Promise<ResearchEvidenceDecisionHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to review research evidence." } };
  if (!evidenceId) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await decideResearchEvidence(supabase, evidenceId, decision);
  if (!result.ok) return { status: 400, body: { error: result.reason } };

  return { status: 200, body: { id: result.data.id, status: result.data.status } };
}
