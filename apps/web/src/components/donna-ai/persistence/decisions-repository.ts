import "server-only";

/**
 * The only module that issues a Supabase query for decisions/
 * decision_versions. Takes an already-constructed per-request server
 * client (never constructs its own, never touches a service-role key) —
 * every call runs as the real authenticated user, so RLS is the actual
 * enforcement, this file is just a typed, narrow surface over it. See
 * docs/sprint-6/18-persistence-schema.md.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveDecisionRequest } from "./save-decision-schema";
import type { AppendDecisionVersionRequest } from "./append-decision-version-schema";
import type { DeterministicDecisionOutput } from "../intelligence/types";

export interface SaveDecisionResult {
  id: string;
  humanReadableId: string;
}

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

/** Every failure is normalized to one of these fixed, safe-to-display
 * reasons — never the raw Postgres/PostgREST error message, which can
 * include table/column names or constraint details not meant for a
 * client. See docs/sprint-6/21-security-review.md, "Safe error
 * messages." */
function classifySupabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You do not have access to save decisions in this project.";
  }
  if (lower.includes("duplicate key")) {
    return "This decision could not be saved due to a conflicting record. Please try again.";
  }
  return "The decision could not be saved.";
}

export async function saveDecision(
  supabase: SupabaseClient,
  request: SaveDecisionRequest,
  deterministicOutput: DeterministicDecisionOutput,
  versions: { schemaVersion: string; scoringEngineVersion: string; knowledgeBaseVersion: string },
): Promise<RepositoryResult<SaveDecisionResult>> {
  const { data, error } = await supabase.rpc("save_decision", {
    p_organization_id: request.organizationId,
    p_workspace_id: request.workspaceId,
    p_project_id: request.projectId,
    p_title: request.title,
    p_decision_input: request.decisionInput,
    p_deterministic_output: deterministicOutput,
    p_enrichment: request.enrichment,
    p_provider_metadata: request.provider,
    p_fallback_metadata: request.fallback,
    p_evidence_references: request.enrichment?.evidenceReferences ?? [],
    p_schema_version: versions.schemaVersion,
    p_scoring_engine_version: versions.scoringEngineVersion,
    p_knowledge_base_version: versions.knowledgeBaseVersion,
    p_change_reason: request.changeReason ?? null,
  });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.out_id || !row?.out_human_readable_id) {
    return { ok: false, reason: "The decision could not be saved." };
  }

  return { ok: true, data: { id: row.out_id, humanReadableId: row.out_human_readable_id } };
}

export interface AppendVersionResult {
  id: string;
  versionNumber: number;
}

/** Creates decision_versions row N+1 for an already-existing decision
 * (Sprint 6.2, Slice C) — the only other write path alongside
 * saveDecision() above. Calls append_decision_version(), which is
 * concurrency-safe by locking the parent decisions row before computing
 * the next version_number (see that migration's own comment) — this
 * function does not need to retry or handle a version-number conflict
 * itself, the RPC already serializes concurrent appends to the same
 * decision. */
export async function appendDecisionVersion(
  supabase: SupabaseClient,
  decisionId: string,
  request: AppendDecisionVersionRequest,
  deterministicOutput: DeterministicDecisionOutput,
  versions: { schemaVersion: string; scoringEngineVersion: string; knowledgeBaseVersion: string },
): Promise<RepositoryResult<AppendVersionResult>> {
  const { data, error } = await supabase.rpc("append_decision_version", {
    p_decision_id: decisionId,
    p_decision_input: request.decisionInput,
    p_deterministic_output: deterministicOutput,
    p_enrichment: request.enrichment,
    p_provider_metadata: request.provider,
    p_fallback_metadata: request.fallback,
    p_evidence_references: request.enrichment?.evidenceReferences ?? [],
    p_schema_version: versions.schemaVersion,
    p_scoring_engine_version: versions.scoringEngineVersion,
    p_knowledge_base_version: versions.knowledgeBaseVersion,
    p_change_reason: request.changeReason,
  });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.out_version_id || row?.out_version_number == null) {
    return { ok: false, reason: "The new version could not be saved." };
  }

  return { ok: true, data: { id: row.out_version_id, versionNumber: row.out_version_number } };
}

export interface DecisionListItem {
  id: string;
  humanReadableId: string;
  title: string;
  status: string;
  projectId: string;
  projectName: string;
  workspaceName: string;
  currentVersionNumber: number | null;
  createdAt: string;
}

