import "server-only";

/**
 * Framework-independent handler behind POST /api/founder/tasks — same
 * pattern as handle-create-inquiry-request.ts, testable with plain
 * objects. Unlike inquiries, this path requires a real signed-in,
 * platform-staff caller: there is no anonymous write path anywhere in
 * this domain.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createTaskRequestSchema } from "./schema";
import { createTask, appendTaskEvent, type FounderTaskRecord } from "./repository";

export interface CreateTaskHandlerResult {
  status: number;
  body: { task: FounderTaskRecord } | { error: string };
}

export async function handleCreateTaskRequest(
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<CreateTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to create a task." } };
  }

  const parsed = createTaskRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "Please check the task form for missing or invalid fields." } };
  }
  const request = parsed.data;

  const result = await createTask(supabase, {
    createdBy: userId,
    title: request.title,
    description: request.description,
    priority: request.priority,
    targetArea: request.targetArea,
    constraints: request.constraints ?? null,
    acceptanceCriteria: request.acceptanceCriteria,
  });

  if (!result.ok) {
    // RLS (founder_tasks_insert_staff) is the real enforcement of "only
    // platform staff can create a task" — a non-staff authenticated
    // caller lands here as an insert that silently matches zero rows'
    // worth of permission, surfacing through classifyError() the same
    // way every other RLS-gated write in this codebase does.
    return { status: 403, body: { error: result.reason } };
  }

  await appendTaskEvent(supabase, {
    taskId: result.data.id,
    eventName: "task_created",
    actorKind: "founder",
    actorId: userId,
    summary: `Task created: "${result.data.title}".`,
  });

  return { status: 201, body: { task: result.data } };
}
