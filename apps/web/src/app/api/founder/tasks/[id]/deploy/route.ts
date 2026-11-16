import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleDeployTaskRequest } from "@/lib/founder-agent/handle-deploy-task-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The separate "Deploy current main to production?" confirmation.
 * Always returns 501 today — see handle-deploy-task-request.ts's own
 * comment and docs/founder-agent/operations.md. The route exists so
 * the Deploy Approval screen has a real endpoint to call and a real,
 * honest response to show, rather than a client-side-only stub. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const result = await handleDeployTaskRequest(id, body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
