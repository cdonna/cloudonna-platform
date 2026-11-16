/**
 * The Founder Agent task lifecycle: one pure function, `transition()`,
 * that decides whether a given (status, event, actor) combination is
 * legal and what it leads to. Nothing here touches Supabase, GitHub, or
 * React — every handler and every API route calls through this module
 * rather than mutating `founder_tasks.status` directly, so there is
 * exactly one place that can be wrong about the lifecycle, and it is
 * fully unit-testable with plain objects.
 *
 * This is where the brief's critical invariants are actually enforced,
 * not merely documented:
 *
 *   - the agent cannot approve itself          (§ REVIEW_ACTORS)
 *   - the agent cannot merge without approval   (§ MERGE_ACTORS)
 *   - the agent cannot deploy without approval  (§ DEPLOY_ACTORS)
 *   - a failed quality gate cannot reach review_ready (§ handleQualityGateResult)
 *
 * See __tests__/state-machine.test.ts for the test that exercises each
 * of these directly, and docs/founder-agent/task-lifecycle.md for the
 * full transition diagram in prose.
 */
import {
  qualityGateAllPassed,
  type FounderTaskStatus,
  type TaskActor,
  type TaskEvent,
  type TransitionResult,
} from "./types";

const TERMINAL_STATUSES: ReadonlySet<FounderTaskStatus> = new Set(["deployed", "cancelled", "failed"]);

function fail(reason: string): TransitionResult {
  return { ok: false, reason };
}

function ok(next: FounderTaskStatus): TransitionResult {
  return { ok: true, next };
}

/** Only a founder action may approve, reject, merge, deploy, or cancel.
 * No branch below ever checks `actor.kind !== "worker"` as a stand-in
 * for this — it always checks the positive condition, so a new actor
 * kind added later defaults to rejected rather than silently allowed. */
function requireFounder(actor: TaskActor, action: string): string | null {
  return actor.kind === "founder" ? null : `${action} requires a founder action; got actor.kind="${actor.kind}".`;
}

export function transition(current: FounderTaskStatus, event: TaskEvent, actor: TaskActor): TransitionResult {
  if (TERMINAL_STATUSES.has(current)) {
    return fail(`Task is in terminal status "${current}"; no further transitions are possible.`);
  }

  if (event.kind === "cancel") {
    const guard = requireFounder(actor, "Cancelling a task");
    if (guard) return fail(guard);
    if (current === "merged" || current === "deploy_ready") {
      return fail(`Cannot cancel a task once it has reached "${current}" — merged work is cancelled by reverting, not by this action.`);
    }
    return ok("cancelled");
  }

  switch (current) {
    case "queued":
      return handleQueued(event, actor);
    case "planning":
      return handlePlanning(event, actor);
    case "running":
      return handleRunning(event);
    case "testing":
      return handleTesting(event);
    case "review_ready":
      return handleReviewReady(event, actor);
    case "changes_requested":
      return handleChangesRequested(event, actor);
    case "approved":
      return handleApproved(event, actor);
    case "merge_ready":
      return handleMergeReady(event, actor);
    case "merged":
      return handleMerged(event, actor);
    case "deploy_ready":
      return handleDeployReady(event, actor);
    default:
      return fail(`No transition defined from status "${current}" for event "${event.kind}".`);
  }
}

function handleQueued(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind === "dispatch") {
    if (actor.kind === "worker") return fail("A worker cannot dispatch its own task — dispatch must come from a founder or the system.");
    return ok("planning");
  }
  if (event.kind === "dispatch_failed") {
    // The honest, expected path in this repository today: no execution
    // adapter is configured, so dispatch cannot succeed. The task stays
    // queued rather than silently advancing or being marked failed —
    // "not configured" is not the same claim as "the agent tried and
    // failed," and conflating them would misreport what happened. See
    // execution-adapter.ts.
    return ok("queued");
  }
  return fail(`Event "${event.kind}" is not valid from status "queued".`);
}

