import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleCreateOpportunityRequest } from "@/lib/commercial/persistence/handle-create-opportunity-request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleCreateOpportunityRequest(body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
