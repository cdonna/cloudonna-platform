import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleDecisionVendorKnowledgeRequest } from "@/components/donna-ai/vendor-intelligence/evidence-graph/persistence/handle-decision-vendor-knowledge-request";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleDecisionVendorKnowledgeRequest(id, slug, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
