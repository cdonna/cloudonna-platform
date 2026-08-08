/**
 * Magic-link / email-confirmation callback. Exchanges the one-time code
 * Supabase Auth appended to the redirect URL for a real session, then
 * sends the user on to /app. This is the one Route Handler in the auth
 * domain that must run even when the rest of the app has no session —
 * it is, definitionally, how a session first comes to exist.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/app", request.url));
}
