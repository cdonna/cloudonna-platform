import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCreateInquiryRequest } from "../handler";

const VALID_BODY = {
  inquiryType: "founding_tester",
  name: "Jane Buyer",
  businessEmail: "jane@example.com",
  company: "Example Corp",
  sourcePage: "/contact",
};

function mockSupabaseInsertSuccess(id = "inquiry-1") {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id }, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("handleCreateInquiryRequest", () => {
  it("rejects a request missing required fields before touching the database", async () => {
    const from = vi.fn();
    const supabase = { from } as unknown as SupabaseClient;

    const result = await handleCreateInquiryRequest({ inquiryType: "general" }, supabase);

    expect(result.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects an invalid inquiryType", async () => {
    const supabase = { from: vi.fn() } as unknown as SupabaseClient;

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, inquiryType: "not-a-real-type" }, supabase);

    expect(result.status).toBe(400);
  });

  it("rejects an unknown extra field (strict schema)", async () => {
    const supabase = { from: vi.fn() } as unknown as SupabaseClient;

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, decisionInput: { evidence: "should never be here" } }, supabase);

    expect(result.status).toBe(400);
  });

  it("persists a valid inquiry and returns its id", async () => {
    const supabase = mockSupabaseInsertSuccess("inquiry-42");

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result).toEqual({ status: 200, body: { id: "inquiry-42" } });
  });

  it("still succeeds even if the notification step throws (persistence is what matters)", async () => {
    const supabase = mockSupabaseInsertSuccess("inquiry-99");

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(200);
  });

  it("returns a safe, generic reason and never the raw Postgres message on RLS rejection", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'new row violates row-level security policy for table "inquiries"' },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(400);
    if ("error" in result.body) {
      expect(result.body.error).not.toContain("row-level security policy for table");
    }
  });
});
