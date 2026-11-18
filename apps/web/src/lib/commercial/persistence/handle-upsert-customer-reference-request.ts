import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertCustomerReferenceRequestSchema } from "../schema";
import { upsertCustomerReference, type CustomerReferenceSummary } from "../customer-references-repository";

export interface UpsertCustomerReferenceHandlerResult {
  status: number;
  body: CustomerReferenceSummary | { error: string };
}

export async function handleUpsertCustomerReferenceRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpsertCustomerReferenceHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage customer reference permissions." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = upsertCustomerReferenceRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await upsertCustomerReference(supabase, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
