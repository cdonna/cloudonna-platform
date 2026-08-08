/**
 * Refreshes the Supabase session cookie on every request. Does not gate
 * any route — a no-op (passes the request through unchanged) whenever
 * Supabase isn't configured, so the entire unauthenticated Donna AI
 * experience is unaffected by this file's existence. See
 * src/lib/supabase/middleware.ts and docs/sprint-6/17-auth-implementation.md.
 */
import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "./src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every route except static assets and Next.js internals —
     * the session cookie needs refreshing on page loads and API calls
     * alike, not on image/font requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
