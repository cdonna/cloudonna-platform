import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertCommercialContractRequestSchema } from "../schema";
import { upsertContractForOpportunity, type CommercialContractSummary } from "../contracts-repository";
import { getCommercialOpportunity } from "../repository";

export interface UpsertContractHandlerResult {
  status: number;
  body: CommercialContractSummary | { error: string };
}

export async function handleUpsertContractRequest(opportunityId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpsertContractHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial contracts." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = upsertCommercialContractRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const opportunityResult = await getCommercialOpportunity(supabase, opportunityId);
  if (!opportunityResult.ok) return { status: 404, body: { error: opportunityResult.reason } };

  const result = await upsertContractForOpportunity(supabase, opportunityId, parsed.data, opportunityResult.data.planningValueChf);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
