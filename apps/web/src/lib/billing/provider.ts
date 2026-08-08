/**
 * The seam every future checkout/portal route must go through — no
 * route or component may import a payment SDK directly. Same shape as
 * the existing AI IntelligenceProvider boundary and the
 * VisitorIntelligenceProvider recommended in
 * docs/growth/01-b2b-visitor-intelligence-evaluation.md: one interface,
 * swappable concrete adapters, a safe unconfigured default. See
 * docs/commercial/01-billing-architecture.md §7 for why no concrete
 * Stripe adapter exists yet.
 */
export interface CheckoutSessionRequest {
  organizationId: string;
  planCode: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
}

export interface PortalSessionRequest {
  organizationId: string;
  returnUrl: string;
}

export interface PortalSessionResult {
  portalUrl: string;
}

export interface BillingProvider {
  readonly providerId: string;
  isConfigured(): boolean;
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResult>;
  createPortalSession(request: PortalSessionRequest): Promise<PortalSessionResult>;
}
