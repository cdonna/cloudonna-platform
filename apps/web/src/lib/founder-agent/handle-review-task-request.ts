import "server-only";

/**
 * Behind POST /api/founder/tasks/[id]/review — the Review screen's
 * three actions (Approve / Request Changes / Reject), collapsed into
 * one request shape per reviewTaskRequestSchema. This is the one
 * handler in the domain where "the agent cannot approve itself" is
 * most directly at stake: `actor` below is always `{ kind: "founder",
 * founderId: userId }`, built from the session the route resolved —
 * there is no code path through this file that could construct a
 * worker or system actor, so transition()'s own guard
 * (requireFounder) can never actually be reached from here with
 * anything but a real founder.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { reviewTaskRequestSchema } from "./schema";
import { appendTaskEvent, getTask, recordApproval, updateTaskStatus, type FounderTaskRecord } from "./repository";
import { transition } from "./state-machine";

export interface ReviewTaskHandlerResult {
  status: number;
  body: { task: FounderTaskRecord } | { error: string };
}

const EVENT_NAME_BY_DECISION = {
  approved: "approved",
  changes_requested: "changes_requested",
  rejected: "rejected",
} as const;

export async function handleReviewTaskRequest(
  taskId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<ReviewTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to review a task." } };
  }

  const parsed = reviewTaskRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "Please choose Approve, Request Changes, or Reject." } };
  }
  const request = parsed.data;

  const taskResult = await getTask(supabase, taskId);
  if (!taskResult.ok) return { status: 403, body: { error: taskResult.reason } };
  const task = taskResult.data;
  if (!task) return { status: 404, body: { error: "Task not found." } };

  const result = transition(task.status, { kind: "review_submitted", decision: request.decision }, { kind: "founder", founderId: userId });
  if (!result.ok) {
    return { status: 409, body: { error: result.reason } };
  }

  const updateResult = await updateTaskStatus(supabase, task.id, {
    status: result.next,
    approvedAt: request.decision === "approved" ? new Date().toISOString() : undefined,
  });
  if (!updateResult.ok) {
    return { status: 500, body: { error: updateResult.reason } };
  }

  await recordApproval(supabase, {
    taskId: task.id,
    approvalType: "review",
    decision: request.decision,
    decidedBy: userId,
    notes: request.notes ?? null,
  });

  await appendTaskEvent(supabase, {
    taskId: task.id,
    eventName: EVENT_NAME_BY_DECISION[request.decision],
    actorKind: "founder",
    actorId: userId,
    summary:
      request.decision === "approved"
        ? "Approved by the founder."
        : request.decision === "changes_requested"
          ? "Changes requested by the founder."
          : "Rejected by the founder.",
    data: request.notes ? { notes: request.notes } : {},
  });

  return { status: 200, body: { task: updateResult.data } };
}
