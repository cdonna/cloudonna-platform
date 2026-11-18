import "server-only";

/** The only module that reads/writes decision_sprints and
 * decision_sprint_outcomes (brief §13/§14). */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateDecisionSprintRequest, UpdateDecisionSprintRequest, UpsertDecisionSprintOutcomeRequest } from "./schema";
import type { DecisionSprintStatus } from "./decision-sprint-status";
import { recordCommercialActivity } from "./activities-repository";
import { logCommercialEvent } from "./events";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface DecisionSprintSummary {
  id: string;
  accountId: string;
  accountName: string;
  opportunityId: string | null;
  decisionId: string | null;
  scope: string | null;
  startDate: string | null;
  targetCompletionDate: string | null;
  status: DecisionSprintStatus;
  executiveSponsorContactId: string | null;
  workingTeam: string | null;
  commercialValueChf: number | null;
  outputs: string | null;
  followUpAction: string | null;
  createdAt: string;
  updatedAt: string;
}

const SPRINT_SELECT =
  "id, account_id, opportunity_id, decision_id, scope, start_date, target_completion_date, status, executive_sponsor_contact_id, working_team, " +
  "commercial_value_chf, outputs, follow_up_action, created_at, updated_at, commercial_accounts(name)";

interface SprintRow {
  id: string;
  account_id: string;
  opportunity_id: string | null;
  decision_id: string | null;
  scope: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  status: DecisionSprintStatus;
  executive_sponsor_contact_id: string | null;
  working_team: string | null;
  commercial_value_chf: number | null;
  outputs: string | null;
  follow_up_action: string | null;
  created_at: string;
  updated_at: string;
  commercial_accounts: { name: string } | { name: string }[] | null;
}

function mapSprint(row: SprintRow): DecisionSprintSummary {
  const account = Array.isArray(row.commercial_accounts) ? row.commercial_accounts[0] : row.commercial_accounts;
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: account?.name ?? "Unknown account",
    opportunityId: row.opportunity_id,
    decisionId: row.decision_id,
    scope: row.scope,
    startDate: row.start_date,
    targetCompletionDate: row.target_completion_date,
    status: row.status,
    executiveSponsorContactId: row.executive_sponsor_contact_id,
    workingTeam: row.working_team,
    commercialValueChf: row.commercial_value_chf,
    outputs: row.outputs,
    followUpAction: row.follow_up_action,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDecisionSprints(supabase: SupabaseClient): Promise<RepositoryResult<DecisionSprintSummary[]>> {
  const { data, error } = await supabase.from("decision_sprints").select(SPRINT_SELECT).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as unknown as SprintRow[] | null) ?? []).map(mapSprint) };
}

export async function getDecisionSprint(supabase: SupabaseClient, sprintId: string): Promise<RepositoryResult<DecisionSprintSummary>> {
  const { data, error } = await supabase.from("decision_sprints").select(SPRINT_SELECT).eq("id", sprintId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This Decision Sprint could not be found." };
  return { ok: true, data: mapSprint(data as unknown as SprintRow) };
}

export async function listDecisionSprintsForAccount(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<DecisionSprintSummary[]>> {
  const { data, error } = await supabase.from("decision_sprints").select(SPRINT_SELECT).eq("account_id", accountId).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as unknown as SprintRow[] | null) ?? []).map(mapSprint) };
}

