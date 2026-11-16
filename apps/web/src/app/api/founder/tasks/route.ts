import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleCreateTaskRequest } from "@/lib/founder-agent/handle-create-task-request";
import { listTasksForStaff } from "@/lib/founder-agent/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET lists every task (the Dashboard's "Active / Waiting for approval
 * / Failed / Completed" groups are computed client-side from `status`
 * — see /founder/page.tsx). POST creates one (the "New Task" screen).
 * Both require a signed-in platform-staff caller; RLS
 * (founder_tasks_select_staff / _insert_staff) is the real
 * enforcement, mirroring every other route in this domain.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in as ClouDonna platform staff to view tasks." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) {
    return NextResponse.json({ error: "This area is restricted to ClouDonna platform staff." }, { status: 403 });
  }

  const result = await listTasksForStaff(supabase);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }
  return NextResponse.json({ tasks: result.data });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const result = await handleCreateTaskRequest(body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
