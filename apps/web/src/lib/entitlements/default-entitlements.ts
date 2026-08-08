import type { Entitlements } from "./types";

/**
 * What every organization gets today — there is no other bundle in
 * production, because no organization can have a `subscriptions` row
 * yet (nothing creates one; see docs/commercial/01-billing-architecture.md
 * §12). This is the honest current state of the entitlement system, not
 * a placeholder: Founding Tester access stays unpaywalled regardless of
 * anything in the future billing system, per the explicit instruction
 * not to put a payment wall in front of it.
 *
 * decision_replay is false unconditionally, independent of any future
 * plan — the underlying capability (re-executing the deterministic
 * engine against historical input) has not been built yet (Sprint 6.2
 * Slice E/F). An entitlement can only ever grant permission for a
 * capability that exists.
 */
export const FOUNDING_TESTER_ENTITLEMENTS: Entitlements = {
  decision_memory: true,
  decision_replay: false,
  evidence_intelligence: true,
  executive_reports: false,
  api_access: false,
  advanced_governance: false,
  max_users: 5,
  max_workspaces: 3,
  max_decisions_per_month: 50,
};
