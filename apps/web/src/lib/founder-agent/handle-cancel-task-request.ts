import "server-only";

/**
 * Behind POST /api/founder/tasks/[id]/cancel. Founder-only, same
 * actor construction discipline as every other mutating handler in
 * this domain — see handle-review-task-request.ts's own comment.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { cancelTaskRequestSchema } from "./schema";
import { appendTaskEvent, getTask, updateTaskStatus, type FounderTaskRecord } from "./repository";
import { transition } from "./state-machine";

export interface CancelTaskHandlerResult {
  status: number;
  body: { task: FounderTaskRecord } | { error: string };
}

export async function handleCancelTaskRequest(
  taskId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<CancelTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to cancel a task." } };
  }

  const parsed = cancelTaskRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "The request could not be processed." } };
  }

  const taskResult = await getTask(supabase, taskId);
  if (!taskResult.ok) return { status: 403, body: { error: taskResult.reason } };
  const task = taskResult.data;
  if (!task) return { status: 404, body: { error: "Task not found." } };

  const result = transition(task.status, { kind: "cancel" }, { kind: "founder", founderId: userId });
  if (!result.ok) {
    return { status: 409, body: { error: result.reason } };
  }

  const updateResult = await updateTaskStatus(supabase, task.id, {
    status: result.next,
    finishedAt: new Date().toISOString(),
    failureReason: parsed.data.reason ?? null,
  });
  if (!updateResult.ok) {
    return { status: 500, body: { error: updateResult.reason } };
  }

  await appendTaskEvent(supabase, {
    taskId: task.id,
    eventName: "cancelled",
    actorKind: "founder",
    actorId: userId,
    summary: parsed.data.reason ? `Cancelled by the founder: ${parsed.data.reason}` : "Cancelled by the founder.",
  });

  return { status: 200, body: { task: updateResult.data } };
}
