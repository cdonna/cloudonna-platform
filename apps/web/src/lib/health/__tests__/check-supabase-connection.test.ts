import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkSupabaseConnection } from "../check-supabase-connection";

function supabaseWithSelectResult(result: { data: unknown; error: { code?: string; message: string } | null }) {
  const limit = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

describe("checkSupabaseConnection", () => {
  it("reports connected on a successful query, even when RLS returns zero rows", async () => {
    const supabase = supabaseWithSelectResult({ data: [], error: null });
    await expect(checkSupabaseConnection(supabase)).resolves.toBe("connected");
  });

  it("reports error on a Postgres error, without throwing", async () => {
    const supabase = supabaseWithSelectResult({ data: null, error: { code: "42P01", message: "relation \"inquiries\" does not exist" } });
    await expect(checkSupabaseConnection(supabase)).resolves.toBe("error");
  });

  it("reports error rather than throwing when the client itself rejects", async () => {
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        throw new Error("network error");
      }),
    } as unknown as SupabaseClient;
    await expect(checkSupabaseConnection(supabase)).resolves.toBe("error");
  });
});
