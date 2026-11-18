import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createCommercialAccountRequestSchema } from "../schema";
import { createCommercialAccount, type CommercialAccountSummary } from "../repository";

export interface CreateAccountHandlerResult {
  status: number;
  body: CommercialAccountSummary | { error: string };
}

export async function handleCreateAccountRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<CreateAccountHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial accounts." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = createCommercialAccountRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await createCommercialAccount(supabase, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
