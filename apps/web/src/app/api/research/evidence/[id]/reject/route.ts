import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleResearchEvidenceDecisionRequest } from "@/components/donna-ai/research/persistence/handle-research-evidence-decision-request";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleResearchEvidenceDecisionRequest(id, "rejected", supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
