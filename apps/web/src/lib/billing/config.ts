import "server-only";

import type { BillingProvider } from "./provider";
import { UnconfiguredBillingProvider } from "./providers/unconfigured";

/**
 * Every future checkout/portal Server Action or Route Handler calls
 * this instead of constructing a provider itself. Returns the
 * unconfigured stub unconditionally today — no concrete adapter is
 * registered yet (docs/commercial/01-billing-architecture.md §7), so
 * there is nothing to select between. Once a Stripe adapter exists,
 * this is the one function that gains an env-driven switch — nothing
 * that calls getBillingProvider() needs to change.
 */
export function getBillingProvider(): BillingProvider {
  return new UnconfiguredBillingProvider();
}
