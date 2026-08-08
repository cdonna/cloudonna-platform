import "server-only";

/**
 * The only module that reads organization/subscription context for the
 * billing settings surface. Takes an already-constructed per-request
 * server client, same convention as decisions-repository.ts — every
 * call runs as the real authenticated user, RLS is the actual
 * enforcement.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CurrentOrganization {
  organizationId: string;
  organizationName: string;
  role: string;
}

/** Takes the caller's first organization membership. Sprint 6.1's
 * bootstrap trigger (handle_new_auth_user) gives every new user exactly
 * one personal organization as owner, and self-service creation of a
 * SECOND organization is explicitly out of scope for this codebase so
 * far — so "first" and "only" are the same thing for every real user
 * today. Revisit this the same day multi-organization membership ships;
 * nothing else about the billing settings page needs to change, only
 * how its one organization is chosen. */
export async function getPrimaryOrganizationForCurrentUser(supabase: SupabaseClient): Promise<CurrentOrganization | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name)")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;

  return {
    organizationId: data.organization_id,
    organizationName: organization?.name ?? "Organization",
    role: data.role,
  };
}

export interface BillingSummary {
  planDisplayName: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Null `status` means "no live subscription" — today's only real
 * state, since nothing in this codebase creates a subscriptions row
 * yet (docs/commercial/01-billing-architecture.md §12). The billing
 * settings page renders that as Founding Tester access, never as an
 * error or an empty state. */
export async function getBillingSummaryForOrganization(supabase: SupabaseClient, organizationId: string): Promise<BillingSummary> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end, plans(display_name)")
    .eq("organization_id", organizationId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();

  if (!data) {
    return { planDisplayName: "Founding Tester", status: null, currentPeriodEnd: null, cancelAtPeriodEnd: false };
  }

  const plan = Array.isArray(data.plans) ? data.plans[0] : data.plans;

  return {
    planDisplayName: plan?.display_name ?? "Unknown plan",
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}
