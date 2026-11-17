import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleResearchRunRequest } from "@/components/donna-ai/research/persistence/handle-research-run-request";

export const runtime = "nodejs";

/** Comfortably above research/stop-conditions.ts's own
 * MAX_SESSION_DURATION_MS (45s) plus planning/persistence overhead —
 * the orchestrator's internal time budget should always stop a run
 * before this platform-level limit does. */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleResearchRunRequest(body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
