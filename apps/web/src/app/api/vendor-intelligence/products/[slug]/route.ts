import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleProductKnowledgeRequest } from "@/components/donna-ai/vendor-intelligence/evidence-graph/persistence/handle-product-knowledge-request";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleProductKnowledgeRequest(slug, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
