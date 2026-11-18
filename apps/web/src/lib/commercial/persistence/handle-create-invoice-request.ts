import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createCommercialInvoiceRequestSchema } from "../schema";
import { createCommercialInvoice, type CommercialInvoiceSummary } from "../invoices-repository";

export interface CreateInvoiceHandlerResult {
  status: number;
  body: CommercialInvoiceSummary | { error: string };
}

export async function handleCreateInvoiceRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<CreateInvoiceHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial invoices." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = createCommercialInvoiceRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await createCommercialInvoice(supabase, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
