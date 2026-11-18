import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateCommercialInvoiceRequestSchema } from "../schema";
import { updateCommercialInvoice, type CommercialInvoiceSummary } from "../invoices-repository";

export interface UpdateInvoiceHandlerResult {
  status: number;
  body: CommercialInvoiceSummary | { error: string };
}

export async function handleUpdateInvoiceRequest(invoiceId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpdateInvoiceHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial invoices." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = updateCommercialInvoiceRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await updateCommercialInvoice(supabase, invoiceId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
