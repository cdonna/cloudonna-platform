/**
 * Shared types for the Founder Agent control plane. Pure data shapes —
 * no Supabase, no GitHub, no React — so the state machine and the
 * handlers that use it stay testable with plain objects, the same
 * discipline as donna-ai/persistence's handler/schema split.
 */

export const FOUNDER_TASK_STATUSES = [
  "queued",
  "planning",
  "running",
  "testing",
  "review_ready",
  "changes_requested",
  "failed",
  "approved",
  "merge_ready",
  "merged",
  "deploy_ready",
  "deployed",
  "cancelled",
] as const;

export type FounderTaskStatus = (typeof FOUNDER_TASK_STATUSES)[number];

export const FOUNDER_TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type FounderTaskPriority = (typeof FOUNDER_TASK_PRIORITIES)[number];

export const FOUNDER_TASK_TARGET_AREAS = [
  "homepage",
  "donna_ai",
  "architects",
  "decision_skills",
  "data_economy",
  "trust",
  "cost_value_lab",
  "scenario_lab",
  "intelligence_fabric",
  "infrastructure",
  "bug",
  "other",
] as const;
export type FounderTaskTargetArea = (typeof FOUNDER_TASK_TARGET_AREAS)[number];

/**
 * Who is attempting a transition. This is the type-level half of "the
 * agent cannot approve itself" — a worker actor has no variant that
 * carries approval authority, so an approval transition literally
 * cannot be expressed with one. `founderId` is always a real profile
 * id resolved server-side from the caller's own session (see
 * handle-review-task-request.ts) — never accepted as a request field.
 */
export type TaskActor = { kind: "founder"; founderId: string } | { kind: "worker"; workerRef: string } | { kind: "system" };

export interface QualityGateResult {
  typescript: "passed" | "failed" | "skipped";
  eslint: "passed" | "failed" | "skipped";
  vitest: "passed" | "failed" | "skipped";
  build: "passed" | "failed" | "skipped";
}

export function qualityGateAllPassed(gate: QualityGateResult): boolean {
  return gate.typescript === "passed" && gate.eslint === "passed" && gate.vitest === "passed" && gate.build === "passed";
}

/**
 * The events that can be fed into the state machine. Distinct from
 * `founder_task_event_name` (the Postgres enum, which is the *recorded*
 * history) — a TaskEvent is the *input* to a transition decision, and
 * carries the data a guard needs (e.g. a quality gate result) that the
 * narrower recorded event_name does not.
 */
export type TaskEvent =
  | { kind: "dispatch" }
  | { kind: "dispatch_failed"; reason: string }
  | { kind: "plan_created" }
  | { kind: "workspace_started" }
  | { kind: "branch_created"; branchName: string }
  | { kind: "enter_testing" }
  | { kind: "quality_gate_result"; gate: QualityGateResult; repairAttempted: boolean }
  | { kind: "review_submitted"; decision: "approved" | "changes_requested" | "rejected" }
  | { kind: "merge_preconditions_checked"; ciGreen: boolean; branchStale: boolean }
  | { kind: "merge_confirmed" }
  | { kind: "deploy_confirmed" }
  | { kind: "deployment_result"; ok: boolean }
  | { kind: "cancel" };

export interface TransitionSuccess {
  ok: true;
  next: FounderTaskStatus;
}

export interface TransitionFailure {
  ok: false;
  reason: string;
}

export type TransitionResult = TransitionSuccess | TransitionFailure;