function handlePlanning(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind === "plan_created") return ok("planning");
  if (event.kind === "workspace_started") {
    if (actor.kind === "founder") return fail("workspace_started must be reported by the worker (or system), not claimed directly by a founder.");
    return ok("running");
  }
  if (event.kind === "dispatch_failed") {
    return ok("failed");
  }
  return fail(`Event "${event.kind}" is not valid from status "planning".`);
}

function handleRunning(event: TaskEvent): TransitionResult {
  if (event.kind === "branch_created") return ok("running");
  if (event.kind === "enter_testing") return ok("testing");
  return fail(`Event "${event.kind}" is not valid from status "running".`);
}

function handleTesting(event: TaskEvent): TransitionResult {
  if (event.kind !== "quality_gate_result") {
    return fail(`Event "${event.kind}" is not valid from status "testing".`);
  }
  // The invariant that matters most in this whole module: there is no
  // branch of this function that returns "review_ready" unless every
  // gate in the result passed. A caller cannot construct a path around
  // it by lying about `repairAttempted` — that flag only ever decides
  // between "try again" and "give up," never between "passed" and
  // "review_ready anyway."
  if (qualityGateAllPassed(event.gate)) {
    return ok("review_ready");
  }
  if (event.repairAttempted) {
    return ok("failed");
  }
  return ok("running");
}

function handleReviewReady(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind !== "review_submitted") {
    return fail(`Event "${event.kind}" is not valid from status "review_ready".`);
  }
  const guard = requireFounder(actor, "Approving, rejecting, or requesting changes on a task");
  if (guard) return fail(guard);

  if (event.decision === "approved") return ok("approved");
  if (event.decision === "changes_requested") return ok("changes_requested");
  // "rejected" ends the task outright — distinct from an automated
  // quality-gate failure (which lands in the same "failed" status via
  // handleTesting), but a founder rejecting finished work and the
  // pipeline being unable to produce a result are different facts a
  // reader of founder_task_approvals can still tell apart (approval_type
  // + decision are recorded there regardless of which status both paths
  // happen to land on).
  return ok("cancelled");
}

function handleChangesRequested(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind === "workspace_started") {
    if (actor.kind === "founder") return fail("workspace_started must be reported by the worker (or system) resuming work, not a founder.");
    return ok("running");
  }
  return fail(`Event "${event.kind}" is not valid from status "changes_requested".`);
}

function handleApproved(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind !== "merge_preconditions_checked") {
    return fail(`Event "${event.kind}" is not valid from status "approved".`);
  }
  if (actor.kind === "worker") {
    return fail("Merge preconditions must be checked by the founder's session or the system, never reported by the worker itself.");
  }
  if (!event.ciGreen || event.branchStale) {
    // "If main changed materially: rebase or refresh safely; rerun
    // quality gate. Never silently resolve risky conflicts." — modelled
    // as a loop back to `running`, which forces the quality gate to run
    // again rather than carrying forward a stale green result.
    return ok("running");
  }
  return ok("merge_ready");
}

function handleMergeReady(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind !== "merge_confirmed") {
    return fail(`Event "${event.kind}" is not valid from status "merge_ready".`);
  }
  const guard = requireFounder(actor, "Merging a task");
  if (guard) return fail(guard);
  return ok("merged");
}

function handleMerged(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind !== "deploy_confirmed") {
    return fail(`Event "${event.kind}" is not valid from status "merged".`);
  }
  const guard = requireFounder(actor, "Approving deployment of a task");
  if (guard) return fail(guard);
  return ok("deploy_ready");
}

function handleDeployReady(event: TaskEvent, actor: TaskActor): TransitionResult {
  if (event.kind !== "deployment_result") {
    return fail(`Event "${event.kind}" is not valid from status "deploy_ready".`);
  }
  if (actor.kind === "founder") {
    return fail("A deployment result is reported by the system (the deploy pipeline), not asserted directly by a founder.");
  }
  return event.ok ? ok("deployed") : ok("failed");
}

/** Whether `transition` can even be attempted — used by the UI to grey
 * out actions instead of letting a founder discover illegality only
 * after submitting. Delegates to the same function the API routes use,
 * so this can never drift from the real rule. */
export function canTransition(current: FounderTaskStatus, event: TaskEvent, actor: TaskActor): boolean {
  return transition(current, event, actor).ok;
}
