import "server-only";

/**
 * The only module that issues a Supabase query for research_sessions /
 * research_evidence / research_conflicts — same pattern as
 * donna-ai/persistence/decisions-repository.ts: takes an
 * already-constructed per-request server client, never a service-role
 * key, so RLS is the real enforcement and this file is a typed,
 * narrow surface over it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResearchEvidence, ResearchEvidenceStatus, ResearchSessionStatus, ResearchTask, StopReason } from "../types";
import type { ProposedSessionConflict } from "../research-orchestrator";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifySupabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You do not have access to research for this decision.";
  }
  return "The request could not be processed.";
}

/** Looks up the organization a decision belongs to — every write
 * below needs it for the denormalized organization_id column, and
 * RLS on `decisions` itself (is_org_member) means this returns null,
 * not another org's row, for a decision outside the caller's access. */
async function getDecisionOrganizationId(supabase: SupabaseClient, decisionId: string): Promise<string | null> {
  const { data } = await supabase.from("decisions").select("organization_id").eq("id", decisionId).maybeSingle();
  return data?.organization_id ?? null;
}

export interface CreateSessionResult {
  id: string;
}

export async function createResearchSession(
  supabase: SupabaseClient,
  decisionId: string,
  tasks: ResearchTask[],
  agentVersion: string,
): Promise<RepositoryResult<CreateSessionResult>> {
  const organizationId = await getDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { ok: false, reason: "Decision not found or not accessible." };

  const { data, error } = await supabase
    .from("research_sessions")
    .insert({
      organization_id: organizationId,
      decision_id: decisionId,
      status: "running",
      tasks_json: tasks,
      agent_version: agentVersion,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  return { ok: true, data: { id: data.id } };
}

export interface CompleteSessionInput {
  status: ResearchSessionStatus;
  sourcesFound: number;
  evidenceProposed: number;
  conflictsFound: number;
  gapsRemaining: unknown;
  stopReason: StopReason | null;
}

export async function completeResearchSession(supabase: SupabaseClient, sessionId: string, input: CompleteSessionInput): Promise<RepositoryResult<void>> {
  const { error } = await supabase
    .from("research_sessions")
    .update({
      status: input.status,
      sources_found: input.sourcesFound,
      evidence_proposed: input.evidenceProposed,
      conflicts_found: input.conflictsFound,
      gaps_remaining: input.gapsRemaining,
      stop_reason: input.stopReason,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  return { ok: true, data: undefined };
}

export interface InsertedEvidence {
  id: string;
}

/** Inserts the session's full proposed-evidence batch and returns the
 * real ids in the SAME order they were given, so the caller can
 * resolve conflict claimAIndex/claimBIndex (array positions) into real
 * evidence ids before inserting research_conflicts. */
export async function insertResearchEvidence(
  supabase: SupabaseClient,
  decisionId: string,
  sessionId: string,
  drafts: Array<Omit<ResearchEvidence, "id">>,
): Promise<RepositoryResult<InsertedEvidence[]>> {
  if (drafts.length === 0) return { ok: true, data: [] };
  const organizationId = await getDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { ok: false, reason: "Decision not found or not accessible." };

  const rows = drafts.map((d) => ({
    organization_id: organizationId,
    research_session_id: sessionId,
    decision_id: decisionId,
    evidence_type: d.type,
    claim: d.claim,
    interpretation: d.interpretation,
    source_url: d.sourceUrl,
    source_title: d.sourceTitle,
    publisher: d.publisher,
    published_at: d.publishedAt,
    retrieved_at: d.retrievedAt,
    criterion_id: d.criterionId,
    option_id: d.optionId,
    confidence: d.confidence,
    freshness: d.freshness,
    research_task_id: d.researchTaskId,
    agent_version: d.agentVersion,
    status: d.status,
    metadata: d.metadata,
  }));

  // Inserted one statement at a time (not a single bulk insert) so the
  // returned ids are unambiguously in the same order as `drafts` even
  // if Postgres does not guarantee insert-order-preserving RETURNING
  // for a multi-row statement.
  const inserted: InsertedEvidence[] = [];
  for (const row of rows) {
    const { data, error } = await supabase.from("research_evidence").insert(row).select("id").single();
    if (error) return { ok: false, reason: classifySupabaseError(error.message) };
    inserted.push({ id: data.id });
  }
  return { ok: true, data: inserted };
}

export async function insertResearchConflicts(
  supabase: SupabaseClient,
  decisionId: string,
  sessionId: string,
  conflicts: ProposedSessionConflict[],
  evidenceIds: string[],
): Promise<RepositoryResult<void>> {
  if (conflicts.length === 0) return { ok: true, data: undefined };
  const organizationId = await getDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { ok: false, reason: "Decision not found or not accessible." };

  const rows = conflicts
    .map((c) => ({
      organization_id: organizationId,
      research_session_id: sessionId,
      decision_id: decisionId,
      claim_a_evidence_id: evidenceIds[c.claimAIndex],
      claim_b_evidence_id: evidenceIds[c.claimBIndex],
      criterion_id: c.criterionId,
      option_id: c.optionId,
      severity: c.severity,
      explanation: c.explanation,
    }))
    .filter((r) => r.claim_a_evidence_id && r.claim_b_evidence_id);

  if (rows.length === 0) return { ok: true, data: undefined };
  const { error } = await supabase.from("research_conflicts").insert(rows);
  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  return { ok: true, data: undefined };
}

export interface ResearchEvidenceRow extends ResearchEvidence {
  researchSessionId: string;
}

/** Every research_evidence row for a decision, across every session —
 * the Evidence Coverage Matrix and Evidence Explorer both read the
 * decision's full set, not one session at a time. */
export async function listResearchEvidenceForDecision(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<ResearchEvidenceRow[]>> {
  const { data, error } = await supabase
    .from("research_evidence")
    .select(
      "id, research_session_id, evidence_type, claim, interpretation, source_url, source_title, publisher, published_at, retrieved_at, criterion_id, option_id, confidence, freshness, research_task_id, agent_version, status, metadata",
    )
    .eq("decision_id", decisionId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };

  const items: ResearchEvidenceRow[] = (data ?? []).map((row) => ({
    id: row.id,
    researchSessionId: row.research_session_id,
    type: row.evidence_type,
    claim: row.claim,
    interpretation: row.interpretation,
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
    publisher: row.publisher,
    publishedAt: row.published_at,
    retrievedAt: row.retrieved_at,
    criterionId: row.criterion_id,
    optionId: row.option_id,
    confidence: row.confidence,
    freshness: row.freshness,
    researchTaskId: row.research_task_id,
    agentVersion: row.agent_version,
    status: row.status,
    metadata: row.metadata,
  }));

  return { ok: true, data: items };
}

export interface OpenConflictRow {
  id: string;
  claimAEvidenceId: string;
  claimBEvidenceId: string;
  criterionId: string | null;
  optionId: string | null;
  severity: "low" | "medium" | "high";
  explanation: string;
  status: "open" | "resolved" | "dismissed";
}

export async function listConflictsForDecision(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<OpenConflictRow[]>> {
  const { data, error } = await supabase
    .from("research_conflicts")
    .select("id, claim_a_evidence_id, claim_b_evidence_id, criterion_id, option_id, severity, explanation, status")
    .eq("decision_id", decisionId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };

  const items: OpenConflictRow[] = (data ?? []).map((row) => ({
    id: row.id,
    claimAEvidenceId: row.claim_a_evidence_id,
    claimBEvidenceId: row.claim_b_evidence_id,
    criterionId: row.criterion_id,
    optionId: row.option_id,
    severity: row.severity,
    explanation: row.explanation,
    status: row.status,
  }));

  return { ok: true, data: items };
}

export interface DecideEvidenceResult {
  id: string;
  status: ResearchEvidenceStatus;
}

/** The only write path that transitions evidence out of "proposed" —
 * calls decide_research_evidence(), which sets decided_by = auth.uid()
 * itself rather than trusting a client-supplied reviewer. */
export async function decideResearchEvidence(supabase: SupabaseClient, evidenceId: string, status: "accepted" | "rejected"): Promise<RepositoryResult<DecideEvidenceResult>> {
  const { data, error } = await supabase.rpc("decide_research_evidence", { p_evidence_id: evidenceId, p_status: status });
  if (error) return { ok: false, reason: classifySupabaseError(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.out_id) return { ok: false, reason: "The evidence could not be updated." };
  return { ok: true, data: { id: row.out_id, status: row.out_status } };
}

export interface ResearchSessionRow {
  id: string;
  decisionId: string;
  status: ResearchSessionStatus;
  tasks: ResearchTask[];
  sourcesFound: number;
  evidenceProposed: number;
  conflictsFound: number;
  gapsRemaining: unknown;
  stopReason: StopReason | null;
  startedAt: string | null;
  completedAt: string | null;
}

export async function getResearchSession(supabase: SupabaseClient, sessionId: string): Promise<RepositoryResult<ResearchSessionRow>> {
  const { data, error } = await supabase
    .from("research_sessions")
    .select("id, decision_id, status, tasks_json, sources_found, evidence_proposed, conflicts_found, gaps_remaining, stop_reason, started_at, completed_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  if (!data) return { ok: false, reason: "Research session not found." };

  return {
    ok: true,
    data: {
      id: data.id,
      decisionId: data.decision_id,
      status: data.status,
      tasks: data.tasks_json,
      sourcesFound: data.sources_found,
      evidenceProposed: data.evidence_proposed,
      conflictsFound: data.conflicts_found,
      gapsRemaining: data.gaps_remaining,
      stopReason: data.stop_reason,
      startedAt: data.started_at,
      completedAt: data.completed_at,
    },
  };
}
