import "server-only";

/**
 * The session-refresh logic Next.js middleware.ts delegates to. Required
 * by @supabase/ssr's cookie-rotation model: without this running on
 * every request, a session silently expires mid-use even though the
 * user never explicitly signed out. This file does not gate any route —
 * it only keeps the session cookie current. Route-level protection
 * (redirect an unauthenticated user away from an auth-required page)
 * happens in the page/layout itself via getCurrentUser(), not here — see
 * docs/sprint-6/17-auth-implementation.md, "Why route protection is not
 * in middleware."
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tryGetSupabaseEnv } from "./env";

export async function refreshSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const env = tryGetSupabaseEnv();

  // No Supabase configuration → nothing to refresh. Pass the request
  // through unchanged rather than throwing, so every unauthenticated
  // route (including the entire Donna AI flow) keeps working exactly as
  // it does today with zero Supabase env vars set.
  if (!env) {
    return response;
  }
  const { url, anonKey } = env;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Required by @supabase/ssr: this call is what actually triggers a
  // token refresh and the corresponding Set-Cookie writes above — a
  // read that looks unused is not dead code here.
  await supabase.auth.getUser();

  return response;
}
