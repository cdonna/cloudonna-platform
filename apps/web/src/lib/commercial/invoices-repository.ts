import "server-only";

/** The only module that reads/writes commercial_invoices (brief §12). */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateCommercialInvoiceRequest, UpdateCommercialInvoiceRequest } from "./schema";
import type { CommercialCurrency } from "./contract-economics";
import type { PaymentStatus } from "./payment-status";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface CommercialInvoiceSummary {
  id: string;
  contractId: string;
  invoiceAmount: number;
  currency: CommercialCurrency;
  invoiceDate: string | null;
  dueDate: string | null;
  paidAmount: number;
  paidDate: string | null;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const INVOICE_SELECT = "id, contract_id, invoice_amount, currency, invoice_date, due_date, paid_amount, paid_date, payment_status, notes, created_at, updated_at";

interface InvoiceRow {
  id: string;
  contract_id: string;
  invoice_amount: number;
  currency: CommercialCurrency;
  invoice_date: string | null;
  due_date: string | null;
  paid_amount: number;
  paid_date: string | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapInvoice(row: InvoiceRow): CommercialInvoiceSummary {
  return {
    id: row.id,
    contractId: row.contract_id,
    invoiceAmount: row.invoice_amount,
    currency: row.currency,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    paidAmount: row.paid_amount,
    paidDate: row.paid_date,
    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCommercialInvoice(supabase: SupabaseClient, request: CreateCommercialInvoiceRequest): Promise<RepositoryResult<CommercialInvoiceSummary>> {
  const { data, error } = await supabase
    .from("commercial_invoices")
    .insert({
      contract_id: request.contractId,
      invoice_amount: request.invoiceAmount,
      currency: request.currency ?? "CHF",
      invoice_date: request.invoiceDate ?? null,
      due_date: request.dueDate ?? null,
      payment_status: "invoiced",
      notes: request.notes ?? null,
    })
    .select(INVOICE_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapInvoice(data as InvoiceRow) };
}

/** Resolves payment_status deterministically from paidAmount vs.
 * invoiceAmount whenever paidAmount changes and the caller does not
 * explicitly override the status (e.g. to OVERDUE) — never left to
 * silently drift out of sync with the real paid amount. */
export async function updateCommercialInvoice(supabase: SupabaseClient, invoiceId: string, request: UpdateCommercialInvoiceRequest): Promise<RepositoryResult<CommercialInvoiceSummary>> {
  const { data: existing, error: fetchError } = await supabase.from("commercial_invoices").select(INVOICE_SELECT).eq("id", invoiceId).maybeSingle();
  if (fetchError) return { ok: false, reason: classifyError(fetchError.message) };
  if (!existing) return { ok: false, reason: "This invoice could not be found." };
  const existingRow = existing as InvoiceRow;

  const patch: Record<string, unknown> = {};
  if (request.dueDate !== undefined) patch.due_date = request.dueDate;
  if (request.notes !== undefined) patch.notes = request.notes;

  if (request.paidAmount !== undefined) {
    patch.paid_amount = request.paidAmount;
    if (request.paidDate !== undefined) patch.paid_date = request.paidDate;
    else if (request.paidAmount > 0 && !existingRow.paid_date) patch.paid_date = new Date().toISOString().slice(0, 10);

    if (request.paymentStatus === undefined) {
      patch.payment_status = request.paidAmount <= 0 ? "invoiced" : request.paidAmount >= existingRow.invoice_amount ? "paid" : "partially_paid";
    }
  }
  if (request.paymentStatus !== undefined) patch.payment_status = request.paymentStatus;
  if (request.paidDate !== undefined && request.paidAmount === undefined) patch.paid_date = request.paidDate;

  const { data, error } = await supabase.from("commercial_invoices").update(patch).eq("id", invoiceId).select(INVOICE_SELECT).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This invoice could not be found or updated." };
  return { ok: true, data: mapInvoice(data as InvoiceRow) };
}

export async function listInvoicesForContract(supabase: SupabaseClient, contractId: string): Promise<RepositoryResult<CommercialInvoiceSummary[]>> {
  const { data, error } = await supabase.from("commercial_invoices").select(INVOICE_SELECT).eq("contract_id", contractId).order("invoice_date", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as InvoiceRow[] | null) ?? []).map(mapInvoice) };
}

export async function listAllInvoices(supabase: SupabaseClient): Promise<RepositoryResult<CommercialInvoiceSummary[]>> {
  const { data, error } = await supabase.from("commercial_invoices").select(INVOICE_SELECT);
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as InvoiceRow[] | null) ?? []).map(mapInvoice) };
}