/** Lists decisions visible to the calling user via RLS — no explicit
 * organization_id filter is applied here beyond what RLS already
 * enforces; a user with access to multiple organizations sees decisions
 * across all of them, exactly as `is_org_member()` already scopes every
 * other list in this schema. */
export async function listDecisionsForCurrentUser(supabase: SupabaseClient): Promise<RepositoryResult<DecisionListItem[]>> {
  const { data, error } = await supabase
    .from("decisions")
    .select(
      "id, human_readable_id, title, status, created_at, project_id, projects(name), workspaces:workspace_id(name), decision_versions:current_version_id(version_number)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const items: DecisionListItem[] = (data ?? []).map((row) => {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    const currentVersion = Array.isArray(row.decision_versions) ? row.decision_versions[0] : row.decision_versions;
    return {
      id: row.id,
      humanReadableId: row.human_readable_id,
      title: row.title,
      status: row.status,
      projectId: row.project_id,
      projectName: project?.name ?? "Unknown project",
      workspaceName: workspace?.name ?? "Unknown workspace",
      currentVersionNumber: currentVersion?.version_number ?? null,
      createdAt: row.created_at,
    };
  });

  return { ok: true, data: items };
}

export interface DecisionVersionContent {
  versionNumber: number;
  decisionInput: unknown;
  deterministicOutput: DeterministicDecisionOutput;
  enrichment: unknown;
  provider: unknown;
  fallback: unknown;
  evidenceReferences: unknown;
  schemaVersion: string;
  scoringEngineVersion: string;
  knowledgeBaseVersion: string;
  generatedAt: string;
  createdBy: string;
  createdByEmail: string | null;
  createdAt: string;
  changeReason: string | null;
}

export interface DecisionDetail {
  id: string;
  humanReadableId: string;
  title: string;
  status: string;
  createdAt: string;
  version: DecisionVersionContent;
}

/** Fetches one decision plus its CURRENT version's full content. RLS
 * alone determines visibility — a request for a decision outside the
 * caller's organizations returns no row (PostgREST's standard behavior
 * for a filtered-to-zero-rows RLS result), which this function surfaces
 * as `ok: false` with a generic reason, identical in shape to a
 * not-found — never a distinct "you're not allowed" response that would
 * confirm the id's existence to an unauthorized caller. */
export async function getDecisionDetail(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<DecisionDetail>> {
  const { data, error } = await supabase
    .from("decisions")
    .select(
      "id, human_readable_id, title, status, created_at, decision_versions:current_version_id(version_number, decision_input_json, deterministic_output_json, validated_enrichment_json, provider_metadata_json, fallback_metadata_json, evidence_references_json, schema_version, scoring_engine_version, knowledge_base_version, generated_at, created_by, created_at, change_reason)",
    )
    .eq("id", decisionId)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }
  if (!data) {
    return { ok: false, reason: "Decision not found." };
  }

  const version = Array.isArray(data.decision_versions) ? data.decision_versions[0] : data.decision_versions;
  if (!version) {
    return { ok: false, reason: "Decision not found." };
  }

  const createdByEmail = await lookupCreatorEmail(supabase, version.created_by);

  return {
    ok: true,
    data: {
      id: data.id,
      humanReadableId: data.human_readable_id,
      title: data.title,
      status: data.status,
      createdAt: data.created_at,
      version: toVersionContent(version, createdByEmail),
    },
  };
}

/** A separate, simple lookup rather than an embedded join — avoids
 * depending on PostgREST's auto-detected foreign-key relationship name
 * matching between decision_versions and profiles, which is not worth
 * the fragility for a display-only field. */
async function lookupCreatorEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

interface RawVersionRow {
  version_number: number;
  decision_input_json: unknown;
  deterministic_output_json: unknown;
  validated_enrichment_json: unknown;
  provider_metadata_json: unknown;
  fallback_metadata_json: unknown;
  evidence_references_json: unknown;
  schema_version: string;
  scoring_engine_version: string;
  knowledge_base_version: string;
  generated_at: string;
  created_by: string;
  created_at: string;
  change_reason: string | null;
}

function toVersionContent(row: RawVersionRow, createdByEmail: string | null): DecisionVersionContent {
  return {
    versionNumber: row.version_number,
    decisionInput: row.decision_input_json,
    deterministicOutput: row.deterministic_output_json as DeterministicDecisionOutput,
    enrichment: row.validated_enrichment_json,
    provider: row.provider_metadata_json,
    fallback: row.fallback_metadata_json,
    evidenceReferences: row.evidence_references_json,
    schemaVersion: row.schema_version,
    scoringEngineVersion: row.scoring_engine_version,
    knowledgeBaseVersion: row.knowledge_base_version,
    generatedAt: row.generated_at,
    createdBy: row.created_by,
    createdByEmail,
    createdAt: row.created_at,
    changeReason: row.change_reason,
  };
}

