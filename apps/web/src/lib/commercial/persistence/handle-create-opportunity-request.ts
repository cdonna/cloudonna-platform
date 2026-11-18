import "server-only";

/**
 * Framework-independent handler behind POST /api/commercial/opportunities.
 * Platform-staff only, checked explicitly (not left to surface as a
 * confusing empty/silent failure if RLS alone rejected the insert) —
 * same discipline as handle-vendor-refresh-request.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCommercialOpportunityRequestSchema } from "../schema";
import { createCommercialOpportunity, type CommercialOpportunitySummary } from "../repository";

export interface CreateOpportunityHandlerResult {
  status: number;
  body: CommercialOpportunitySummary | { error: string };
}

export async function handleCreateOpportunityRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<CreateOpportunityHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage commercial opportunities." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = createCommercialOpportunityRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await createCommercialOpportunity(supabase, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
