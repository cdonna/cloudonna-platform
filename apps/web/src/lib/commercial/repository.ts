import "server-only";

/**
 * The only module that reads/writes commercial_accounts/
 * commercial_opportunities. Same convention as every other repository
 * in this codebase: takes an already-constructed per-request server
 * client, RLS (is_platform_staff()) is the real enforcement — a
 * non-staff caller sees/changes nothing, not because this file checks
 * a role, but because Postgres does.
 *
 * Every opportunity stage change is additionally logged to
 * commercial_activities (brief §54's auditability requirement) and,
 * for the handful of named funnel milestones, to business_events
 * (brief §51) — both are fire-and-forget; neither failure ever rolls
 * back the real mutation.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateCommercialAccountRequest,
  CreateCommercialOpportunityRequest,
  UpdateCommercialAccountRequest,
  UpdateCommercialOpportunityRequest,
} from "./schema";
import type { OpportunityStage } from "./opportunity-stages";
import type { CommercialPackageId } from "./packages";
import type { AccountStatus } from "./account-status";
import type { ForecastCategory } from "./forecast";
import type { LostReason, WonReason } from "./lost-won-reasons";
import type { CommercialCurrency } from "./contract-economics";
import { recordCommercialActivity } from "./activities-repository";
import { logCommercialEvent } from "./events";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You do not have access to commercial data.";
  }
  return "The request could not be processed.";
}

// ---------------------------------------------------------------------------
// Accounts

export interface CommercialAccountSummary {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  companySize: string | null;
  source: string | null;
  icpFit: boolean | null;
  status: AccountStatus;
  owner: string | null;
  notes: string | null;
  organizationId: string | null;
  createdAt: string;
}

const ACCOUNT_SELECT = "id, name, website, industry, country, company_size, source, icp_fit, status, owner, notes, organization_id, created_at";

interface AccountRow {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  company_size: string | null;
  source: string | null;
  icp_fit: boolean | null;
  status: AccountStatus;
  owner: string | null;
  notes: string | null;
  organization_id: string | null;
  created_at: string;
}

function mapAccount(row: AccountRow): CommercialAccountSummary {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    industry: row.industry,
    country: row.country,
    companySize: row.company_size,
    source: row.source,
    icpFit: row.icp_fit,
    status: row.status,
    owner: row.owner,
    notes: row.notes,
    organizationId: row.organization_id,
    createdAt: row.created_at,
  };
}

export async function createCommercialAccount(supabase: SupabaseClient, request: CreateCommercialAccountRequest): Promise<RepositoryResult<CommercialAccountSummary>> {
  const { data, error } = await supabase
    .from("commercial_accounts")
    .insert({
      name: request.name,
      website: request.website ?? null,
      industry: request.industry ?? null,
      country: request.country ?? null,
      company_size: request.companySize ?? null,
      source: request.source ?? null,
      icp_fit: request.icpFit ?? null,
      owner: request.owner ?? null,
      notes: request.notes ?? null,
    })
    .select(ACCOUNT_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapAccount(data as AccountRow) };
}

export async function updateCommercialAccount(supabase: SupabaseClient, accountId: string, request: UpdateCommercialAccountRequest): Promise<RepositoryResult<CommercialAccountSummary>> {
  const patch: Record<string, unknown> = {};
  if (request.website !== undefined) patch.website = request.website;
  if (request.industry !== undefined) patch.industry = request.industry;
  if (request.country !== undefined) patch.country = request.country;
  if (request.companySize !== undefined) patch.company_size = request.companySize;
  if (request.source !== undefined) patch.source = request.source;
  if (request.icpFit !== undefined) patch.icp_fit = request.icpFit;
  if (request.status !== undefined) patch.status = request.status;
  if (request.owner !== undefined) patch.owner = request.owner;
  if (request.notes !== undefined) patch.notes = request.notes;

  const { data, error } = await supabase.from("commercial_accounts").update(patch).eq("id", accountId).select(ACCOUNT_SELECT).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This account could not be found or updated." };

  if (request.status !== undefined) {
    await recordCommercialActivity(supabase, { accountId, activityType: "status_changed", afterData: { status: request.status } });
  }

  return { ok: true, data: mapAccount(data as AccountRow) };
}

export async function listCommercialAccounts(supabase: SupabaseClient): Promise<RepositoryResult<CommercialAccountSummary[]>> {
  const { data, error } = await supabase.from("commercial_accounts").select(ACCOUNT_SELECT).order("name");
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as AccountRow[] | null) ?? []).map(mapAccount) };
}

export async function getCommercialAccount(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<CommercialAccountSummary>> {
  const { data, error } = await supabase.from("commercial_accounts").select(ACCOUNT_SELECT).eq("id", accountId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This account could not be found." };
  return { ok: true, data: mapAccount(data as AccountRow) };
}

// ---------------------------------------------------------------------------
// Opportunities

export interface CommercialOpportunitySummary {
  id: string;
  accountId: string;
  accountName: string;
  primaryContactId: string | null;
  inquiryId: string | null;
  decisionId: string | null;
  decisionTitle: string | null;
  decisionDeadline: string | null;
  linkedDecisionTitle: string | null;
  commercialPackage: CommercialPackageId;
  stage: OpportunityStage;
  useCase: string | null;
  decisionValueChf: number | null;
  expectedAcvChf: number | null;
  expectedTcvChf: number | null;
  expectedBookingsChf: number | null;
  expectedArrChf: number | null;
  probabilityPercent: number | null;
  forecastCategory: ForecastCategory | null;
  currency: CommercialCurrency;
  planningValueChf: number | null;
  source: string | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  targetCloseDate: string | null;
  lostReason: LostReason | null;
  lostReasonNote: string | null;
  wonReason: WonReason | null;
  wonReasonNote: string | null;
  closedAt: string | null;
  stageChangedAt: string;
  createdAt: string;
  updatedAt: string;
}

const OPPORTUNITY_SELECT =
  "id, account_id, primary_contact_id, inquiry_id, decision_id, decision_title, decision_deadline, commercial_package, stage, use_case, " +
  "decision_value_chf, expected_acv_chf, expected_tcv_chf, expected_bookings_chf, expected_arr_chf, probability_percent, forecast_category, " +
  "currency, planning_value_chf, source, next_action, next_action_due_at, target_close_date, lost_reason, lost_reason_note, won_reason, won_reason_note, " +
  "closed_at, stage_changed_at, created_at, updated_at, commercial_accounts(name), decisions(title)";

interface OpportunityRow {
  id: string;
  account_id: string;
  primary_contact_id: string | null;
  inquiry_id: string | null;
  decision_id: string | null;
  decision_title: string | null;
  decision_deadline: string | null;
  commercial_package: CommercialPackageId;
  stage: OpportunityStage;
  use_case: string | null;
  decision_value_chf: number | null;
  expected_acv_chf: number | null;
  expected_tcv_chf: number | null;
  expected_bookings_chf: number | null;
  expected_arr_chf: number | null;
  probability_percent: number | null;
  forecast_category: ForecastCategory | null;
  currency: CommercialCurrency;
  planning_value_chf: number | null;
  source: string | null;
  next_action: string | null;
  next_action_due_at: string | null;
  target_close_date: string | null;
  lost_reason: LostReason | null;
  lost_reason_note: string | null;
  won_reason: WonReason | null;
  won_reason_note: string | null;
  closed_at: string | null;
  stage_changed_at: string;
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
    decisionTitle: row.decision_title,
    decisionDeadline: row.decision_deadline,
    linkedDecisionTitle: decision?.title ?? null,
    commercialPackage: row.commercial_package,
    stage: row.stage,
    useCase: row.use_case,
    decisionValueChf: row.decision_value_chf,
    expectedAcvChf: row.expected_acv_chf,
    expectedTcvChf: row.expected_tcv_chf,
    expectedBookingsChf: row.expected_bookings_chf,
    expectedArrChf: row.expected_arr_chf,
    probabilityPercent: row.probability_percent,
    forecastCategory: row.forecast_category,
    currency: row.currency,
    planningValueChf: row.planning_value_chf,
    source: row.source,
    nextAction: row.next_action,
    nextActionDueAt: row.next_action_due_at,
    targetCloseDate: row.target_close_date,
    lostReason: row.lost_reason,
    lostReasonNote: row.lost_reason_note,
    wonReason: row.won_reason,
    wonReasonNote: row.won_reason_note,
    closedAt: row.closed_at,
    stageChangedAt: row.stage_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCommercialOpportunities(supabase: SupabaseClient): Promise<RepositoryResult<CommercialOpportunitySummary[]>> {
  const { data, error } = await supabase.from("commercial_opportunities").select(OPPORTUNITY_SELECT).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as unknown as OpportunityRow[] | null) ?? []).map(mapOpportunity) };
}

export async function getCommercialOpportunity(supabase: SupabaseClient, opportunityId: string): Promise<RepositoryResult<CommercialOpportunitySummary>> {
  const { data, error } = await supabase.from("commercial_opportunities").select(OPPORTUNITY_SELECT).eq("id", opportunityId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This opportunity could not be found." };
  return { ok: true, data: mapOpportunity(data as unknown as OpportunityRow) };
}

export async function listCommercialOpportunitiesForAccount(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<CommercialOpportunitySummary[]>> {
  const { data, error } = await supabase.from("commercial_opportunities").select(OPPORTUNITY_SELECT).eq("account_id", accountId).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as unknown as OpportunityRow[] | null) ?? []).map(mapOpportunity) };
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
      decision_title: request.decisionTitle ?? null,
      decision_deadline: request.decisionDeadline ?? null,
      decision_value_chf: request.decisionValueChf ?? null,
      expected_acv_chf: request.expectedAcvChf ?? null,
      expected_tcv_chf: request.expectedTcvChf ?? null,
      expected_bookings_chf: request.expectedBookingsChf ?? null,
      expected_arr_chf: request.expectedArrChf ?? null,
      probability_percent: request.probabilityPercent ?? null,
      forecast_category: request.forecastCategory ?? null,
      currency: request.currency ?? "CHF",
      planning_value_chf: request.planningValueChf ?? null,
      source: request.source ?? null,
      next_action: request.nextAction ?? null,
      next_action_due_at: request.nextActionDueAt ?? null,
      target_close_date: request.targetCloseDate ?? null,
      notes: request.notes ?? null,
    })
    .select(OPPORTUNITY_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  const summary = mapOpportunity(data as unknown as OpportunityRow);

  await recordCommercialActivity(supabase, { opportunityId: summary.id, accountId: summary.accountId, activityType: "opportunity_created", afterData: { stage: summary.stage, commercialPackage: summary.commercialPackage } });
  await logCommercialEvent(supabase, "opportunity_created", { commercialPackage: summary.commercialPackage });

  return { ok: true, data: summary };
}

const WON_LOST_STAGES: OpportunityStage[] = ["closed_won", "closed_lost"];

export async function updateCommercialOpportunity(
  supabase: SupabaseClient,
  opportunityId: string,
  request: UpdateCommercialOpportunityRequest,
): Promise<RepositoryResult<CommercialOpportunitySummary>> {
  const existingResult = await getCommercialOpportunity(supabase, opportunityId);
  if (!existingResult.ok) return existingResult;
  const existing = existingResult.data;

  const patch: Record<string, unknown> = {};
  if (request.stage !== undefined) patch.stage = request.stage;
  if (request.primaryContactId !== undefined) patch.primary_contact_id = request.primaryContactId;
  if (request.useCase !== undefined) patch.use_case = request.useCase;
  if (request.decisionTitle !== undefined) patch.decision_title = request.decisionTitle;
  if (request.decisionDeadline !== undefined) patch.decision_deadline = request.decisionDeadline;
  if (request.decisionValueChf !== undefined) patch.decision_value_chf = request.decisionValueChf;
  if (request.expectedBookingsChf !== undefined) patch.expected_bookings_chf = request.expectedBookingsChf;
  if (request.expectedArrChf !== undefined) patch.expected_arr_chf = request.expectedArrChf;
  if (request.expectedAcvChf !== undefined) patch.expected_acv_chf = request.expectedAcvChf;
  if (request.expectedTcvChf !== undefined) patch.expected_tcv_chf = request.expectedTcvChf;
  if (request.probabilityPercent !== undefined) patch.probability_percent = request.probabilityPercent;
  if (request.forecastCategory !== undefined) patch.forecast_category = request.forecastCategory;
  if (request.currency !== undefined) patch.currency = request.currency;
  if (request.planningValueChf !== undefined) patch.planning_value_chf = request.planningValueChf;
  if (request.nextAction !== undefined) patch.next_action = request.nextAction;
  if (request.nextActionDueAt !== undefined) patch.next_action_due_at = request.nextActionDueAt;
  if (request.targetCloseDate !== undefined) patch.target_close_date = request.targetCloseDate;
  if (request.decisionId !== undefined) patch.decision_id = request.decisionId;
  if (request.notes !== undefined) patch.notes = request.notes;

  const stageChanged = request.stage !== undefined && request.stage !== existing.stage;
  if (stageChanged) {
    patch.stage_changed_at = new Date().toISOString();
    if (WON_LOST_STAGES.includes(request.stage as OpportunityStage)) {
      patch.closed_at = new Date().toISOString();
    }
  }
  if (request.stage === "closed_lost") {
    if (request.lostReason !== undefined) patch.lost_reason = request.lostReason;
    if (request.lostReasonNote !== undefined) patch.lost_reason_note = request.lostReasonNote;
  }
  if (request.stage === "closed_won") {
    if (request.wonReason !== undefined) patch.won_reason = request.wonReason;
    if (request.wonReasonNote !== undefined) patch.won_reason_note = request.wonReasonNote;
  }

  const { data, error } = await supabase.from("commercial_opportunities").update(patch).eq("id", opportunityId).select(OPPORTUNITY_SELECT).maybeSingle();

  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This opportunity could not be found or updated." };
  const summary = mapOpportunity(data as unknown as OpportunityRow);

  if (stageChanged) {
    await recordCommercialActivity(supabase, {
      opportunityId: summary.id,
      accountId: summary.accountId,
      activityType: "stage_changed",
      beforeData: { stage: existing.stage },
      afterData: { stage: summary.stage },
    });
    if (summary.stage === "closed_won") await logCommercialEvent(supabase, "opportunity_won", { commercialPackage: summary.commercialPackage });
  }

  return { ok: true, data: summary };
}
