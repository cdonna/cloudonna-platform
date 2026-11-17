/**
 * Research Stop Conditions (brief §31) — bounded, explicit, never an
 * endless loop. Fixed constants, stated once.
 */
import type { StopReason } from "./types";

export const MAX_TASKS_PER_SESSION = 5;
export const DUPLICATE_RATIO_STOP_THRESHOLD = 0.6;
export const MAX_SESSION_DURATION_MS = 45_000;

export interface StopCheckInput {
  tasksCompleted: number;
  tasksRemaining: number;
  duplicateCount: number;
  proposedCount: number;
  noSourceFoundStreak: number;
  elapsedMs: number;
}

export function checkStopConditions(input: StopCheckInput): { stop: boolean; reason: StopReason | null } {
  if (input.tasksRemaining === 0) return { stop: true, reason: "all_tasks_completed" };
  if (input.tasksCompleted >= MAX_TASKS_PER_SESSION) return { stop: true, reason: "max_task_count_reached" };
  if (input.elapsedMs >= MAX_SESSION_DURATION_MS) return { stop: true, reason: "time_budget_reached" };
  if (input.proposedCount >= 3 && input.duplicateCount / (input.proposedCount + input.duplicateCount) >= DUPLICATE_RATIO_STOP_THRESHOLD) {
    return { stop: true, reason: "duplicate_ratio_high" };
  }
  // Three consecutive tasks with nothing retrievable is a real signal
  // that continuing will not help — stop and report honestly rather
  // than burn the remaining budget on more of the same.
  if (input.noSourceFoundStreak >= 3) return { stop: true, reason: "no_authoritative_sources_found" };
  return { stop: false, reason: null };
}
