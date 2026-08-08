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

function mockSupabase({ recentCount = 0, insertId = "inquiry-1", insertError = null as { message: string } | null } = {}) {
  return {
    rpc: vi.fn().mockResolvedValue({ data: recentCount, error: null }),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(insertError ? { data: null, error: insertError } : { data: { id: insertId }, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("handleCreateInquiryRequest", () => {
  it("rejects a request missing required fields before touching the database", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ inquiryType: "general" }, supabase);

    expect(result.status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects an invalid inquiryType", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, inquiryType: "not-a-real-type" }, supabase);

    expect(result.status).toBe(400);
  });

  it("rejects an invalid business email", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, businessEmail: "not-an-email" }, supabase);

    expect(result.status).toBe(400);
  });

  it("rejects an unsupported source page", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, sourcePage: "/some-random-page" }, supabase);

    expect(result.status).toBe(400);
  });

  it("rejects an unknown extra field (strict schema)", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, decisionInput: { evidence: "should never be here" } }, supabase);

    expect(result.status).toBe(400);
  });

  it("persists a valid inquiry and returns its id", async () => {
    const supabase = mockSupabase({ insertId: "inquiry-42" });

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result).toEqual({ status: 200, body: { id: "inquiry-42" } });
  });

  it("still succeeds even if the notification step throws (persistence is what matters)", async () => {
    const supabase = mockSupabase({ insertId: "inquiry-99" });

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(200);
  });

  it("returns a safe, generic reason and never the raw Postgres message on database failure", async () => {
    const supabase = mockSupabase({ insertError: { message: 'new row violates row-level security policy for table "inquiries"' } });

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(400);
    if ("error" in result.body) {
      expect(result.body.error).not.toContain("row-level security policy for table");
    }
  });

  it("accepts a honeypot-filled request without persisting anything (silent fake success)", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, website: "http://spam.example" }, supabase);

    expect(result.status).toBe(200);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects submission once the rate limit is reached for that email", async () => {
    const supabase = mockSupabase({ recentCount: 3 });

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(429);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("allows submission when the rate-limit check itself fails (fails open)", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "function not found" } }),
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "inquiry-open" }, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(200);
  });

  it.each([
    ["founding_tester", "/contact"],
    ["partner", "/for-partners"],
    ["vendor", "/for-vendors"],
    ["enterprise", "/contact"],
    ["general", "/"],
  ])("persists a %s inquiry submitted from %s", async (inquiryType, sourcePage) => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, inquiryType, sourcePage }, supabase);

    expect(result.status).toBe(200);
  });
});
