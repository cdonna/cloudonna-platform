"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AnalyticsEvent, AnalyticsProvider, PageViewEvent } from "../provider";

/**
 * Writes to our own `business_events` table — first-party, nothing
 * external, no third-party visitor-intelligence SDK. Matches Phase
 * 11's own framing exactly: "first-party business events only... do
 * not install third-party visitor intelligence."
 *
 * isConfigured() reflects whether Supabase itself is configured — if
 * it isn't, every call below fails inside its own try/catch and is
 * silently dropped. A tracking call must never break the page it's on;
 * that's true here the same way it's true for every other provider in
 * this codebase.
 */
export class FirstPartyAnalyticsProvider implements AnalyticsProvider {
  readonly providerId = "first-party";

  isConfigured(): boolean {
    return true;
  }

  // Deliberately a no-op: business_event_name (the DB enum this
  // provider writes against) has no generic "page_view" value — only
  // the six named business events from Phase 11. A caller that wants
  // "contact page viewed" tracked calls trackEvent({ name:
  // "contact_viewed" }) directly instead; this method exists only to
  // satisfy the AnalyticsProvider interface for a future provider
  // (e.g. a real pageview-oriented tool) that does have a generic
  // concept of a page view.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackPageView(event: PageViewEvent): void {}

  trackEvent(event: AnalyticsEvent): void {
    this.insert(event.name, event.properties ?? {});
  }

  private insert(eventName: string, properties: Record<string, unknown>): void {
    try {
      const supabase = createSupabaseBrowserClient();
      void supabase.from("business_events").insert({
        event_name: eventName,
        source_page: window.location.pathname,
        properties,
      });
    } catch {
      // Never let a tracking failure affect the page it's called from.
    }
  }
}
