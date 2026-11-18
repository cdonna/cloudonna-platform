import "server-only";

/**
 * Resolves the organization_id a decision_stakeholders/
 * decision_action_items write must carry, FROM THE DECISION ITSELF —
 * never from "the current user's primary organization." RLS on
 * `decisions` means this read already returns nothing for a decision
 * the caller cannot see.
 *
 * A near-identical helper exists at
 * lib/decision-outcomes/persistence/resolve-decision-organization.ts
 * — intentionally duplicated here, not imported, so that no file
 * under components/donna-ai/ ever imports from lib/decision-outcomes/
 * (the commercial-neutrality-firewall test enforces exactly this
 * structural separation).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveDecisionOrganizationId(supabase: SupabaseClient, decisionId: string): Promise<string | null> {
  const { data, error } = await supabase.from("decisions").select("organization_id").eq("id", decisionId).maybeSingle();
  if (error || !data) return null;
  return (data as { organization_id: string }).organization_id;
}
