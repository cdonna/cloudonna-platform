import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleMergeTaskRequest } from "@/lib/founder-agent/handle-merge-task-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The separate "Merge this branch into main?" confirmation — never
 * triggered as a side effect of /review's Approve action. */
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
  const result = await handleMergeTaskRequest(id, body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
