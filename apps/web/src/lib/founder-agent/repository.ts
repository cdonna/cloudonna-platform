import "server-only";

/**
 * The only module that reads from or writes to the four founder_task_*
 * tables. Takes an already-constructed per-request server client, the
 * same convention as inquiries/repository.ts and decisions-repository.ts
 * — every call here runs as the real authenticated user, and
 * is_platform_staff() (RLS) is the actual enforcement of "only platform
 * staff can see or touch this," not an application-level check this
 * file performs on its own. A non-staff caller gets an empty result or
 * a silent no-op write, the same "not-found and not-allowed look
 * identical" posture the rest of this codebase already uses.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FounderTaskPriority,
  FounderTaskStatus,
  FounderTaskTargetArea,
} from "./types";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "This action is restricted to ClouDonna platform staff.";
  }
  if (lower.includes("check constraint") || lower.includes("violates check")) {
    return "The request did not pass validation.";
  }
  return "This action could not be completed. Please try again.";
}

export interface FounderTaskRecord {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  priority: FounderTaskPriority;
  targetArea: FounderTaskTargetArea;
  constraints: string | null;
  acceptanceCriteria: string;
  status: FounderTaskStatus;
  failureReason: string | null;
  branchName: string | null;
  baseCommitSha: string | null;
  headCommitSha: string | null;
  prNumber: number | null;
  prUrl: string | null;
  agentProvider: string;
  agentModel: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  approvedAt: string | null;
  mergedAt: string | null;
  deployedAt: string | null;
}

function mapTaskRow(row: Record<string, unknown>): FounderTaskRecord {
  return {
    id: row.id as string,
    createdBy: row.created_by as string,
    title: row.title as string,
    description: row.description as string,
    priority: row.priority as FounderTaskPriority,
    targetArea: row.target_area as FounderTaskTargetArea,
    constraints: (row.constraints as string | null) ?? null,
    acceptanceCriteria: row.acceptance_criteria as string,
    status: row.status as FounderTaskStatus,
    failureReason: (row.failure_reason as string | null) ?? null,
    branchName: (row.branch_name as string | null) ?? null,
    baseCommitSha: (row.base_commit_sha as string | null) ?? null,
    headCommitSha: (row.head_commit_sha as string | null) ?? null,
    prNumber: (row.pr_number as number | null) ?? null,
    prUrl: (row.pr_url as string | null) ?? null,
    agentProvider: row.agent_provider as string,
    agentModel: (row.agent_model as string | null) ?? null,
    createdAt: row.created_at as string,
    startedAt: (row.started_at as string | null) ?? null,
    finishedAt: (row.finished_at as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    mergedAt: (row.merged_at as string | null) ?? null,
    deployedAt: (row.deployed_at as string | null) ?? null,
  };
}

const TASK_COLUMNS =
  "id, created_by, title, description, priority, target_area, constraints, acceptance_criteria, status, failure_reason, branch_name, base_commit_sha, head_commit_sha, pr_number, pr_url, agent_provider, agent_model, created_at, started_at, finished_at, approved_at, merged_at, deployed_at";

export interface CreateTaskInput {
  createdBy: string;
  title: string;
  description: string;
  priority: FounderTaskPriority;
  targetArea: FounderTaskTargetArea;
  constraints: string | null;
  acceptanceCriteria: string;
}

export async function createTask(supabase: SupabaseClient, input: CreateTaskInput): Promise<RepositoryResult<FounderTaskRecord>> {
  const { data, error } = await supabase
    .from("founder_tasks")
    .insert({
      created_by: input.createdBy,
      title: input.title,
      description: input.description,
      priority: input.priority,
      target_area: input.targetArea,
      constraints: input.constraints,
      acceptance_criteria: input.acceptanceCriteria,
    })
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, reason: classifyError(error?.message ?? "insert returned no row") };
  }
  return { ok: true, data: mapTaskRow(data) };
}

export async function listTasksForStaff(supabase: SupabaseClient): Promise<RepositoryResult<FounderTaskRecord[]>> {
  const { data, error } = await supabase.from("founder_tasks").select(TASK_COLUMNS).order("created_at", { ascending: false });
  if (error) {
    return { ok: false, reason: classifyError(error.message) };
  }
  return { ok: true, data: (data ?? []).map(mapTaskRow) };
}

export async function getTask(supabase: SupabaseClient, taskId: string): Promise<RepositoryResult<FounderTaskRecord | null>> {
  const { data, error } = await supabase.from("founder_tasks").select(TASK_COLUMNS).eq("id", taskId).maybeSingle();
  if (error) {
    return { ok: false, reason: classifyError(error.message) };
  }
  return { ok: true, data: data ? mapTaskRow(data) : null };
}

/**
 * The one function that moves `founder_tasks.status`. Always called
 * with the result of state-machine.ts's `transition()` already
 * computed by the caller — this function does not re-derive legality,
 * it persists a decision that was already validated. Keeping that
 * split (decide in pure code, persist in this file) is what makes the
 * state machine testable without a database and this function trivial
 * to review for "does it write what it's told, nothing more."
 */
