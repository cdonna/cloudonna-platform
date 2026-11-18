import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleCreateInvoiceRequest } from "@/lib/commercial/persistence/handle-create-invoice-request";

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

  const result = await handleCreateInvoiceRequest(body, supabase, user?.id ?? null);
  return NextResponse.json(result.body, { status: result.status });
}
