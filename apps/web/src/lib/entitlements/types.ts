/**
 * The fixed vocabulary of capability checks any feature in the product
 * is allowed to make — matches entitlement_definitions in
 * supabase/migrations/20260808140000_billing_foundation.sql exactly.
 * Adding a new capability gate means adding a key here AND a row in
 * that table, never checking a plan name or price directly. See
 * docs/commercial/01-billing-architecture.md §5.
 */
export type BooleanEntitlementKey =
  | "decision_memory"
  | "decision_replay"
  | "evidence_intelligence"
  | "executive_reports"
  | "api_access"
  | "advanced_governance";

export type IntegerEntitlementKey = "max_users" | "max_workspaces" | "max_decisions_per_month";

export type EntitlementKey = BooleanEntitlementKey | IntegerEntitlementKey;

export type Entitlements = Record<BooleanEntitlementKey, boolean> & Record<IntegerEntitlementKey, number>;
