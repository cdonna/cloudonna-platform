import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateStakeholderRequestSchema } from "../schema";
import { updateStakeholder, type DecisionStakeholder } from "../stakeholders-repository";

export interface UpdateStakeholderHandlerResult {
  status: number;
  body: DecisionStakeholder | { error: string };
}

export async function handleUpdateStakeholderRequest(stakeholderId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpdateStakeholderHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to update a stakeholder." } };

  const parsed = updateStakeholderRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  // RLS (decision_stakeholders_update, is_org_member) is the real
  // enforcement — same posture as updateAssumptionValidation().
  const result = await updateStakeholder(supabase, stakeholderId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
