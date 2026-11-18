import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateAssumptionValidationRequestSchema } from "../schema";
import { updateAssumptionValidation, type AssumptionValidationSummary } from "../repository";

export interface UpdateAssumptionValidationHandlerResult {
  status: number;
  body: AssumptionValidationSummary | { error: string };
}

export async function handleUpdateAssumptionValidationRequest(
  assumptionId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<UpdateAssumptionValidationHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to update an assumption." } };

  const parsed = updateAssumptionValidationRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  // RLS (assumption_validations_update, is_org_member) is the real
  // enforcement here — no separate decision-ownership check needed,
  // same posture as updateInquiryStatus()/updateCommercialOpportunity().
  const result = await updateAssumptionValidation(supabase, assumptionId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
