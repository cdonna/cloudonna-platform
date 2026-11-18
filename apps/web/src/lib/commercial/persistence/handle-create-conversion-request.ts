import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createCommercialConversionRequestSchema } from "../schema";
import { createCommercialConversion, type CommercialConversionSummary } from "../conversions-repository";

export interface CreateConversionHandlerResult {
  status: number;
  body: CommercialConversionSummary | { error: string };
}

export async function handleCreateConversionRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<CreateConversionHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to record a commercial conversion." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = createCommercialConversionRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await createCommercialConversion(supabase, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
