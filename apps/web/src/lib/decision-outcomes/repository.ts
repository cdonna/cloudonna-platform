import "server-only";

/**
 * The only module that reads/writes decision_outcomes,
 * business_case_actuals, and assumption_validations (brief §32-36).
 * Tenant-scoped (is_org_member()) — structurally separate from
 * lib/commercial/ (ClouDonna's own staff-only sales data). This is
 * the CUSTOMER's own private decision outcome data; nothing here is
 * ever read by lib/commercial/ or by anything under
 * components/donna-ai/'s scoring path, and nothing here is ever
 * copied into global Vendor Intelligence automatically (brief §36) —
 * see docs/capabilities/revenue-operations.md.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpsertBusinessCaseActualsRequest, UpsertDecisionOutcomeRequest, CreateAssumptionValidationRequest, UpdateAssumptionValidationRequest } from "./schema";
import type { AssumptionValidationStatus } from "./assumption-validation-status";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to this decision.";
  return "The request could not be processed.";
}

// ---------------------------------------------------------------------------
// Decision outcomes

export interface DecisionOutcomeSummary {
  id: string;
  decisionId: string;
  recommendation: string | null;
  finalDecision: string | null;
  implementationStarted: boolean;
  realizedOutcomeKnown: boolean;
  businessCaseVariancePercent: number | null;
  customerFeedback: string | null;
  updatedAt: string;
}

const OUTCOME_SELECT =
  "id, decision_id, recommendation, final_decision, implementation_started, realized_outcome_known, business_case_variance_percent, customer_feedback, updated_at";

interface OutcomeRow {
  id: string;
  decision_id: string;
  recommendation: string | null;
  final_decision: string | null;
  implementation_started: boolean;
  realized_outcome_known: boolean;
  business_case_variance_percent: number | null;
  customer_feedback: string | null;
  updated_at: string;
}

function mapOutcome(row: OutcomeRow): DecisionOutcomeSummary {
  return {
    id: row.id,
    decisionId: row.decision_id,
    recommendation: row.recommendation,
    finalDecision: row.final_decision,
    implementationStarted: row.implementation_started,
    realizedOutcomeKnown: row.realized_outcome_known,
    businessCaseVariancePercent: row.business_case_variance_percent,
    customerFeedback: row.customer_feedback,
    updatedAt: row.updated_at,
  };
}

export async function getDecisionOutcome(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<DecisionOutcomeSummary | null>> {
  const { data, error } = await supabase.from("decision_outcomes").select(OUTCOME_SELECT).eq("decision_id", decisionId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: data ? mapOutcome(data as OutcomeRow) : null };
}

export async function upsertDecisionOutcome(
  supabase: SupabaseClient,
  decisionId: string,
  organizationId: string,
  request: UpsertDecisionOutcomeRequest,
): Promise<RepositoryResult<DecisionOutcomeSummary>> {
  const { data, error } = await supabase
    .from("decision_outcomes")
    .upsert(
      {
        decision_id: decisionId,
        organization_id: organizationId,
        recommendation: request.recommendation ?? null,
        final_decision: request.finalDecision ?? null,
        implementation_started: request.implementationStarted ?? false,
        realized_outcome_known: request.realizedOutcomeKnown ?? false,
        business_case_variance_percent: request.businessCaseVariancePercent ?? null,
        customer_feedback: request.customerFeedback ?? null,
      },
      { onConflict: "decision_id" },
    )
    .select(OUTCOME_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapOutcome(data as OutcomeRow) };
}

// ---------------------------------------------------------------------------
// Business case actuals (brief §33)

export interface BusinessCaseActualsSummary {
  id: string;
  decisionId: string;
  currency: string;
  estimatedCost: number | null;
  actualCost: number | null;
  estimatedBenefit: number | null;
  actualBenefit: number | null;
  notes: string | null;
  updatedAt: string;
}

const ACTUALS_SELECT = "id, decision_id, currency, estimated_cost, actual_cost, estimated_benefit, actual_benefit, notes, updated_at";

interface ActualsRow {
  id: string;
  decision_id: string;
  currency: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  estimated_benefit: number | null;
  actual_benefit: number | null;
  notes: string | null;
  updated_at: string;
}

function mapActuals(row: ActualsRow): BusinessCaseActualsSummary {
  return {
    id: row.id,
    decisionId: row.decision_id,
    currency: row.currency,
    estimatedCost: row.estimated_cost,
    actualCost: row.actual_cost,
    estimatedBenefit: row.estimated_benefit,
    actualBenefit: row.actual_benefit,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export async function getBusinessCaseActuals(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<BusinessCaseActualsSummary | null>> {
  const { data, error } = await supabase.from("business_case_actuals").select(ACTUALS_SELECT).eq("decision_id", decisionId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: data ? mapActuals(data as ActualsRow) : null };
}

export async function upsertBusinessCaseActuals(
  supabase: SupabaseClient,
  decisionId: string,
  organizationId: string,
  request: UpsertBusinessCaseActualsRequest,
): Promise<RepositoryResult<BusinessCaseActualsSummary>> {
  const { data, error } = await supabase
    .from("business_case_actuals")
    .upsert(
      {
        decision_id: decisionId,
        organization_id: organizationId,
        currency: request.currency ?? "CHF",
        estimated_cost: request.estimatedCost ?? null,
        actual_cost: request.actualCost ?? null,
        estimated_benefit: request.estimatedBenefit ?? null,
        actual_benefit: request.actualBenefit ?? null,
        notes: request.notes ?? null,
      },
      { onConflict: "decision_id" },
    )
    .select(ACTUALS_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapActuals(data as ActualsRow) };
}

// ---------------------------------------------------------------------------
// Assumption validations (brief §34) — many rows per decision.

export interface AssumptionValidationSummary {
  id: string;
  decisionId: string;
  assumptionText: string;
  validationStatus: AssumptionValidationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

const ASSUMPTION_SELECT = "id, decision_id, assumption_text, validation_status, note, created_at, updated_at";

interface AssumptionRow {
  id: string;
  decision_id: string;
  assumption_text: string;
  validation_status: AssumptionValidationStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function mapAssumption(row: AssumptionRow): AssumptionValidationSummary {
  return {
    id: row.id,
    decisionId: row.decision_id,
    assumptionText: row.assumption_text,
    validationStatus: row.validation_status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAssumptionValidations(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<AssumptionValidationSummary[]>> {
  const { data, error } = await supabase.from("assumption_validations").select(ASSUMPTION_SELECT).eq("decision_id", decisionId).order("created_at");
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as AssumptionRow[] | null) ?? []).map(mapAssumption) };
}

export async function createAssumptionValidation(
  supabase: SupabaseClient,
  decisionId: string,
  organizationId: string,
  request: CreateAssumptionValidationRequest,
): Promise<RepositoryResult<AssumptionValidationSummary>> {
  const { data, error } = await supabase
    .from("assumption_validations")
    .insert({
      decision_id: decisionId,
      organization_id: organizationId,
      assumption_text: request.assumptionText,
      validation_status: request.validationStatus ?? "unknown",
      note: request.note ?? null,
    })
    .select(ASSUMPTION_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapAssumption(data as AssumptionRow) };
}

export async function updateAssumptionValidation(
  supabase: SupabaseClient,
  assumptionId: string,
  request: UpdateAssumptionValidationRequest,
): Promise<RepositoryResult<AssumptionValidationSummary>> {
  const { data, error } = await supabase
    .from("assumption_validations")
    .update({ validation_status: request.validationStatus, note: request.note ?? null })
    .eq("id", assumptionId)
    .select(ASSUMPTION_SELECT)
    .maybeSingle();

  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This assumption could not be found or updated." };
  return { ok: true, data: mapAssumption(data as AssumptionRow) };
}
