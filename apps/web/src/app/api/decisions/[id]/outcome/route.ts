import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleUpsertDecisionOutcomeRequest } from "@/lib/decision-outcomes/persistence/handle-upsert-decision-outcome-request";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleUpsertDecisionOutcomeRequest(id, body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
