import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getTask, listTaskApprovals, listTaskArtifacts, listTaskEvents } from "@/lib/founder-agent/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Task Detail / Review screen data in one response — status, plan
 * (description/constraints/acceptance criteria already on the task
 * row), the full progress event stream, every review artifact, and
 * every approval decision ever recorded against it. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in as ClouDonna platform staff to view this task." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const taskResult = await getTask(supabase, id);
  if (!taskResult.ok) return NextResponse.json({ error: taskResult.reason }, { status: 403 });
  if (!taskResult.data) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const [events, artifacts, approvals] = await Promise.all([
    listTaskEvents(supabase, id),
    listTaskArtifacts(supabase, id),
    listTaskApprovals(supabase, id),
  ]);

  return NextResponse.json({
    task: taskResult.data,
    events: events.ok ? events.data : [],
    artifacts: artifacts.ok ? artifacts.data : [],
    approvals: approvals.ok ? approvals.data : [],
  });
}
