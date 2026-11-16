import "server-only";

/**
 * Behind POST /api/founder/tasks/[id]/dispatch — the action a founder
 * takes to actually start remote work, from either `queued` (first
 * run) or `changes_requested` (resuming after asking for revisions on
 * an existing branch). Takes the ExecutionAdapter as a parameter
 * (defaulting to the real one) purely so tests can inject a fake
 * adapter without touching environment variables — this is the one
 * seam in the whole domain where "GitHub is not configured" is an
 * expected, tested outcome rather than an error path nobody exercises.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getExecutionAdapter, type ExecutionAdapter } from "./execution-adapter";
import { getTask, updateTaskStatus, appendTaskEvent, type FounderTaskRecord } from "./repository";
import { transition } from "./state-machine";
import type { FounderTaskStatus } from "./types";

export interface DispatchTaskHandlerResult {
  status: number;
  body: { task: FounderTaskRecord } | { error: string; notConfigured?: boolean };
}

const DISPATCHABLE_STATUSES: ReadonlySet<FounderTaskStatus> = new Set(["queued", "changes_requested"]);

export async function handleDispatchTaskRequest(
  taskId: string,
  supabase: SupabaseClient,
  userId: string | null,
  adapter: ExecutionAdapter = getExecutionAdapter(),
): Promise<DispatchTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to start a task." } };
  }

  const taskResult = await getTask(supabase, taskId);
  if (!taskResult.ok) return { status: 403, body: { error: taskResult.reason } };
  const task = taskResult.data;
  if (!task) return { status: 404, body: { error: "Task not found." } };

  if (!DISPATCHABLE_STATUSES.has(task.status)) {
    return { status: 409, body: { error: `This task is "${task.status}" and cannot be started from here.` } };
  }

  const isResume = task.status === "changes_requested";
  const event = isResume ? ({ kind: "workspace_started" } as const) : ({ kind: "dispatch" } as const);
  // Dispatch is a founder-initiated action, but the state machine's
  // `workspace_started` event represents the worker confirming it has
  // begun — attributed to "system" (the control plane itself, acting on
  // the founder's instruction) rather than "founder", matching
  // handleChangesRequested's guard that a founder cannot claim
  // workspace_started directly. `dispatch` for a fresh queued task is,
  // by contrast, exactly the founder's own action.
  const actor = isResume ? ({ kind: "system" } as const) : ({ kind: "founder" as const, founderId: userId });

  const precheck = transition(task.status, event, actor);
  if (!precheck.ok) {
    return { status: 409, body: { error: precheck.reason } };
  }

  const dispatchResult = await adapter.dispatchTask({
    taskId: task.id,
    title: task.title,
    description: task.description,
    constraints: task.constraints,
    acceptanceCriteria: task.acceptanceCriteria,
    targetArea: task.targetArea,
  });

  if (!dispatchResult.ok) {
    await appendTaskEvent(supabase, {
      taskId: task.id,
      eventName: "execution_adapter_unavailable",
      actorKind: "system",
      actorId: "execution-adapter",
      summary: dispatchResult.reason,
    });
    return { status: 503, body: { error: dispatchResult.reason, notConfigured: dispatchResult.notConfigured } };
  }

  const updateResult = await updateTaskStatus(supabase, task.id, {
    status: precheck.next,
    branchName: dispatchResult.data.branchName,
    startedAt: task.startedAt ?? new Date().toISOString(),
  });
  if (!updateResult.ok) {
    return { status: 500, body: { error: updateResult.reason } };
  }

  await appendTaskEvent(supabase, {
    taskId: task.id,
    eventName: isResume ? "workspace_started" : "branch_created",
    actorKind: "system",
    actorId: "execution-adapter",
    summary: isResume
      ? `Resumed work on branch ${dispatchResult.data.branchName}.`
      : `Dispatched to GitHub Actions on branch ${dispatchResult.data.branchName}.`,
    data: { branchName: dispatchResult.data.branchName },
  });

  return { status: 200, body: { task: updateResult.data } };
}
