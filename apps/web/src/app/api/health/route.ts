import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkSupabaseConnection } from "@/lib/health/check-supabase-connection";

export const runtime = "nodejs";

/**
 * Public, unauthenticated, read-only. Reports only a coarse status —
 * never a connection string, error message, or schema detail — so this
 * is safe to hit from outside without granting any diagnostic access.
 * "not_configured" is a normal, expected state (every public Donna AI
 * page runs fine with zero Supabase env vars) and is not a 503.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ supabase: "not_configured" }, { status: 200 });
  }

  const supabase = await createSupabaseServerClient();
  const status = await checkSupabaseConnection(supabase);

  return NextResponse.json({ supabase: status }, { status: status === "connected" ? 200 : 503 });
}
