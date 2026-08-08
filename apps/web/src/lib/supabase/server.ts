import "server-only";

/**
 * Server Supabase client — anon key, per-request, cookie-based. Every
 * RLS-protected read/write in this domain goes through this client,
 * running AS the authenticated user (never a service-role bypass) so
 * Postgres RLS is the actual enforcement mechanism, not an application-
 * layer convention. `import "server-only"` makes "never importable from
 * a client component" a build-time guarantee, the same pattern already
 * established by `intelligence/config.ts`. See
 * docs/sprint-6/08-security.md.
 *
 * `setAll` is wrapped in try/catch per the documented @supabase/ssr
 * pattern: a Server Component cannot set cookies (only Route Handlers
 * and Server Actions can) — middleware.ts is what actually refreshes
 * the session cookie on every request; a failed setAll here is expected
 * and harmless when called from a Server Component.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

/** Throws if Supabase isn't configured — correct for auth-gated Route
 * Handlers, which have no reasonable behavior without a database.
 * getCurrentUser() below is the non-throwing variant every page/layout
 * should use instead. */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component with no request/response to
          // attach a Set-Cookie header to — middleware.ts's own
          // getSupabaseMiddlewareClient already refreshes the session
          // cookie on every request, so this is a safe no-op here.
        }
      },
    },
  });
}

/** Resolves the current session's user, or null if unauthenticated OR if
 * Supabase isn't configured at all — the one helper every page,
 * layout, and auth-gated Route Handler in this domain calls first,
 * never re-implemented ad hoc per route. Deliberately non-throwing:
 * "no Supabase configured" and "not signed in" both mean the same thing
 * to a caller deciding whether to show authenticated UI. */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
