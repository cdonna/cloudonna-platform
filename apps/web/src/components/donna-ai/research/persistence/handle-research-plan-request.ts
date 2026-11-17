import "server-only";

/**
 * Framework-independent handler behind POST /api/research/plan. Pure
 * planning — no provider call, no persistence — so a user can preview
 * what Research Agent would do before committing to a run (brief
 * §41's "see structured research tasks" step is deliberately
 * separable from actually retrieving anything).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { detectEvidenceGaps, type ConflictedCell } from "../gap-detector";
import { planResearchTasks } from "../query-planner";
import { prioritizeTasks } from "../prioritization";
import { researchPlanRequestSchema } from "../schema";
import type { ResearchEvidence } from "../types";
import { getDecisionDetail } from "../../persistence/decisions-repository";
import { listConflictsForDecision, listResearchEvidenceForDecision } from "./research-repository";

export interface ResearchPlanHandlerResult {
  status: number;
  body: { tasks: unknown; gaps: unknown } | { error: string };
}

export async function handleResearchPlanRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<ResearchPlanHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to plan research." } };

  const parsed = researchPlanRequestSchema.safeParse(rawBody);
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

  const gaps = detectEvidenceGaps(ranked, accepted, openConflictCells);
  const tasks = planResearchTasks(ranked, gaps, { criterionId, optionId });
  const prioritized = prioritizeTasks(tasks, ranked, gaps);

  return { status: 200, body: { tasks: prioritized, gaps } };
}
