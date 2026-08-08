"use client";

/**
 * Browser Supabase client — anon key only. Used exclusively for
 * client-side auth UI (sign-in/sign-up forms, session state) so form
 * submission feels instant without a round trip through a Route
 * Handler. Every read/write this client makes is still RLS-enforced —
 * the anon key identifies the project, not a privilege; it carries no
 * authority the database itself doesn't grant per-row. Never used for
 * anything a service-role client should do instead — there is no
 * service-role client reachable from this file or anything it imports.
 * See docs/sprint-6/08-security.md.
 */
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
