import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getClaimTrace } from "@/components/donna-ai/vendor-intelligence/evidence-graph/persistence/vendor-knowledge-repository";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view evidence traces." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const result = await getClaimTrace(supabase, id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });

  return NextResponse.json(result.data, { status: 200 });
}
