import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleCreateInquiryRequest } from "@/lib/inquiries/handler";

export const runtime = "nodejs";

/**
 * Public, unauthenticated endpoint — the one write path in this schema
 * anonymous visitors are meant to use. inquiries_insert_public (RLS)
 * is the real enforcement of "what an anonymous request can and can't
 * do here," same posture as every other route in this domain.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    // Supabase unconfigured — persistence genuinely cannot happen, so
    // this is a real failure, not something to paper over with a fake
    // success response.
    return NextResponse.json({ error: "This inquiry could not be submitted. Please try again later." }, { status: 503 });
  }

  const result = await handleCreateInquiryRequest(body, supabase);
  return NextResponse.json(result.body, { status: result.status });
}
