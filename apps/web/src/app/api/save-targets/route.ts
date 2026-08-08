/**
 * Powers the Save Decision dialog's organization/workspace/project
 * picker from the (public, unauthenticated-friendly) /donna-ai page.
 * Returns an empty, honest {signedIn: false} for an anonymous caller —
 * never an error, since "not signed in" is an expected, normal state
 * here, not a failure.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listSaveTargetsForCurrentUser } from "@/components/donna-ai/persistence/decisions-repository";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ signedIn: false, options: [] });
  }

  const supabase = await createSupabaseServerClient();
  const result = await listSaveTargetsForCurrentUser(supabase);
  if (!result.ok) {
    return NextResponse.json({ signedIn: true, options: [] });
  }

  return NextResponse.json({ signedIn: true, options: result.data });
}
