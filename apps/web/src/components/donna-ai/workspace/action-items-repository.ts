import "server-only";

/** The only module that reads/writes decision_action_items (brief
 * §39). Tenant-scoped (is_org_member()). */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateActionItemRequest, UpdateActionItemRequest } from "./schema";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to this decision.";
  return "The request could not be processed.";
}

export type ActionItemStatus = "open" | "done";

export interface DecisionActionItem {
  id: string;
  decisionId: string;
  action: string;
  owner: string | null;
  targetDate: string | null;
  status: ActionItemStatus;
  createdAt: string;
  updatedAt: string;
}

const ACTION_ITEM_SELECT = "id, decision_id, action, owner, target_date, status, created_at, updated_at";

interface ActionItemRow {
  id: string;
  decision_id: string;
  action: string;
  owner: string | null;
  target_date: string | null;
  status: ActionItemStatus;
  created_at: string;
  updated_at: string;
}

function mapActionItem(row: ActionItemRow): DecisionActionItem {
  return {
    id: row.id,
    decisionId: row.decision_id,
    action: row.action,
    owner: row.owner,
    targetDate: row.target_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listActionItemsForDecision(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<DecisionActionItem[]>> {
  const { data, error } = await supabase.from("decision_action_items").select(ACTION_ITEM_SELECT).eq("decision_id", decisionId).order("target_date", { ascending: true });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as ActionItemRow[] | null) ?? []).map(mapActionItem) };
}

export async function createActionItem(
  supabase: SupabaseClient,
  decisionId: string,
  organizationId: string,
  request: CreateActionItemRequest,
): Promise<RepositoryResult<DecisionActionItem>> {
  const { data, error } = await supabase
    .from("decision_action_items")
    .insert({ decision_id: decisionId, organization_id: organizationId, action: request.action, owner: request.owner ?? null, target_date: request.targetDate ?? null })
    .select(ACTION_ITEM_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapActionItem(data as ActionItemRow) };
}

export async function updateActionItem(supabase: SupabaseClient, actionItemId: string, request: UpdateActionItemRequest): Promise<RepositoryResult<DecisionActionItem>> {
  const patch: Record<string, unknown> = {};
  if (request.action !== undefined) patch.action = request.action;
  if (request.owner !== undefined) patch.owner = request.owner;
  if (request.targetDate !== undefined) patch.target_date = request.targetDate;
  if (request.status !== undefined) patch.status = request.status;

  const { data, error } = await supabase.from("decision_action_items").update(patch).eq("id", actionItemId).select(ACTION_ITEM_SELECT).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This action item could not be found or updated." };
  return { ok: true, data: mapActionItem(data as ActionItemRow) };
}
