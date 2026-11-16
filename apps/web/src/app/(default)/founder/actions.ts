"use server";

/**
 * Server Actions for every /founder mutation — the same role
 * app/inquiries/actions.ts plays for the Inquiries inbox, extended to
 * a domain with more than one action. Each function resolves its own
 * user and Supabase client, then calls straight through to the
 * handler that also backs the equivalent REST route under
 * /api/founder/tasks/ — the handler is the single source of truth for
 * validation, authorization, and state-machine legality either way,
 * not reimplemented here. The REST routes exist for programmatic/future
 * mobile-app access (see docs/founder-agent/architecture.md); the web
 * UI itself uses these Server Actions, avoiding a pointless extra HTTP
 * hop to call its own API.
 */
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleCreateTaskRequest } from "@/lib/founder-agent/handle-create-task-request";
import { handleDispatchTaskRequest } from "@/lib/founder-agent/handle-dispatch-task-request";
import { handleSyncTaskRequest } from "@/lib/founder-agent/handle-sync-task-request";
import { handleReviewTaskRequest } from "@/lib/founder-agent/handle-review-task-request";
import { handleMergeTaskRequest } from "@/lib/founder-agent/handle-merge-task-request";
import { handleDeployTaskRequest } from "@/lib/founder-agent/handle-deploy-task-request";
import { handleCancelTaskRequest } from "@/lib/founder-agent/handle-cancel-task-request";
import type { FounderTaskRecord } from "@/lib/founder-agent/repository";

export interface ActionResult {
  error: string | null;
  notConfigured?: boolean;
  disabled?: boolean;
  task?: FounderTaskRecord;
}

async function currentCaller() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  return { userId: user?.id ?? null, supabase };
}

function toActionResult(body: unknown): ActionResult {
  if (body && typeof body === "object" && "task" in body) {
    return { error: null, task: (body as { task: FounderTaskRecord }).task };
  }
  const error = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : "Something went wrong.";
  const notConfigured = body && typeof body === "object" && "notConfigured" in body ? Boolean((body as { notConfigured: unknown }).notConfigured) : undefined;
  const disabled = body && typeof body === "object" && "disabled" in body ? Boolean((body as { disabled: unknown }).disabled) : undefined;
  return { error, notConfigured, disabled };
}

export async function createTaskAction(input: {
  title: string;
  description: string;
  priority: string;
  targetArea: string;
  constraints?: string;
  acceptanceCriteria: string;
}): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleCreateTaskRequest(input, supabase, userId);
  if (result.status === 201) revalidatePath("/founder");
  return toActionResult(result.body);
}

export async function dispatchTaskAction(taskId: string): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleDispatchTaskRequest(taskId, supabase, userId);
  revalidatePath("/founder");
  revalidatePath(`/founder/tasks/${taskId}`);
  return toActionResult(result.body);
}

export async function syncTaskAction(taskId: string): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleSyncTaskRequest(taskId, supabase, userId);
  revalidatePath(`/founder/tasks/${taskId}`);
  return toActionResult(result.body);
}

export async function reviewTaskAction(
  taskId: string,
  decision: "approved" | "changes_requested" | "rejected",
  notes?: string,
): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleReviewTaskRequest(taskId, { decision, notes }, supabase, userId);
  revalidatePath("/founder");
  revalidatePath(`/founder/tasks/${taskId}`);
  return toActionResult(result.body);
}

export async function mergeTaskAction(taskId: string, notes?: string): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleMergeTaskRequest(taskId, { notes }, supabase, userId);
  revalidatePath("/founder");
  revalidatePath(`/founder/tasks/${taskId}`);
  return toActionResult(result.body);
}

export async function deployTaskAction(taskId: string, notes?: string): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleDeployTaskRequest(taskId, { notes }, supabase, userId);
  return toActionResult(result.body);
}

export async function cancelTaskAction(taskId: string, reason?: string): Promise<ActionResult> {
  const { userId, supabase } = await currentCaller();
  const result = await handleCancelTaskRequest(taskId, { reason }, supabase, userId);
  revalidatePath("/founder");
  revalidatePath(`/founder/tasks/${taskId}`);
  return toActionResult(result.body);
}
