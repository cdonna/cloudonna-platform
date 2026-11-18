import "server-only";

/** The only module that reads/writes decision_stakeholders (brief
 * §36-38). Tenant-scoped (is_org_member()), same posture as
 * decisions/decision_versions — RLS is the real enforcement. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateStakeholderRequest, UpdateStakeholderRequest } from "./schema";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to this decision.";
  return "The request could not be processed.";
}

export type AlignmentStatus = "not_reviewed" | "aligned" | "conditional" | "objected" | "approved";

export interface DecisionStakeholder {
  id: string;
  decisionId: string;
  name: string;
  role: string | null;
  email: string | null;
  alignmentStatus: AlignmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STAKEHOLDER_SELECT = "id, decision_id, name, role, email, alignment_status, notes, created_at, updated_at";

interface StakeholderRow {
  id: string;
  decision_id: string;
  name: string;
  role: string | null;
  email: string | null;
  alignment_status: AlignmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapStakeholder(row: StakeholderRow): DecisionStakeholder {
  return {
    id: row.id,
    decisionId: row.decision_id,
    name: row.name,
    role: row.role,
    email: row.email,
    alignmentStatus: row.alignment_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStakeholdersForDecision(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<DecisionStakeholder[]>> {
  const { data, error } = await supabase.from("decision_stakeholders").select(STAKEHOLDER_SELECT).eq("decision_id", decisionId).order("created_at");
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as StakeholderRow[] | null) ?? []).map(mapStakeholder) };
}

export async function createStakeholder(
  supabase: SupabaseClient,
  decisionId: string,
  organizationId: string,
  request: CreateStakeholderRequest,
): Promise<RepositoryResult<DecisionStakeholder>> {
  const { data, error } = await supabase
    .from("decision_stakeholders")
    .insert({
      decision_id: decisionId,
      organization_id: organizationId,
      name: request.name,
      role: request.role ?? null,
      email: request.email ?? null,
      alignment_status: request.alignmentStatus ?? "not_reviewed",
      notes: request.notes ?? null,
    })
    .select(STAKEHOLDER_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapStakeholder(data as StakeholderRow) };
}

export async function updateStakeholder(supabase: SupabaseClient, stakeholderId: string, request: UpdateStakeholderRequest): Promise<RepositoryResult<DecisionStakeholder>> {
  const patch: Record<string, unknown> = {};
  if (request.role !== undefined) patch.role = request.role;
  if (request.alignmentStatus !== undefined) patch.alignment_status = request.alignmentStatus;
  if (request.notes !== undefined) patch.notes = request.notes;

  const { data, error } = await supabase.from("decision_stakeholders").update(patch).eq("id", stakeholderId).select(STAKEHOLDER_SELECT).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This stakeholder could not be found or updated." };
  return { ok: true, data: mapStakeholder(data as StakeholderRow) };
}
