import "server-only";

/**
 * Behind POST /api/founder/tasks/[id]/merge — the separate "Merge this
 * branch into main?" confirmation the brief requires as its own
 * screen and its own action, never folded into Approve. Two gates, in
 * order:
 *
 *   1. transition()'s own actor check — only `{ kind: "founder" }` can
 *      ever reach "merged". This holds regardless of what GitHub
 *      reports.
 *   2. The actual GitHub merge call. The database is never updated to
 *      "merged" unless GitHub itself reports the merge as having
 *      happened — this handler will not mark a task merged because the
 *      founder clicked a button; it marks it merged because GitHub
 *      confirmed the PR was merged. If GitHub is not configured, this
 *      returns the same honest "not configured" shape every other
 *      adapter-backed handler does, and nothing in the database
 *      changes.
 *
 * If the task is still "approved" rather than already "merge_ready",
 * this handler runs the merge-precondition check (CI green, branch not
 * stale) itself first — "confirm CI green, confirm branch not stale"
 * from the brief's Merge Model, executed here rather than trusted from
 * client state.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeTaskRequestSchema } from "./schema";
import { getExecutionAdapter, type ExecutionAdapter } from "./execution-adapter";
import { appendTaskEvent, getTask, recordApproval, updateTaskStatus, type FounderTaskRecord } from "./repository";
import { transition } from "./state-machine";

export interface MergeTaskHandlerResult {
  status: number;
  body: { task: FounderTaskRecord } | { error: string; notConfigured?: boolean };
}

export async function handleMergeTaskRequest(
  taskId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
  adapter: ExecutionAdapter = getExecutionAdapter(),
): Promise<MergeTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to merge a task." } };
  }

  const parsed = mergeTaskRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "The request could not be processed." } };
  }

  const taskResult = await getTask(supabase, taskId);
  if (!taskResult.ok) return { status: 403, body: { error: taskResult.reason } };
  let task = taskResult.data;
  if (!task) return { status: 404, body: { error: "Task not found." } };

  if (task.status !== "approved" && task.status !== "merge_ready") {
    return { status: 409, body: { error: `This task is "${task.status}" and is not ready to merge.` } };
  }
  if (!task.branchName) {
    return { status: 409, body: { error: "This task has no branch to merge." } };
  }

  if (task.status === "approved") {
    const preconditions = await adapter.checkMergePreconditions({ branchName: task.branchName });
    if (!preconditions.ok) {
      return { status: 503, body: { error: preconditions.reason, notConfigured: preconditions.notConfigured } };
    }

    const result = transition(
      task.status,
      { kind: "merge_preconditions_checked", ciGreen: preconditions.data.ciGreen, branchStale: preconditions.data.branchStale },
      { kind: "system" },
    );
    if (!result.ok) {
      return { status: 409, body: { error: result.reason } };
    }

    const updated = await updateTaskStatus(supabase, task.id, { status: result.next, prNumber: preconditions.data.prNumber ?? undefined });
    if (!updated.ok) return { status: 500, body: { error: updated.reason } };
    task = updated.data;

    if (result.next === "running") {
      // "Never silently resolve risky conflicts" — the branch is stale
      // or CI is not green, so this run through the handler ends here,
      // having routed the task back through the quality gate rather
      // than merging a result that no longer reflects current `main`.
      await appendTaskEvent(supabase, {
        taskId: task.id,
        eventName: preconditions.data.branchStale ? "rebase_required" : "quality_gate_failed",
        actorKind: "system",
        actorId: "merge-precondition-check",
        summary: preconditions.data.branchStale
          ? "main changed since this branch was created — rebase and rerun the quality gate before merging."
          : "CI is not green on this branch — merge blocked until it is.",
      });
      return { status: 409, body: { error: "This task is not ready to merge yet — see the latest event for why." } };
    }

    await appendTaskEvent(supabase, {
      taskId: task.id,
      eventName: "merge_ready_confirmed",
      actorKind: "system",
      actorId: "merge-precondition-check",
      summary: "CI is green and the branch is current with main. Ready to merge.",
    });
  }

  if (!task.prNumber) {
    return { status: 409, body: { error: "This task has no open pull request to merge." } };
  }
  const branchName = task.branchName;
  const prNumber = task.prNumber;
  if (!branchName) {
    return { status: 409, body: { error: "This task has no branch to merge." } };
  }

  // Gate 1: only a founder actor can legally produce "merged".
  const mergeTransition = transition(task.status, { kind: "merge_confirmed" }, { kind: "founder", founderId: userId });
  if (!mergeTransition.ok) {
    return { status: 409, body: { error: mergeTransition.reason } };
  }

  // Gate 2: the database only becomes "merged" after GitHub confirms it.
  const mergeResult = await adapter.mergeTask({ branchName, prNumber, title: task.title });
  if (!mergeResult.ok) {
    await appendTaskEvent(supabase, {
      taskId: task.id,
      eventName: "sync_failed",
      actorKind: "system",
      actorId: "execution-adapter",
      summary: `Merge attempt failed: ${mergeResult.reason}`,
    });
    return { status: 503, body: { error: mergeResult.reason, notConfigured: mergeResult.notConfigured } };
  }

  const updateResult = await updateTaskStatus(supabase, task.id, {
    status: mergeTransition.next,
    headCommitSha: mergeResult.data.sha,
    mergedAt: new Date().toISOString(),
  });
  if (!updateResult.ok) {
    return { status: 500, body: { error: updateResult.reason } };
  }

  await recordApproval(supabase, { taskId: task.id, approvalType: "merge", decision: "approved", decidedBy: userId, notes: parsed.data.notes ?? null });
  await appendTaskEvent(supabase, {
    taskId: task.id,
    eventName: "merged",
    actorKind: "founder",
    actorId: userId,
    summary: `Merged by the founder (${mergeResult.data.sha.slice(0, 7)}).`,
  });

  return { status: 200, body: { task: updateResult.data } };
}
