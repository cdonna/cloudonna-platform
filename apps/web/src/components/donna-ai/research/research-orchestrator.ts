/**
 * Research Orchestrator (brief §4) — the composition root for the
 * research pipeline, mirroring intelligence/orchestrator.ts's own
 * structure and discipline: one module sequences every step and owns
 * every stop/failure decision, no other module decides what happens
 * when retrieval fails.
 *
 * Deliberately separate from deterministic scoring (brief §4, "keep
 * the Research Agent separate from deterministic scoring") — this
 * module never touches scoring/engine.ts and never writes a score.
 * Its only output is a set of PROPOSED evidence/conflicts; nothing
 * here is "accepted" until a human says so (research-repository.ts).
 */
import { dedupeWithIndexMap } from "./duplicate-detection";
import { classifyEvidence } from "./evidence-classification";
import { detectEvidenceGaps, type ConflictedCell } from "./gap-detector";
import { planResearchTasks, type QueryPlannerScope } from "./query-planner";
import { prioritizeTasks } from "./prioritization";
import type { ResearchProvider, ResearchRetrievalContext } from "./provider";
import { checkStopConditions, MAX_TASKS_PER_SESSION } from "./stop-conditions";
import type { GapCell, ResearchEvidence, ResearchSessionStatus, ResearchTask, StopReason } from "./types";
import type { ScoreDimensionKey } from "../types";
import type { RankedPlatform } from "../scoring/types";

/** A detected conflict before its two claims have been persisted as
 * real research_evidence rows — references them by index into this
 * session's own `proposedEvidence` array. The persistence layer
 * resolves these indices into real evidence ids once it has inserted
 * them (research/persistence/research-repository.ts). */
export interface ProposedSessionConflict {
  claimAIndex: number;
  claimBIndex: number;
  criterionId: ScoreDimensionKey | null;
  optionId: string | null;
  severity: "low" | "medium" | "high";
  explanation: string;
}

export interface RunResearchInput {
  ranked: RankedPlatform[];
  existingAcceptedEvidence: ResearchEvidence[];
  existingOpenConflictCells: ConflictedCell[];
  scope?: QueryPlannerScope;
}

export interface RunResearchOutput {
  status: ResearchSessionStatus;
  tasks: ResearchTask[];
  proposedEvidence: Array<Omit<ResearchEvidence, "id">>;
  proposedConflicts: ProposedSessionConflict[];
  gapsRemaining: GapCell[];
  sourcesFound: number;
  stopReason: StopReason | null;
}

function platformName(ranked: RankedPlatform[], optionId: string | null): string | null {
  if (!optionId) return null;
  const platform = ranked.find((r) => r.platform.id === optionId);
  return platform ? `${platform.platform.vendor} ${platform.platform.productName}` : null;
}

export async function runResearchSession(provider: ResearchProvider, input: RunResearchInput): Promise<RunResearchOutput> {
  const startedAt = Date.now();
  const gapsBefore = detectEvidenceGaps(input.ranked, input.existingAcceptedEvidence, input.existingOpenConflictCells);
  const plannedTasks = planResearchTasks(input.ranked, gapsBefore, input.scope);
  const prioritized = prioritizeTasks(plannedTasks, input.ranked, gapsBefore).slice(0, MAX_TASKS_PER_SESSION * 3); // keep a bounded working set; MAX_TASKS_PER_SESSION still gates actual execution below

  const proposedEvidence: Array<Omit<ResearchEvidence, "id">> = [];
  const proposedConflicts: ProposedSessionConflict[] = [];
  let sourcesFound = 0;
  let tasksCompleted = 0;
  let noSourceFoundStreak = 0;
  let stopReason: StopReason | null = null;
  const completedTaskIds = new Set<string>();

  for (const task of prioritized) {
    const elapsedMs = Date.now() - startedAt;
    const stopCheck = checkStopConditions({
      tasksCompleted,
      tasksRemaining: prioritized.length - tasksCompleted,
      duplicateCount: 0,
      proposedCount: proposedEvidence.length,
      noSourceFoundStreak,
      elapsedMs,
    });
    if (stopCheck.stop && stopCheck.reason !== "all_tasks_completed") {
      stopReason = stopCheck.reason;
      break;
    }

    const context: ResearchRetrievalContext = {
      optionName: platformName(input.ranked, task.optionId),
      criterionLabel: task.criterionId,
      existingAcceptedClaims: input.existingAcceptedEvidence
        .filter((e) => e.optionId === task.optionId && e.criterionId === task.criterionId)
        .map((e) => e.claim),
    };

    const result = await provider.retrieveAndExtract(task, context);
    tasksCompleted += 1;
    completedTaskIds.add(task.taskId);

    if (result.status !== "ok") {
      noSourceFoundStreak += 1;
      continue;
    }
    noSourceFoundStreak = 0;
    sourcesFound += result.sources.length;

    const draftsForTask = result.claims.map((claim) => {
      const source = result.sources[claim.citationIndex];
      return classifyEvidence(claim, source, task.taskId);
    });

    // Conflict indices are resolved against this task's own
    // pre-dedup draft batch, offset into the session-wide
    // proposedEvidence array — dedup happens once, at the very end,
    // over the complete list, and remaps these indices afterward.
    const globalBase = proposedEvidence.length;
    for (const conflict of result.conflicts) {
      if (conflict.claimIndexA >= draftsForTask.length || conflict.claimIndexB >= draftsForTask.length) continue;
      proposedConflicts.push({
        claimAIndex: globalBase + conflict.claimIndexA,
        claimBIndex: globalBase + conflict.claimIndexB,
        criterionId: task.criterionId,
        optionId: task.optionId,
        severity: conflict.severity,
        explanation: conflict.explanation,
      });
    }
    proposedEvidence.push(...draftsForTask);
  }

  if (!stopReason) {
    const allCovered = prioritized.every((t) => completedTaskIds.has(t.taskId));
    stopReason = allCovered ? "all_tasks_completed" : "max_task_count_reached";
  }

  // One dedup pass over the complete session, now that every conflict
  // already references a stable global index into the pre-dedup list —
  // remap (or drop, if either side was merged away as a duplicate)
  // rather than re-deriving indices after the list shrinks.
  const { unique: dedupedEvidence, indexMap } = dedupeWithIndexMap(proposedEvidence);
  const dedupedConflicts = proposedConflicts
    .map((c) => ({ ...c, claimAIndex: indexMap[c.claimAIndex], claimBIndex: indexMap[c.claimBIndex] }))
    .filter((c): c is ProposedSessionConflict => c.claimAIndex !== null && c.claimBIndex !== null && c.claimAIndex !== c.claimBIndex);

  const acceptedPlusProposed = input.existingAcceptedEvidence; // gaps "remaining" are computed against accepted evidence only — a PROPOSED item does not close a gap until a human accepts it.
  const gapsRemaining = detectEvidenceGaps(input.ranked, acceptedPlusProposed, input.existingOpenConflictCells);

  // "failed" means tasks were actually attempted and not one of them
  // produced anything — distinct from tasksCompleted, which counts
  // attempts regardless of outcome. No tasks to run at all (every gap
  // already supported) is trivially a success, not a failure.
  const status: ResearchSessionStatus =
    prioritized.length === 0 ? "completed" : dedupedEvidence.length === 0 ? "failed" : stopReason === "all_tasks_completed" ? "completed" : "partial";

  return { status, tasks: prioritized, proposedEvidence: dedupedEvidence, proposedConflicts: dedupedConflicts, gapsRemaining, sourcesFound, stopReason };
}
