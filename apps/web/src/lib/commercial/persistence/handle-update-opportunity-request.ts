import "server-only";

/** Framework-independent handler behind PATCH /api/commercial/opportunities/[id]. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateCommercialOpportunityRequestSchema } from "../schema";
import { updateCommercialOpportunity, type CommercialOpportunitySummary } from "../repository";

export interface UpdateOpportunityHandlerResult {
  status: number;
  body: CommercialOpportunitySummary | { error: string };
}

export async function handleUpdateOpportunityRequest(
  opportunityId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<UpdateOpportunityHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial opportunities." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = updateCommercialOpportunityRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await updateCommercialOpportunity(supabase, opportunityId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
