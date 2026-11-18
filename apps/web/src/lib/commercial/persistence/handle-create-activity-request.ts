import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createCommercialActivityRequestSchema } from "../schema";
import { recordCommercialActivity, type CommercialActivitySummary } from "../activities-repository";

export interface CreateActivityHandlerResult {
  status: number;
  body: CommercialActivitySummary | { error: string };
}

export async function handleCreateActivityRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<CreateActivityHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to record a commercial activity." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = createCommercialActivityRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await recordCommercialActivity(supabase, {
    opportunityId: parsed.data.opportunityId,
    accountId: parsed.data.accountId,
    activityType: parsed.data.activityType,
    note: parsed.data.note,
  });
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
