"use client";

import { useEffect } from "react";
import { getAnalyticsProvider } from "@/lib/analytics/config";

/** Fires the first-party `contact_viewed` event once per page load.
 * Renders nothing — exists purely for the side effect, kept as its own
 * component so /contact's page.tsx stays a Server Component. */
export function ContactViewedTracker() {
  useEffect(() => {
    getAnalyticsProvider().trackEvent({ name: "contact_viewed" });
  }, []);

  return null;
}
