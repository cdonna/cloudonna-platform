import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleReviewClaimRequest } from "@/components/donna-ai/vendor-intelligence/evidence-graph/persistence/handle-review-claim-request";

export const runtime = "nodejs";

const bodySchema = z.object({ decision: z.enum(["active", "rejected"]) }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "The request could not be processed." }, { status: 400 });

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handleReviewClaimRequest(id, parsed.data.decision, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