export async function createDecisionSprint(supabase: SupabaseClient, request: CreateDecisionSprintRequest): Promise<RepositoryResult<DecisionSprintSummary>> {
  const { data, error } = await supabase
    .from("decision_sprints")
    .insert({
      account_id: request.accountId,
      opportunity_id: request.opportunityId ?? null,
      decision_id: request.decisionId ?? null,
      scope: request.scope ?? null,
      start_date: request.startDate ?? null,
      target_completion_date: request.targetCompletionDate ?? null,
      status: request.status ?? "scoping",
      executive_sponsor_contact_id: request.executiveSponsorContactId ?? null,
      working_team: request.workingTeam ?? null,
      commercial_value_chf: request.commercialValueChf ?? null,
      outputs: request.outputs ?? null,
      follow_up_action: request.followUpAction ?? null,
    })
    .select(SPRINT_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  const summary = mapSprint(data as unknown as SprintRow);
  await recordCommercialActivity(supabase, { accountId: summary.accountId, activityType: "sprint_created", afterData: { sprintId: summary.id, status: summary.status } });
  return { ok: true, data: summary };
}

const ACTIVE_TRANSITION_STATUSES: DecisionSprintStatus[] = ["active"];

export async function updateDecisionSprint(supabase: SupabaseClient, sprintId: string, request: UpdateDecisionSprintRequest): Promise<RepositoryResult<DecisionSprintSummary>> {
  const existingResult = await getDecisionSprint(supabase, sprintId);
  if (!existingResult.ok) return existingResult;
  const existing = existingResult.data;

  const patch: Record<string, unknown> = {};
  if (request.opportunityId !== undefined) patch.opportunity_id = request.opportunityId;
  if (request.decisionId !== undefined) patch.decision_id = request.decisionId;
  if (request.scope !== undefined) patch.scope = request.scope;
  if (request.startDate !== undefined) patch.start_date = request.startDate;
  if (request.targetCompletionDate !== undefined) patch.target_completion_date = request.targetCompletionDate;
  if (request.status !== undefined) patch.status = request.status;
  if (request.executiveSponsorContactId !== undefined) patch.executive_sponsor_contact_id = request.executiveSponsorContactId;
  if (request.workingTeam !== undefined) patch.working_team = request.workingTeam;
  if (request.commercialValueChf !== undefined) patch.commercial_value_chf = request.commercialValueChf;
  if (request.outputs !== undefined) patch.outputs = request.outputs;
  if (request.followUpAction !== undefined) patch.follow_up_action = request.followUpAction;

  const { data, error } = await supabase.from("decision_sprints").update(patch).eq("id", sprintId).select(SPRINT_SELECT).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This Decision Sprint could not be found or updated." };
  const summary = mapSprint(data as unknown as SprintRow);

  if (request.status !== undefined && request.status !== existing.status) {
    await recordCommercialActivity(supabase, { accountId: summary.accountId, activityType: "sprint_status_changed", beforeData: { status: existing.status }, afterData: { status: summary.status } });
    if (ACTIVE_TRANSITION_STATUSES.includes(request.status)) await logCommercialEvent(supabase, "decision_sprint_started", {});
    if (request.status === "completed") await logCommercialEvent(supabase, "decision_sprint_completed", {});
  }

  return { ok: true, data: summary };
}

// ---------------------------------------------------------------------------
// Sprint outcomes (brief §14)

export interface DecisionSprintOutcomeSummary {
  id: string;
  sprintId: string;
  recommendationDelivered: string | null;
  finalHumanDecision: string | null;
  estimatedDecisionValueChf: number | null;
  businessCaseValueChf: number | null;
  customerAcceptedRecommendation: boolean | null;
  customerSelectedDifferentOption: boolean | null;
  reasons: string | null;
  nextStep: string | null;
  expansionPotential: string | null;
  createdAt: string;
  updatedAt: string;
}

const OUTCOME_SELECT =
  "id, sprint_id, recommendation_delivered, final_human_decision, estimated_decision_value_chf, business_case_value_chf, " +
  "customer_accepted_recommendation, customer_selected_different_option, reasons, next_step, expansion_potential, created_at, updated_at";

interface OutcomeRow {
  id: string;
  sprint_id: string;
  recommendation_delivered: string | null;
  final_human_decision: string | null;
  estimated_decision_value_chf: number | null;
  business_case_value_chf: number | null;
  customer_accepted_recommendation: boolean | null;
  customer_selected_different_option: boolean | null;
  reasons: string | null;
  next_step: string | null;
  expansion_potential: string | null;
  created_at: string;
  updated_at: string;
}

function mapOutcome(row: OutcomeRow): DecisionSprintOutcomeSummary {
  return {
    id: row.id,
    sprintId: row.sprint_id,
    recommendationDelivered: row.recommendation_delivered,
    finalHumanDecision: row.final_human_decision,
    estimatedDecisionValueChf: row.estimated_decision_value_chf,
    businessCaseValueChf: row.business_case_value_chf,
    customerAcceptedRecommendation: row.customer_accepted_recommendation,
    customerSelectedDifferentOption: row.customer_selected_different_option,
    reasons: row.reasons,
    nextStep: row.next_step,
    expansionPotential: row.expansion_potential,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSprintOutcome(supabase: SupabaseClient, sprintId: string): Promise<RepositoryResult<DecisionSprintOutcomeSummary | null>> {
  const { data, error } = await supabase.from("decision_sprint_outcomes").select(OUTCOME_SELECT).eq("sprint_id", sprintId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: data ? mapOutcome(data as unknown as OutcomeRow) : null };
}

export async function upsertSprintOutcome(supabase: SupabaseClient, sprintId: string, request: UpsertDecisionSprintOutcomeRequest): Promise<RepositoryResult<DecisionSprintOutcomeSummary>> {
  const { data, error } = await supabase
    .from("decision_sprint_outcomes")
    .upsert(
      {
        sprint_id: sprintId,
        recommendation_delivered: request.recommendationDelivered ?? null,
        final_human_decision: request.finalHumanDecision ?? null,
        estimated_decision_value_chf: request.estimatedDecisionValueChf ?? null,
        business_case_value_chf: request.businessCaseValueChf ?? null,
        customer_accepted_recommendation: request.customerAcceptedRecommendation ?? null,
        customer_selected_different_option: request.customerSelectedDifferentOption ?? null,
        reasons: request.reasons ?? null,
        next_step: request.nextStep ?? null,
        expansion_potential: request.expansionPotential ?? null,
      },
      { onConflict: "sprint_id" },
    )
    .select(OUTCOME_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapOutcome(data as unknown as OutcomeRow) };
}
