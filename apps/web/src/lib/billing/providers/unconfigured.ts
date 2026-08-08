import type { BillingProvider, CheckoutSessionResult, PortalSessionResult } from "../provider";

/**
 * The only BillingProvider registered anywhere in this codebase today
 * (see config.ts). Throws a clear, typed error rather than silently
 * no-oping — a caller that forgets to check isConfigured() first fails
 * loudly and immediately, never with a confusing downstream Stripe
 * error or, worse, a checkout that appears to start and goes nowhere.
 */
export class UnconfiguredBillingProvider implements BillingProvider {
  readonly providerId = "unconfigured";

  isConfigured(): boolean {
    return false;
  }

  async createCheckoutSession(): Promise<CheckoutSessionResult> {
    throw new Error("Billing is not yet configured for ClouDonna. See docs/commercial/01-billing-architecture.md.");
  }

  async createPortalSession(): Promise<PortalSessionResult> {
    throw new Error("Billing is not yet configured for ClouDonna. See docs/commercial/01-billing-architecture.md.");
  }
}
