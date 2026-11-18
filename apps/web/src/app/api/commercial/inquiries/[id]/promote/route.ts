import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handlePromoteInquiryRequest } from "@/lib/commercial/persistence/handle-promote-inquiry-request";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const result = await handlePromoteInquiryRequest({ ...(body as Record<string, unknown>), inquiryId: id }, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
