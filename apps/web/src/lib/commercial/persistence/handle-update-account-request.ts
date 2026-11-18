import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateCommercialAccountRequestSchema } from "../schema";
import { updateCommercialAccount, type CommercialAccountSummary } from "../repository";

export interface UpdateAccountHandlerResult {
  status: number;
  body: CommercialAccountSummary | { error: string };
}

export async function handleUpdateAccountRequest(accountId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpdateAccountHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial accounts." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = updateCommercialAccountRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await updateCommercialAccount(supabase, accountId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
