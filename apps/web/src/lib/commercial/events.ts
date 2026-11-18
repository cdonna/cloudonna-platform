import "server-only";

/**
 * Server-side funnel event logging (brief §51) — writes to the same
 * first-party `business_events` table the public website already
 * uses (apps/web/src/lib/analytics/providers/first-party.ts), from
 * inside a repository function after a real staff mutation succeeds.
 * Never a client-side call, never third-party. A logging failure is
 * swallowed (never allowed to fail the mutation it is describing) —
 * same discipline as every analytics provider in this codebase.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type CommercialEventName =
  | "inquiry_qualified"
  | "opportunity_created"
  | "proposal_sent"
  | "opportunity_won"
  | "decision_sprint_started"
  | "decision_sprint_completed"
  | "team_conversion"
  | "enterprise_expansion";

export async function logCommercialEvent(supabase: SupabaseClient, eventName: CommercialEventName, properties: Record<string, unknown> = {}): Promise<void> {
  try {
    await supabase.from("business_events").insert({ event_name: eventName, source_page: null, properties });
  } catch {
    // A tracking failure must never surface to the caller.
  }
}
