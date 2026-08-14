/**
 * Two independent jobs in one middleware, run in this order:
 *
 * 1. Locale routing — a bare request for one of the localized Founder-
 *    journey pages (see src/i18n/locales.ts's LOCALIZED_PATH_PREFIXES)
 *    is redirected to its `/xx/...` form, resolved from the
 *    NEXT_LOCALE cookie (an earlier, explicit choice) or the browser's
 *    Accept-Language header, defaulting to English. /app/*, /api/*,
 *    /auth/*, and /discovery are deliberately left unprefixed — see
 *    the localization report's "KNOWN LIMITATIONS" section for why.
 * 2. Refreshes the Supabase session cookie on every request. Does not
 *    gate any route — a no-op (passes the request through unchanged)
 *    whenever Supabase isn't configured, so the entire unauthenticated
 *    Donna AI experience is unaffected by this file's existence. See
 *    src/lib/supabase/middleware.ts and
 *    docs/sprint-6/17-auth-implementation.md.
 *
 * The locale redirect runs first and returns early — the Supabase
 * refresh then runs against the *next* request (the browser follows
 * the redirect and middleware runs again), so it's never skipped, just
 * deferred by one round trip for the one-time redirect case.
 */
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, isLocalizedPath, isSupportedLocale } from "./src/i18n/locales";
import { resolveLocale } from "./src/i18n/resolve-locale";
import { refreshSupabaseSession } from "./src/lib/supabase/middleware";

function startsWithLocalePrefix(pathname: string): boolean {
  return SUPPORTED_LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isLocalizedPath(pathname) && !startsWithLocalePrefix(pathname)) {
    const locale = resolveLocale(request.cookies.get(LOCALE_COOKIE_NAME)?.value, request.headers.get("accept-language"));
    const target = request.nextUrl.clone();
    target.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    target.search = search;
    const response = NextResponse.redirect(target);
    response.cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

  // A locale-prefixed request whose prefix isn't one we ship (or isn't
  // a supported value some other way) — fall through to Supabase
  // refresh untouched; the [locale] segment itself calls notFound()
  // for anything unsupported once Next.js reaches the route.
  const localeSegment = pathname.split("/")[1];
  if (startsWithLocalePrefix(pathname) && isSupportedLocale(localeSegment)) {
    const response = await refreshSupabaseSession(request);
    response.cookies.set(LOCALE_COOKIE_NAME, localeSegment, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

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