export async function updateTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  patch: Partial<{
    status: FounderTaskStatus;
    failureReason: string | null;
    branchName: string;
    baseCommitSha: string;
    headCommitSha: string;
    prNumber: number;
    prUrl: string;
    agentModel: string;
    startedAt: string;
    finishedAt: string;
    approvedAt: string;
    mergedAt: string;
    deployedAt: string;
  }>,
): Promise<RepositoryResult<FounderTaskRecord>> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.failureReason !== undefined) row.failure_reason = patch.failureReason;
  if (patch.branchName !== undefined) row.branch_name = patch.branchName;
  if (patch.baseCommitSha !== undefined) row.base_commit_sha = patch.baseCommitSha;
  if (patch.headCommitSha !== undefined) row.head_commit_sha = patch.headCommitSha;
  if (patch.prNumber !== undefined) row.pr_number = patch.prNumber;
  if (patch.prUrl !== undefined) row.pr_url = patch.prUrl;
  if (patch.agentModel !== undefined) row.agent_model = patch.agentModel;
  if (patch.startedAt !== undefined) row.started_at = patch.startedAt;
  if (patch.finishedAt !== undefined) row.finished_at = patch.finishedAt;
  if (patch.approvedAt !== undefined) row.approved_at = patch.approvedAt;
  if (patch.mergedAt !== undefined) row.merged_at = patch.mergedAt;
  if (patch.deployedAt !== undefined) row.deployed_at = patch.deployedAt;

  const { data, error } = await supabase.from("founder_tasks").update(row).eq("id", taskId).select(TASK_COLUMNS).maybeSingle();
  if (error) {
    return { ok: false, reason: classifyError(error.message) };
  }
  if (!data) {
    return { ok: false, reason: "This task could not be found or you do not have access to it." };
  }
  return { ok: true, data: mapTaskRow(data) };
}

export interface FounderTaskEventRecord {
  id: string;
  taskId: string;
  eventName: string;
  actorKind: "founder" | "worker" | "system";
  actorId: string;
  summary: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export async function appendTaskEvent(
  supabase: SupabaseClient,
  input: { taskId: string; eventName: string; actorKind: "founder" | "worker" | "system"; actorId: string; summary: string; data?: Record<string, unknown> },
): Promise<RepositoryResult<{ id: string }>> {
  const { data, error } = await supabase
    .from("founder_task_events")
    .insert({
      task_id: input.taskId,
      event_name: input.eventName,
      actor_kind: input.actorKind,
      actor_id: input.actorId,
      summary: input.summary,
      data: input.data ?? {},
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, reason: classifyError(error?.message ?? "insert returned no row") };
  }
  return { ok: true, data: { id: data.id as string } };
}

export async function listTaskEvents(supabase: SupabaseClient, taskId: string): Promise<RepositoryResult<FounderTaskEventRecord[]>> {
  const { data, error } = await supabase
    .from("founder_task_events")
    .select("id, task_id, event_name, actor_kind, actor_id, summary, data, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, reason: classifyError(error.message) };
  }
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      taskId: row.task_id as string,
      eventName: row.event_name as string,
      actorKind: row.actor_kind as "founder" | "worker" | "system",
      actorId: row.actor_id as string,
      summary: row.summary as string,
      data: (row.data as Record<string, unknown>) ?? {},
      createdAt: row.created_at as string,
    })),
  };
}

