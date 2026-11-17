import "server-only";

/**
 * Framework-independent handler behind POST /api/research/run. The
 * one place that actually calls a live ResearchProvider and persists
 * its output. Deliberately separate from the deterministic engine
 * (brief §4): this handler never touches scoring/engine.ts, never
 * writes a score, and every evidence row it writes lands as
 * status "proposed" — never "accepted".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadIntelligenceConfig } from "../../intelligence/config";
import type { ConflictedCell } from "../gap-detector";
import { runResearchSession } from "../research-orchestrator";
import { selectResearchProvider } from "../select-research-provider";
import { researchRunRequestSchema } from "../schema";
import { RESEARCH_AGENT_VERSION, type ResearchEvidence } from "../types";
import { getDecisionDetail } from "../../persistence/decisions-repository";
import {
  completeResearchSession,
  createResearchSession,
  insertResearchConflicts,
  insertResearchEvidence,
  listConflictsForDecision,
  listResearchEvidenceForDecision,
} from "./research-repository";

export interface ResearchRunHandlerResult {
  status: number;
  body:
    | {
        sessionId: string;
        status: string;
        sourcesFound: number;
        evidenceProposed: number;
        conflictsFound: number;
        gapsRemaining: unknown;
        stopReason: string | null;
        /** The newly proposed evidence/conflicts, in full — lets the UI
         * render the result of a run immediately, without a second
         * round trip to re-list everything for the decision. */
        newEvidence: ResearchEvidence[];
      }
    | { error: string };
}

export async function handleResearchRunRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<ResearchRunHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to run research." } };

  const parsed = researchRunRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };
  const { decisionId, criterionId, optionId } = parsed.data;

  const decisionResult = await getDecisionDetail(supabase, decisionId);
  if (!decisionResult.ok) return { status: 404, body: { error: decisionResult.reason } };

  const output = decisionResult.data.version.deterministicOutput;
  const ranked = [output.recommendation, ...output.alternatives];

  const evidenceResult = await listResearchEvidenceForDecision(supabase, decisionId);
  const allEvidence: ResearchEvidence[] = evidenceResult.ok ? evidenceResult.data : [];
  const accepted = allEvidence.filter((e) => e.status === "accepted");

  const conflictsResult = await listConflictsForDecision(supabase, decisionId);
  const openConflictCells: ConflictedCell[] = conflictsResult.ok
    ? conflictsResult.data
        .filter((c) => c.status === "open")
        .map((c) => ({ criterionId: c.criterionId as never, optionId: c.optionId as never }))
        .filter((c) => c.criterionId && c.optionId)
    : [];

  const provider = selectResearchProvider(loadIntelligenceConfig());
  const result = await runResearchSession(provider, {
    ranked,
    existingAcceptedEvidence: accepted,
    existingOpenConflictCells: openConflictCells,
    scope: { criterionId, optionId },
  });

  // Created after the run, not before: the session record's tasks_json
  // is the actual prioritized task list runResearchSession computed and
  // worked through, not a second, separately-recomputed copy of it.
  const sessionResult = await createResearchSession(supabase, decisionId, result.tasks, RESEARCH_AGENT_VERSION);
  if (!sessionResult.ok) return { status: 400, body: { error: sessionResult.reason } };
  const sessionId = sessionResult.data.id;

  const evidenceInsertResult = await insertResearchEvidence(supabase, decisionId, sessionId, result.proposedEvidence);
  const evidenceIds = evidenceInsertResult.ok ? evidenceInsertResult.data.map((e) => e.id) : [];
  const newEvidence: ResearchEvidence[] = result.proposedEvidence.map((draft, i) => ({ ...draft, id: evidenceIds[i] ?? `unsaved-${i}` }));

  if (evidenceIds.length > 0) {
    await insertResearchConflicts(supabase, decisionId, sessionId, result.proposedConflicts, evidenceIds);
  }

  await completeResearchSession(supabase, sessionId, {
    status: result.status,
    sourcesFound: result.sourcesFound,
    evidenceProposed: evidenceIds.length,
    conflictsFound: result.proposedConflicts.length,
    gapsRemaining: result.gapsRemaining,
    stopReason: result.stopReason,
  });

  return {
    status: 200,
    body: {
      sessionId,
      status: result.status,
      sourcesFound: result.sourcesFound,
      evidenceProposed: evidenceIds.length,
      conflictsFound: result.proposedConflicts.length,
      gapsRemaining: result.gapsRemaining,
      stopReason: result.stopReason,
      newEvidence,
    },
  };
}
