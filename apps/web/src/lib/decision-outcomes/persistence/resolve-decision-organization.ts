import "server-only";

/**
 * Resolves the organization_id a decision_outcomes/business_case_actuals/
 * assumption_validations write must carry, FROM THE DECISION ITSELF —
 * never from "the current user's primary organization" (a user can
 * belong to more than one). RLS on `decisions` (is_org_member) means
 * this read already returns nothing for a decision the caller cannot
 * see, so a null result here covers both "does not exist" and "not
 * yours" — the same deliberately-indistinguishable shape as
 * getDecisionDetail() elsewhere in this codebase.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveDecisionOrganizationId(supabase: SupabaseClient, decisionId: string): Promise<string | null> {
  const { data, error } = await supabase.from("decisions").select("organization_id").eq("id", decisionId).maybeSingle();
  if (error || !data) return null;
  return (data as { organization_id: string }).organization_id;
}