export interface DecisionVersionSummary {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdByEmail: string | null;
  changeReason: string | null;
  donnaScore: number;
  recommendedPlatformName: string;
}

/** Powers the Immutable Decision Timeline (Sprint 6.2) — every version
 * ever saved for one decision, oldest first. RLS-scoped exactly like
 * every other read in this module (`is_org_member(organization_id)` on
 * `decision_versions`) — a decisionId outside the caller's organizations
 * yields an empty list, not an error, the same "no distinct not-allowed
 * signal" posture as getDecisionDetail. */
export async function listDecisionVersions(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<DecisionVersionSummary[]>> {
  const { data, error } = await supabase
    .from("decision_versions")
    .select("id, version_number, created_at, created_by, change_reason, deterministic_output_json")
    .eq("decision_id", decisionId)
    .order("version_number", { ascending: true });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const creatorIds = Array.from(new Set((data ?? []).map((row) => row.created_by)));
  const emailByCreator = await lookupCreatorEmails(supabase, creatorIds);

  const items: DecisionVersionSummary[] = (data ?? []).map((row) => {
    const output = row.deterministic_output_json as DeterministicDecisionOutput;
    return {
      id: row.id,
      versionNumber: row.version_number,
      createdAt: row.created_at,
      createdByEmail: emailByCreator.get(row.created_by) ?? null,
      changeReason: row.change_reason,
      donnaScore: output.donnaScore,
      recommendedPlatformName: `${output.recommendation.platform.vendor} ${output.recommendation.platform.productName}`,
    };
  });

  return { ok: true, data: items };
}

/** Batched to one query regardless of how many distinct authors a
 * decision's version history has — avoids an N+1 lookup on the
 * timeline's own list query. */
async function lookupCreatorEmails(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, email").in("id", userIds);
  return new Map((data ?? []).map((row) => [row.id as string, row.email as string]));
}

/** Fetches ONE specific historical version's full content by its
 * human-facing version number — powers historical version viewing
 * (Sprint 6.2, Slice A): reconstructs exactly the original input,
 * deterministic output, enrichment, provider metadata, and fallback
 * metadata stored for that version, nothing recomputed. Not "replay" —
 * real Decision Replay re-executes the deterministic engine, which
 * nothing calling this function does. Scoped to decisionId as well as
 * version_number (not just the version row's own id) so a request can
 * never resolve a version belonging to a different decision even within
 * the same organization — belt-and-suspenders alongside the
 * decisions_check_current_version_match DB trigger, which guards
 * current_version_id specifically, not an arbitrary read like this
 * one. */
export async function getDecisionVersionByNumber(
  supabase: SupabaseClient,
  decisionId: string,
  versionNumber: number,
): Promise<RepositoryResult<DecisionVersionContent>> {
  const { data, error } = await supabase
    .from("decision_versions")
    .select(
      "version_number, decision_input_json, deterministic_output_json, validated_enrichment_json, provider_metadata_json, fallback_metadata_json, evidence_references_json, schema_version, scoring_engine_version, knowledge_base_version, generated_at, created_by, created_at, change_reason",
    )
    .eq("decision_id", decisionId)
    .eq("version_number", versionNumber)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }
  if (!data) {
    return { ok: false, reason: "Version not found." };
  }

  const createdByEmail = await lookupCreatorEmail(supabase, data.created_by);
  return { ok: true, data: toVersionContent(data, createdByEmail) };
}

export interface UserProjectOption {
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
}

/** Powers the Save Decision dialog's organization/workspace/project
 * picker. Every row returned is already RLS-scoped to organizations the
 * caller belongs to. */
export async function listSaveTargetsForCurrentUser(supabase: SupabaseClient): Promise<RepositoryResult<UserProjectOption[]>> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, organization_id, workspace_id, organizations(name), workspaces(name)")
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const options: UserProjectOption[] = (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    return {
      organizationId: row.organization_id,
      organizationName: org?.name ?? "Organization",
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name ?? "Workspace",
      projectId: row.id,
      projectName: row.name,
    };
  });

  return { ok: true, data: options };
}
