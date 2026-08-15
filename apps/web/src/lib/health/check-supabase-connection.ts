import "server-only";

/**
 * Framework-independent connectivity check behind
 * app/api/health/route.ts — same "thin route, testable handler" split
 * as handle-create-inquiry-request.ts. Answers exactly one question:
 * can this server reach Supabase and query a real table through it?
 * Deliberately reuses `inquiries` (already RLS-closed to anon SELECT)
 * rather than adding a new table or RPC — an anon caller always gets
 * an empty, filtered result set on success, never real rows, so this
 * never becomes a second way to read inquiry data. A relation-missing
 * or network error is the only thing that trips the "error" branch.
 *
 * Never returns the underlying Postgres error, a stack trace, or any
 * identifying detail to the caller — only a coarse status. The raw
 * detail is logged server-side only, same posture as every other
 * Supabase-touching route in this codebase.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseConnectionStatus = "connected" | "error";

export async function checkSupabaseConnection(supabase: SupabaseClient): Promise<SupabaseConnectionStatus> {
  try {
    const { error } = await supabase.from("inquiries").select("id").limit(1);
    if (error) {
      console.error(`[health] supabase_query_error code=${error.code ?? "unknown"} message=${error.message}`);
      return "error";
    }
    return "connected";
  } catch (error) {
    console.error(`[health] supabase_client_error ${error instanceof Error ? error.message : "unknown error"}`);
    return "error";
  }
}
