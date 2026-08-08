"use client";

import type { AnalyticsProvider } from "./provider";
import { FirstPartyAnalyticsProvider } from "./providers/first-party";

/**
 * Returns the first-party provider (writes to our own `business_events`
 * table — see supabase/migrations/20260809130000_business_events.sql).
 * No third-party SDK (Google Analytics, Plausible, PostHog, Clarity, or
 * a visitor-intelligence vendor — see
 * docs/growth/01-b2b-visitor-intelligence-evaluation.md) is installed;
 * this is exactly what Phase 11 asked for and no more. Client-only —
 * every real caller is a "use client" component reacting to a user
 * action, and the provider itself needs `window` to reach Supabase's
 * browser client.
 */
export function getAnalyticsProvider(): AnalyticsProvider {
  return new FirstPartyAnalyticsProvider();
}
