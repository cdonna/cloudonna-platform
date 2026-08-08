import type { AnalyticsProvider } from "./provider";
import { NoneAnalyticsProvider } from "./providers/none";

/**
 * Returns the no-op provider unconditionally today. Once a real
 * provider (Google Analytics, Plausible, PostHog, Clarity, or a
 * visitor-intelligence vendor — see
 * docs/growth/01-b2b-visitor-intelligence-evaluation.md) is approved
 * and configured, this is the one function that gains an env-driven
 * switch (mirroring BILLING_PROVIDER / VISITOR_INTELLIGENCE_PROVIDER)
 * — nothing that calls getAnalyticsProvider() needs to change.
 */
export function getAnalyticsProvider(): AnalyticsProvider {
  return new NoneAnalyticsProvider();
}
