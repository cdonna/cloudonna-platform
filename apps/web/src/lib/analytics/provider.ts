/**
 * The seam any future analytics/visitor-intelligence integration must
 * go through — no component may import a Google Analytics, Plausible,
 * PostHog, Clarity, or visitor-intelligence SDK directly. Same shape as
 * BillingProvider and NotificationProvider. No concrete adapter is
 * registered yet (see config.ts) — this interface exists so the seam
 * is real and typed, not so tracking is active.
 *
 * Deliberately event-only, never identity-bearing: nothing in this
 * interface accepts an authenticated user id, org id, or any
 * Decision Intelligence data. Marketing analytics and product data stay
 * structurally separated, per
 * docs/growth/01-b2b-visitor-intelligence-evaluation.md §9.
 */
export interface PageViewEvent {
  path: string;
  referrer?: string;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export interface AnalyticsProvider {
  readonly providerId: string;
  isConfigured(): boolean;
  trackPageView(event: PageViewEvent): void;
  trackEvent(event: AnalyticsEvent): void;
}