export interface FounderTaskArtifactRecord {
  id: string;
  taskId: string;
  artifactType: string;
  label: string;
  content: string | null;
  url: string | null;
  createdAt: string;
}

export async function addTaskArtifact(
  supabase: SupabaseClient,
  input: { taskId: string; artifactType: string; label: string; content?: string | null; url?: string | null },
): Promise<RepositoryResult<{ id: string }>> {
  const { data, error } = await supabase
    .from("founder_task_artifacts")
    .insert({
      task_id: input.taskId,
      artifact_type: input.artifactType,
      label: input.label,
      content: input.content ?? null,
      url: input.url ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, reason: classifyError(error?.message ?? "insert returned no row") };
  }
  return { ok: true, data: { id: data.id as string } };
}

export async function listTaskArtifacts(supabase: SupabaseClient, taskId: string): Promise<RepositoryResult<FounderTaskArtifactRecord[]>> {
  const { data, error } = await supabase
    .from("founder_task_artifacts")
    .select("id, task_id, artifact_type, label, content, url, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, reason: classifyError(error.message) };
  }
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      taskId: row.task_id as string,
      artifactType: row.artifact_type as string,
      label: row.label as string,
      content: (row.content as string | null) ?? null,
      url: (row.url as string | null) ?? null,
      createdAt: row.created_at as string,
    })),
  };
}

export interface FounderTaskApprovalRecord {
  id: string;
  taskId: string;
  approvalType: "review" | "merge" | "deploy";
  decision: "approved" | "changes_requested" | "rejected";
  decidedBy: string;
  notes: string | null;
  createdAt: string;
}

/**
 * `decidedBy` is always the caller's own `auth.uid()`, resolved
 * server-side from the session — never accepted as a parameter from a
 * request body. Every handler that calls this passes `userId` sourced
 * from `getCurrentUser()`, the same discipline
 * handle-append-decision-version-request.ts already uses. This is the
 * one function in the whole domain that is allowed to write a row that
 * means "a founder decided this," and it cannot be called without a
 * real profile id.
 */
export async function recordApproval(
  supabase: SupabaseClient,
  input: { taskId: string; approvalType: "review" | "merge" | "deploy"; decision: "approved" | "changes_requested" | "rejected"; decidedBy: string; notes?: string | null },
): Promise<RepositoryResult<FounderTaskApprovalRecord>> {
  const { data, error } = await supabase
    .from("founder_task_approvals")
    .insert({
      task_id: input.taskId,
      approval_type: input.approvalType,
      decision: input.decision,
      decided_by: input.decidedBy,
      notes: input.notes ?? null,
    })
    .select("id, task_id, approval_type, decision, decided_by, notes, created_at")
    .single();

  if (error || !data) {
    return { ok: false, reason: classifyError(error?.message ?? "insert returned no row") };
  }
  return {
    ok: true,
    data: {
      id: data.id as string,
      taskId: data.task_id as string,
      approvalType: data.approval_type as "review" | "merge" | "deploy",
      decision: data.decision as "approved" | "changes_requested" | "rejected",
      decidedBy: data.decided_by as string,
      notes: (data.notes as string | null) ?? null,
      createdAt: data.created_at as string,
    },
  };
}

export async function listTaskApprovals(supabase: SupabaseClient, taskId: string): Promise<RepositoryResult<FounderTaskApprovalRecord[]>> {
  const { data, error } = await supabase
    .from("founder_task_approvals")
    .select("id, task_id, approval_type, decision, decided_by, notes, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, reason: classifyError(error.message) };
  }
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      taskId: row.task_id as string,
      approvalType: row.approval_type as "review" | "merge" | "deploy",
      decision: row.decision as "approved" | "changes_requested" | "rejected",
      decidedBy: row.decided_by as string,
      notes: (row.notes as string | null) ?? null,
      createdAt: row.created_at as string,
    })),
  };
}
