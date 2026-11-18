import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleUpdateSprintRequest } from "@/lib/commercial/persistence/handle-update-sprint-request";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleUpdateSprintRequest(id, body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
