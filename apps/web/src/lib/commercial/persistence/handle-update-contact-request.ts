import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateCommercialContactRequestSchema } from "../schema";
import { updateCommercialContact, type CommercialContactSummary } from "../contacts-repository";

export interface UpdateContactHandlerResult {
  status: number;
  body: CommercialContactSummary | { error: string };
}

export async function handleUpdateContactRequest(contactId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpdateContactHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial contacts." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = updateCommercialContactRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await updateCommercialContact(supabase, contactId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
