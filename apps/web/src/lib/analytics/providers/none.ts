import type { AnalyticsEvent, AnalyticsProvider, PageViewEvent } from "../provider";

/**
 * The only AnalyticsProvider registered today. No-ops rather than
 * throwing — unlike billing/notifications, a missing analytics
 * provider should never be a hard failure anywhere it's called from
 * (a tracking call failing must never break the page it's on).
 */
export class NoneAnalyticsProvider implements AnalyticsProvider {
  readonly providerId = "none";

  isConfigured(): boolean {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackPageView(event: PageViewEvent): void {
    // No-op — no provider configured.
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackEvent(event: AnalyticsEvent): void {
    // No-op — no provider configured.
  }
}
