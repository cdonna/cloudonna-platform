import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Thin factory around the Supabase JS client. Deliberately not a singleton
 * and deliberately not reading environment variables itself — the caller
 * (a future service layer) decides how credentials are sourced, which is
 * what keeps this package usable from a server, an edge function, or a
 * test harness without modification.
 *
 * No auth is implemented anywhere in this package (see docs/platform/
 * database-architecture.md). Passing a service-role key here bypasses RLS
 * entirely, by Supabase's own design — appropriate for trusted backend
 * code (the repository layer itself), never for anything reachable from a
 * browser.
 */
export interface DatabaseClientConfig {
  url: string;
  /** Either the anon key (RLS enforced, safe client-side once auth exists)
   * or the service-role key (RLS bypassed, server-only). This package does
   * not distinguish between the two — that judgment belongs to the caller. */
  key: string;
}

export function createDatabaseClient(config: DatabaseClientConfig): SupabaseClient {
  if (!config.url || !config.key) {
    throw new Error(
      "createDatabaseClient requires both a Supabase project url and key — none are read from the environment implicitly.",
    );
  }

  return createClient(config.url, config.key, {
    auth: {
      // This package never manages a browser session; every consumer today
      // is trusted backend code, so persisting/refreshing a session here
      // would be surface area for a use case that doesn't exist yet.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
