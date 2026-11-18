import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listCommercialOpportunities } from "@/lib/commercial/repository";
import { buildOpportunitiesCsv } from "@/lib/commercial/csv-export";

export const runtime = "nodejs";

/** Staff-only pipeline CSV export (brief §42) — same
 * is_platform_staff() check as every other commercial read, nothing
 * cached, nothing stored; a fresh export every request. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to export commercial data." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return NextResponse.json({ error: "This area is restricted to ClouDonna platform staff." }, { status: 403 });

  const result = await listCommercialOpportunities(supabase);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  const csv = buildOpportunitiesCsv(result.data);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"commercial-pipeline.csv\"",
    },
  });
}
