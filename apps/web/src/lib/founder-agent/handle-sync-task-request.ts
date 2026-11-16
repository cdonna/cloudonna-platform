import "server-only";

/**
 * Behind POST /api/founder/tasks/[id]/sync — a founder-triggered
 * refresh (tapped from the Task Detail screen, or on a timer while
 * that screen is open) that reads the real GitHub Actions run for this
 * task's branch and relays what it finds into founder_task_events /
 * founder_tasks.status.
 *
 * This is deliberately a pull, not a push: the remote worker never
 * calls into this application at all, so there is no webhook endpoint
 * to authenticate, no worker-held credential that could write to this
 * database, and no new secret class beyond the one GitHub token this
 * domain already needs for dispatch. Every write this function makes
 * runs under the founder's own platform-staff RLS session — see
 * docs/founder-agent/security.md, "Why there is no worker-to-Postgres
 * write path."
 *
 * Every status this function can produce is drawn from the worker-safe
 * subset the state machine allows for actor.kind="system"
 * (workspace_started, enter_testing, quality_gate_result) — it cannot
 * reach "approved", "merge_ready", "merged", "deploy_ready", or
 * "deployed" no matter what GitHub reports, because transition() has
 * no branch that lets a non-founder actor produce those.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getExecutionAdapter, type ExecutionAdapter } from "./execution-adapter";
import { appendTaskEvent, getTask, updateTaskStatus, type FounderTaskRecord } from "./repository";
import { transition } from "./state-machine";
import { qualityGateAllPassed } from "./types";

export interface SyncTaskHandlerResult {
  status: number;
  body: { task: FounderTaskRecord } | { error: string; notConfigured?: boolean };
}

const SYNCABLE_STATUSES = new Set(["planning", "running", "testing"]);

export async function handleSyncTaskRequest(
  taskId: string,
  supabase: SupabaseClient,
  userId: string | null,
  adapter: ExecutionAdapter = getExecutionAdapter(),
): Promise<SyncTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to sync a task." } };
  }

  const taskResult = await getTask(supabase, taskId);
  if (!taskResult.ok) return { status: 403, body: { error: taskResult.reason } };
  let task = taskResult.data;
  if (!task) return { status: 404, body: { error: "Task not found." } };

  if (!SYNCABLE_STATUSES.has(task.status) || !task.branchName) {
    // Not an error — a task that hasn't been dispatched, or that has
    // already left the in-flight phase, simply has nothing new to sync.
    return { status: 200, body: { task } };
  }

  const syncResult = await adapter.syncTask({ taskId: task.id, branchName: task.branchName });
  if (!syncResult.ok) {
    await appendTaskEvent(supabase, {
      taskId: task.id,
      eventName: "sync_failed",
      actorKind: "system",
      actorId: "execution-adapter",
      summary: syncResult.reason,
    });
    return { status: 503, body: { error: syncResult.reason, notConfigured: syncResult.notConfigured } };
  }
  const report = syncResult.data;

  // planning -> running: the run has left the GitHub queue.
  if (task.status === "planning" && report.runStatus !== "queued") {
    const result = transition(task.status, { kind: "workspace_started" }, { kind: "system" });
    if (result.ok) {
      const updated = await updateTaskStatus(supabase, task.id, { status: result.next });
      if (updated.ok) {
        task = updated.data;
        await appendTaskEvent(supabase, {
          taskId: task.id,
          eventName: "workspace_started",
          actorKind: "worker",
          actorId: report.runUrl ?? "github-actions",
          summary: "Remote workspace started.",
          data: { runUrl: report.runUrl },
        });
      }
    }
  }

  // running -> testing -> review_ready|failed, in one sync call once
  // the run has finished. Collapsed into one step because this
  // control plane does not yet distinguish "writing code" from
  // "running the quality gate" within a single GitHub Actions job —
  // see docs/founder-agent/architecture.md §7.
  if (task.status === "running" && report.runStatus === "completed") {
    const enterTesting = transition(task.status, { kind: "enter_testing" }, { kind: "system" });
    if (enterTesting.ok) {
      const updated = await updateTaskStatus(supabase, task.id, { status: enterTesting.next, prNumber: report.prNumber ?? undefined, prUrl: report.prUrl ?? undefined, headCommitSha: report.headSha ?? undefined });
      if (updated.ok) task = updated.data;
    }
  }

  if (task.status === "testing" && report.runStatus === "completed" && report.runConclusion) {
    // The workflow (.github/workflows/founder-agent-task.yml) is
    // written to fail the job if any of TypeScript/ESLint/Vitest/build
    // fails — so a "success" conclusion is a legitimate stand-in for
    // "every gate passed" without having to download and parse the
    // artifact (see execution-adapter.ts's own comment on that
    // deferred step). A single failing run in v0.1 goes straight to
    // "failed": there is no second automatic attempt orchestrated by
    // this control plane yet, so `repairAttempted` is always true here
    // — see operations.md for the honest statement of that limitation.
    const allPassed = report.runConclusion === "success";
    const gate = {
      typescript: allPassed ? ("passed" as const) : ("failed" as const),
      eslint: allPassed ? ("passed" as const) : ("failed" as const),
      vitest: allPassed ? ("passed" as const) : ("failed" as const),
      build: allPassed ? ("passed" as const) : ("failed" as const),
    };
    const result = transition(task.status, { kind: "quality_gate_result", gate, repairAttempted: true }, { kind: "system" });
    if (result.ok) {
      const updated = await updateTaskStatus(supabase, task.id, {
        status: result.next,
        finishedAt: new Date().toISOString(),
        failureReason: qualityGateAllPassed(gate) ? undefined : "The quality gate failed on the remote run. See the workflow run log for details.",
      });
      if (updated.ok) {
        task = updated.data;
        await appendTaskEvent(supabase, {
          taskId: task.id,
          eventName: qualityGateAllPassed(gate) ? "review_ready" : "quality_gate_failed",
          actorKind: "worker",
          actorId: report.runUrl ?? "github-actions",
          summary: qualityGateAllPassed(gate)
            ? "Quality gate passed. Ready for review."
            : "Quality gate failed on the remote run.",
          data: { runUrl: report.runUrl, prUrl: report.prUrl },
        });
      }
    }
  }

  return { status: 200, body: { task } };
}
