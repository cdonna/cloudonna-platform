import "server-only";

/**
 * The one boundary any feature must go through to ask "can this
 * organization do X" — never a direct plan-name or price check inside a
 * component. See docs/commercial/01-billing-architecture.md §5.
 *
 * Two flat queries rather than one nested embed: `subscriptions` then,
 * only if a live one exists, `plan_entitlements` for its plan — kept
 * simple and easy to reason about over a single deep join, matching the
 * existing repository style in
 * apps/web/src/components/donna-ai/persistence/decisions-repository.ts.
 * Today the first query always returns null (no organization has a
 * subscriptions row yet), so every call resolves to
 * FOUNDING_TESTER_ENTITLEMENTS — this function is the one place that
 * changes once real subscriptions exist, nothing above it does.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { FOUNDING_TESTER_ENTITLEMENTS } from "./default-entitlements";
import type { BooleanEntitlementKey, Entitlements, IntegerEntitlementKey } from "./types";

const LIVE_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due"] as const;

interface PlanEntitlementRow {
  entitlement_key: string;
  boolean_value: boolean | null;
  integer_value: number | null;
}

export async function getEntitlementsForOrganization(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Entitlements> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("organization_id", organizationId)
    .in("status", LIVE_SUBSCRIPTION_STATUSES)
    .maybeSingle();

  if (!subscription) {
    return FOUNDING_TESTER_ENTITLEMENTS;
  }

  const { data: rows } = await supabase
    .from("plan_entitlements")
    .select("entitlement_key, boolean_value, integer_value")
    .eq("plan_id", subscription.plan_id);

  return applyPlanEntitlements(FOUNDING_TESTER_ENTITLEMENTS, (rows ?? []) as PlanEntitlementRow[]);
}

/** Starts from the Founding Tester bundle and overrides only the keys
 * the plan actually defines a row for — a plan that hasn't set
 * `advanced_governance` yet, say, does not silently grant or deny it,
 * it inherits the same safe default every organization has today. */
function applyPlanEntitlements(base: Entitlements, rows: PlanEntitlementRow[]): Entitlements {
  const resolved = { ...base };

  for (const row of rows) {
    const key = row.entitlement_key as BooleanEntitlementKey | IntegerEntitlementKey;
    if (row.boolean_value !== null) {
      (resolved as Record<string, boolean | number>)[key] = row.boolean_value;
    } else if (row.integer_value !== null) {
      (resolved as Record<string, boolean | number>)[key] = row.integer_value;
    }
  }

  return resolved;
}

export async function hasEntitlement(
  supabase: SupabaseClient,
  organizationId: string,
  key: BooleanEntitlementKey,
): Promise<boolean> {
  const entitlements = await getEntitlementsForOrganization(supabase, organizationId);
  return entitlements[key];
}

export async function getEntitlementLimit(
  supabase: SupabaseClient,
  organizationId: string,
  key: IntegerEntitlementKey,
): Promise<number> {
  const entitlements = await getEntitlementsForOrganization(supabase, organizationId);
  return entitlements[key];
}
