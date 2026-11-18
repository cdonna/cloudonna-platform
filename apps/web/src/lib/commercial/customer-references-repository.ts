import "server-only";

/** The only module that reads/writes commercial_customer_references
 * (brief §46/§47). Default posture everywhere: PRIVATE, no public
 * use, until a staff member explicitly records otherwise. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpsertCustomerReferenceRequest } from "./schema";
import type { CustomerReferenceStatus } from "./customer-reference-status";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface CustomerReferenceSummary {
  id: string;
  accountId: string;
  referenceStatus: CustomerReferenceStatus;
  allowAnonymousStats: boolean;
  allowPublicReference: boolean;
  allowLogoUse: boolean;
  allowCaseStudy: boolean;
  allowQuote: boolean;
  quoteText: string | null;
  notes: string | null;
  updatedAt: string;
}

const REFERENCE_SELECT =
  "id, account_id, reference_status, allow_anonymous_stats, allow_public_reference, allow_logo_use, allow_case_study, allow_quote, quote_text, notes, updated_at";

interface ReferenceRow {
  id: string;
  account_id: string;
  reference_status: CustomerReferenceStatus;
  allow_anonymous_stats: boolean;
  allow_public_reference: boolean;
  allow_logo_use: boolean;
  allow_case_study: boolean;
  allow_quote: boolean;
  quote_text: string | null;
  notes: string | null;
  updated_at: string;
}

function mapReference(row: ReferenceRow): CustomerReferenceSummary {
  return {
    id: row.id,
    accountId: row.account_id,
    referenceStatus: row.reference_status,
    allowAnonymousStats: row.allow_anonymous_stats,
    allowPublicReference: row.allow_public_reference,
    allowLogoUse: row.allow_logo_use,
    allowCaseStudy: row.allow_case_study,
    allowQuote: row.allow_quote,
    quoteText: row.quote_text,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export async function getCustomerReference(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<CustomerReferenceSummary | null>> {
  const { data, error } = await supabase.from("commercial_customer_references").select(REFERENCE_SELECT).eq("account_id", accountId).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: data ? mapReference(data as ReferenceRow) : null };
}

export async function upsertCustomerReference(supabase: SupabaseClient, request: UpsertCustomerReferenceRequest): Promise<RepositoryResult<CustomerReferenceSummary>> {
  const { data, error } = await supabase
    .from("commercial_customer_references")
    .upsert(
      {
        account_id: request.accountId,
        reference_status: request.referenceStatus ?? "private",
        allow_anonymous_stats: request.allowAnonymousStats ?? false,
        allow_public_reference: request.allowPublicReference ?? false,
        allow_logo_use: request.allowLogoUse ?? false,
        allow_case_study: request.allowCaseStudy ?? false,
        allow_quote: request.allowQuote ?? false,
        quote_text: request.quoteText ?? null,
        notes: request.notes ?? null,
      },
      { onConflict: "account_id" },
    )
    .select(REFERENCE_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapReference(data as ReferenceRow) };
}
