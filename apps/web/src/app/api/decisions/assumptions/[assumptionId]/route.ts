import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleUpdateAssumptionValidationRequest } from "@/lib/decision-outcomes/persistence/handle-update-assumption-validation-request";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ assumptionId: string }> }) {
  const { assumptionId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleUpdateAssumptionValidationRequest(assumptionId, body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
