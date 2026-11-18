import "server-only";

/**
 * The only module that reads/writes commercial_accounts/
 * commercial_contacts/commercial_opportunities. Same convention as
 * every other repository in this codebase: takes an already-
 * constructed per-request server client, RLS (is_platform_staff()) is
 * the real enforcement — a non-staff caller sees/changes nothing, not
 * because this file checks a role, but because Postgres does.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateCommercialAccountRequest, CreateCommercialOpportunityRequest, UpdateCommercialOpportunityRequest } from "./schema";
import type { OpportunityStage } from "./opportunity-stages";
import type { CommercialPackageId } from "./packages";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You do not have access to commercial data.";
  }
  return "The request could not be processed.";
}

export interface CommercialAccountSummary {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  organizationId: string | null;
}

export async function createCommercialAccount(supabase: SupabaseClient, request: CreateCommercialAccountRequest): Promise<RepositoryResult<CommercialAccountSummary>> {
  const { data, error } = await supabase
    .from("commercial_accounts")
    .insert({ name: request.name, website: request.website ?? null, industry: request.industry ?? null, notes: request.notes ?? null })
    .select("id, name, website, industry, organization_id")
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: { id: data.id, name: data.name, website: data.website, industry: data.industry, organizationId: data.organization_id } };
}

export async function listCommercialAccounts(supabase: SupabaseClient): Promise<RepositoryResult<CommercialAccountSummary[]>> {
  const { data, error } = await supabase.from("commercial_accounts").select("id, name, website, industry, organization_id").order("name");
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: (data ?? []).map((r) => ({ id: r.id, name: r.name, website: r.website, industry: r.industry, organizationId: r.organization_id })) };
}

export interface CommercialOpportunitySummary {
  id: string;
  accountId: string;
  accountName: string;
  primaryContactId: string | null;
  inquiryId: string | null;
  decisionId: string | null;
  decisionTitle: string | null;
  commercialPackage: CommercialPackageId;
  stage: OpportunityStage;
  useCase: string | null;
  decisionValueChf: number | null;
  expectedAcvChf: number | null;
  expectedTcvChf: number | null;
  probabilityPercent: number | null;
  source: string | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  targetCloseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const OPPORTUNITY_SELECT =
  "id, account_id, primary_contact_id, inquiry_id, decision_id, commercial_package, stage, use_case, decision_value_chf, expected_acv_chf, expected_tcv_chf, probability_percent, source, next_action, next_action_due_at, target_close_date, created_at, updated_at, commercial_accounts(name), decisions(title)";

interface OpportunityRow {
  id: string;
  account_id: string;
  primary_contact_id: string | null;
  inquiry_id: string | null;
  decision_id: string | null;
  commercial_package: CommercialPackageId;
  stage: OpportunityStage;
  use_case: string | null;
  decision_value_chf: number | null;
  expected_acv_chf: number | null;
  expected_tcv_chf: number | null;
  probability_percent: number | null;
  source: string | null;
  next_action: string | null;
  next_action_due_at: string | null;
  target_close_date: string | null;
  created_at: string;
  updated_at: string;
  commercial_accounts: { name: string } | { name: string }[] | null;
  decisions: { title: string } | { title: string }[] | null;
}

function mapOpportunity(row: OpportunityRow): CommercialOpportunitySummary {
  const account = Array.isArray(row.commercial_accounts) ? row.commercial_accounts[0] : row.commercial_accounts;
  const decision = Array.isArray(row.decisions) ? row.decisions[0] : row.decisions;
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: account?.name ?? "Unknown account",
    primaryContactId: row.primary_contact_id,
    inquiryId: row.inquiry_id,
    decisionId: row.decision_id,
    decisionTitle: decision?.title ?? null,
    commercialPackage: row.commercial_package,
    stage: row.stage,
    useCase: row.use_case,
    decisionValueChf: row.decision_value_chf,
    expectedAcvChf: row.expected_acv_chf,
    expectedTcvChf: row.expected_tcv_chf,
    probabilityPercent: row.probability_percent,
    source: row.source,
    nextAction: row.next_action,
    nextActionDueAt: row.next_action_due_at,
    targetCloseDate: row.target_close_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCommercialOpportunities(supabase: SupabaseClient): Promise<RepositoryResult<CommercialOpportunitySummary[]>> {
  const { data, error } = await supabase.from("commercial_opportunities").select(OPPORTUNITY_SELECT).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as OpportunityRow[] | null) ?? []).map(mapOpportunity) };
}

export async function createCommercialOpportunity(
  supabase: SupabaseClient,
  request: CreateCommercialOpportunityRequest,
): Promise<RepositoryResult<CommercialOpportunitySummary>> {
  const { data, error } = await supabase
    .from("commercial_opportunities")
    .insert({
      account_id: request.accountId,
      primary_contact_id: request.primaryContactId ?? null,
      inquiry_id: request.inquiryId ?? null,
      decision_id: request.decisionId ?? null,
      commercial_package: request.commercialPackage,
      stage: request.stage ?? "inquiry",
      use_case: request.useCase ?? null,
      decision_value_chf: request.decisionValueChf ?? null,
      expected_acv_chf: request.expectedAcvChf ?? null,
      expected_tcv_chf: request.expectedTcvChf ?? null,
      probability_percent: request.probabilityPercent ?? null,
      source: request.source ?? null,
      next_action: request.nextAction ?? null,
      next_action_due_at: request.nextActionDueAt ?? null,
      target_close_date: request.targetCloseDate ?? null,
    })
    .select(OPPORTUNITY_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapOpportunity(data as OpportunityRow) };
}

export async function updateCommercialOpportunity(
  supabase: SupabaseClient,
  opportunityId: string,
  request: UpdateCommercialOpportunityRequest,
): Promise<RepositoryResult<CommercialOpportunitySummary>> {
  const patch: Record<string, unknown> = {};
  if (request.stage !== undefined) patch.stage = request.stage;
  if (request.useCase !== undefined) patch.use_case = request.useCase;
  if (request.decisionValueChf !== undefined) patch.decision_value_chf = request.decisionValueChf;
  if (request.expectedAcvChf !== undefined) patch.expected_acv_chf = request.expectedAcvChf;
  if (request.expectedTcvChf !== undefined) patch.expected_tcv_chf = request.expectedTcvChf;
  if (request.probabilityPercent !== undefined) patch.probability_percent = request.probabilityPercent;
  if (request.nextAction !== undefined) patch.next_action = request.nextAction;
  if (request.nextActionDueAt !== undefined) patch.next_action_due_at = request.nextActionDueAt;
  if (request.targetCloseDate !== undefined) patch.target_close_date = request.targetCloseDate;
  if (request.decisionId !== undefined) patch.decision_id = request.decisionId;
  if (request.notes !== undefined) patch.notes = request.notes;

  const { data, error } = await supabase.from("commercial_opportunities").update(patch).eq("id", opportunityId).select(OPPORTUNITY_SELECT).maybeSingle();

  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This opportunity could not be found or updated." };
  return { ok: true, data: mapOpportunity(data as OpportunityRow) };
}
