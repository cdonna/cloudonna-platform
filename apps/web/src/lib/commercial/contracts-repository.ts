import "server-only";

/**
 * The only module that reads/writes commercial_contracts (brief §8/§9).
 * computed_bookings_chf/computed_arr_chf/computed_tcv_chf are always
 * recomputed here, from contract-economics.ts, on every write — never
 * hand-edited, never left stale.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpsertCommercialContractRequest } from "./schema";
import { computeContractEconomics, type CommercialBillingFrequency, type CommercialContractStatus, type CommercialCurrency } from "./contract-economics";
import { recordCommercialActivity } from "./activities-repository";
import { logCommercialEvent } from "./events";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface CommercialContractSummary {
  id: string;
  opportunityId: string;
  contractStart: string | null;
  contractEnd: string | null;
  termMonths: number | null;
  billingFrequency: CommercialBillingFrequency;
  oneTimeFee: number;
  servicesFee: number;
  recurringAnnualFee: number;
  discountPercent: number;
  currency: CommercialCurrency;
  autoRenewal: boolean;
  paymentTerms: string | null;
  contractStatus: CommercialContractStatus;
  computedBookingsChf: number | null;
  computedArrChf: number | null;
  computedTcvChf: number | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CONTRACT_SELECT =
  "id, opportunity_id, contract_start, contract_end, term_months, billing_frequency, one_time_fee, services_fee, recurring_annual_fee, " +
  "discount_percent, currency, auto_renewal, payment_terms, contract_status, computed_bookings_chf, computed_arr_chf, computed_tcv_chf, " +
  "signed_at, created_at, updated_at";

interface ContractRow {
  id: string;
  opportunity_id: string;
  contract_start: string | null;
  contract_end: string | null;
  term_months: number | null;
  billing_frequency: CommercialBillingFrequency;
  one_time_fee: number;
  services_fee: number;
  recurring_annual_fee: number;
  discount_percent: number;
  currency: CommercialCurrency;
  auto_renewal: boolean;
  payment_terms: string | null;
  contract_status: CommercialContractStatus;
  computed_bookings_chf: number | null;
  computed_arr_chf: number | null;
  computed_tcv_chf: number | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapContract(row: ContractRow): CommercialContractSummary {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    contractStart: row.contract_start,
    contractEnd: row.contract_end,
    termMonths: row.term_months,
    billingFrequency: row.billing_frequency,
    oneTimeFee: row.one_time_fee,
    servicesFee: row.services_fee,
    recurringAnnualFee: row.recurring_annual_fee,
    discountPercent: row.discount_percent,
    currency: row.currency,
    autoRenewal: row.auto_renewal,
    paymentTerms: row.payment_terms,
    contractStatus: row.contract_status,
    computedBookingsChf: row.computed_bookings_chf,
    computedArrChf: row.computed_arr_chf,
    computedTcvChf: row.computed_tcv_chf,
    signedAt: row.signed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getContractForOpportunity(supabase: SupabaseClient, opportunityId: string): Promise<RepositoryResult<CommercialContractSummary | null>> {
  const { data, error } = await supabase.from("commercial_contracts").select(CONTRACT_SELECT).eq("opportunity_id", opportunityId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: data ? mapContract(data as unknown as ContractRow) : null };
}

export async function listAllContracts(supabase: SupabaseClient): Promise<RepositoryResult<CommercialContractSummary[]>> {
  const { data, error } = await supabase.from("commercial_contracts").select(CONTRACT_SELECT);
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as unknown as ContractRow[] | null) ?? []).map(mapContract) };
}

/** Create-or-update, keyed by opportunity_id (brief §8: one contract
 * per opportunity). `planningValueChf` is read from the parent
 * opportunity by the caller (handle-upsert-contract-request.ts) —
 * this module never queries commercial_opportunities itself, to keep
 * the two repositories independent. */
export async function upsertContractForOpportunity(
  supabase: SupabaseClient,
  opportunityId: string,
  request: UpsertCommercialContractRequest,
  planningValueChf: number | null,
): Promise<RepositoryResult<CommercialContractSummary>> {
  const existingResult = await getContractForOpportunity(supabase, opportunityId);
  if (!existingResult.ok) return existingResult;
  const existing = existingResult.data;

  const oneTimeFee = request.oneTimeFee ?? existing?.oneTimeFee ?? 0;
  const servicesFee = request.servicesFee ?? existing?.servicesFee ?? 0;
  const recurringAnnualFee = request.recurringAnnualFee ?? existing?.recurringAnnualFee ?? 0;
  const discountPercent = request.discountPercent ?? existing?.discountPercent ?? 0;
  const currency = request.currency ?? existing?.currency ?? "CHF";
  const contractStatus = request.contractStatus ?? existing?.contractStatus ?? "draft";
  const termMonths = request.termMonths !== undefined ? request.termMonths : existing?.termMonths ?? null;
  const contractStart = request.contractStart !== undefined ? request.contractStart : existing?.contractStart ?? null;
  const contractEnd = request.contractEnd !== undefined ? request.contractEnd : existing?.contractEnd ?? null;

  const economics = computeContractEconomics({ oneTimeFee, servicesFee, recurringAnnualFee, discountPercent, currency, contractStatus, termMonths, contractStart, contractEnd }, planningValueChf);
  const previousSignedAt = existing?.signedAt ?? null;

  const row = {
    opportunity_id: opportunityId,
    contract_start: contractStart,
    contract_end: contractEnd,
    term_months: termMonths,
    billing_frequency: request.billingFrequency ?? existing?.billingFrequency ?? "annual",
    one_time_fee: oneTimeFee,
    services_fee: servicesFee,
    recurring_annual_fee: recurringAnnualFee,
    discount_percent: discountPercent,
    currency,
    auto_renewal: request.autoRenewal ?? existing?.autoRenewal ?? false,
    payment_terms: request.paymentTerms !== undefined ? request.paymentTerms : existing?.paymentTerms ?? null,
    contract_status: contractStatus,
    computed_bookings_chf: economics.bookingsChf,
    computed_arr_chf: economics.arrChf,
    computed_tcv_chf: economics.tcvChf,
    signed_at: previousSignedAt === null && contractStatus === "signed" ? new Date().toISOString() : previousSignedAt,
  };

  const { data, error } = await supabase.from("commercial_contracts").upsert(row, { onConflict: "opportunity_id" }).select(CONTRACT_SELECT).single();
  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  const summary = mapContract(data as unknown as ContractRow);

  if (existing?.contractStatus !== "signed" && summary.contractStatus === "signed") {
    await recordCommercialActivity(supabase, { opportunityId, activityType: "contract_signed", afterData: { tcvChf: summary.computedTcvChf, currency: summary.currency } });
    await logCommercialEvent(supabase, "opportunity_won", { event: "contract_signed" });
  }

  return { ok: true, data: summary };
}
