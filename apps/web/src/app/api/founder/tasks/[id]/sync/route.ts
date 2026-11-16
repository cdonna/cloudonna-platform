import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleSyncTaskRequest } from "@/lib/founder-agent/handle-sync-task-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const result = await handleSyncTaskRequest(id, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
