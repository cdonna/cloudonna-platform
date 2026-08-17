import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCreateInquiryRequest } from "../handler";

const VALID_BODY = {
  inquiryType: "founding_tester",
  name: "Jane Buyer",
  businessEmail: "jane@example.com",
  company: "Example Corp",
  sourcePage: "/contact",
};

/** `insert()` resolves directly to `{ error }` — no `.select()`/`.single()`
 * chained on its return value. This is deliberate, not just a
 * convenience: a plain INSERT ... RETURNING id, run as the anon/
 * authenticated role a public submitter connects as, is subject to
 * inquiries_select_staff (RLS governs RETURNING output, not just a
 * separate SELECT statement) — staff-only — so it always failed with
 * 42501 for exactly the visitors this endpoint exists for (confirmed
 * against the real Production error). If createInquiry() ever chains
 * `.select()` on this mock's return value again, it throws a
 * TypeError (`.select is not a function`) immediately, failing every
 * test below — the regression is structurally impossible to reintroduce
 * silently, not just asserted after the fact. */
function mockSupabase({ recentCount = 0, insertError = null as { message: string } | null } = {}) {
  return {
    rpc: vi.fn().mockResolvedValue({ data: recentCount, error: null }),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: insertError }),
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

  it("persists a valid inquiry via INSERT only — no id in the response, no RETURNING chained", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result).toEqual({ status: 200, body: { ok: true } });
    const insertMock = (supabase.from as ReturnType<typeof vi.fn>).mock.results[0].value.insert;
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it("still succeeds even if the notification step throws (persistence is what matters)", async () => {
    const supabase = mockSupabase();

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

  it("classifies the exact 42501 permission-denied error observed in Production as a safe, generic reason", async () => {
    const supabase = mockSupabase({ insertError: { message: 'permission denied for table "inquiries"' } });

    const result = await handleCreateInquiryRequest(VALID_BODY, supabase);

    expect(result.status).toBe(400);
    if ("error" in result.body) {
      expect(result.body.error).toBe("This inquiry could not be submitted.");
    }
  });

  it("accepts a honeypot-filled request without persisting anything (silent fake success)", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, website: "http://spam.example" }, supabase);

    expect(result).toEqual({ status: 200, body: { ok: true } });
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
        insert: vi.fn().mockResolvedValue({ error: null }),
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

  it.each([
    ["/en", "founding_tester"],
    ["/de/contact", "enterprise"],
    ["/fr/early-access", "founding_tester"],
    ["/es/for-vendors", "vendor"],
    ["/it/for-partners", "partner"],
  ])(
    "persists a submission from the real, locale-prefixed sourcePage %s (the exact shape InquiryForm sends in Production)",
    async (sourcePage, inquiryType) => {
      const supabase = mockSupabase();

      const result = await handleCreateInquiryRequest({ ...VALID_BODY, inquiryType, sourcePage }, supabase);

      expect(result.status).toBe(200);
    },
  );

  it("rejects a message over the 4000-character storage limit", async () => {
    const supabase = mockSupabase();

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, message: "x".repeat(4001) }, supabase);

    expect(result.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("captures source_page and utm_source in the persisted row, unchanged from the request", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as SupabaseClient;

    await handleCreateInquiryRequest({ ...VALID_BODY, sourcePage: "/for-vendors", utmSource: "linkedin" }, supabase);

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ source_page: "/for-vendors", utm_source: "linkedin" }));
  });

  it("only ever stores the canonical English inquiry_type enum value — never a localized label", async () => {
    // InquiryForm never sends a translated string for inquiryType (only
    // its dictionary-driven *display* label is localized — see
    // dict.contact.entryPoints / dict.inquiryForm.copyByType); this
    // confirms the schema itself has no room for one to slip through
    // even if a caller tried, since it's a closed 5-value enum.
    const supabase = mockSupabase();
    const localizedLookingValue = "Founding Tester werden"; // a real DE label string, not a value the schema accepts

    const result = await handleCreateInquiryRequest({ ...VALID_BODY, inquiryType: localizedLookingValue }, supabase);

    expect(result.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("never attempts to read the inquiries table back — no anonymous read capability exists in this path", async () => {
    // A structural, not just behavioral, guarantee: the only Supabase
    // client method this whole handler ever calls on the "inquiries"
    // table is insert(). rpc() is called once, for the narrow
    // count-only rate-limit function — never a general read.
    const supabase = mockSupabase();

    await handleCreateInquiryRequest(VALID_BODY, supabase);

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("inquiries");
    const tableMock = fromMock.mock.results[0].value;
    expect(Object.keys(tableMock)).toEqual(["insert"]);
    expect(supabase.rpc).toHaveBeenCalledWith("count_recent_inquiries_by_email", expect.any(Object));
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  describe("notification failure after successful persistence", () => {
    afterEach(() => {
      vi.doUnmock("../../notifications/config");
      vi.resetModules();
    });

    it("still returns 200 with no id when the notification provider throws", async () => {
      vi.resetModules();
      vi.doMock("../../notifications/config", () => ({
        getNotificationProvider: () => ({
          providerId: "failing-test-provider",
          isConfigured: () => true,
          notifyNewInquiry: vi.fn().mockRejectedValue(new Error("Resend responded with 500")),
        }),
      }));
      const { handleCreateInquiryRequest: handleWithFailingNotifier } = await import("../handler");
      const supabase = mockSupabase();

      const result = await handleWithFailingNotifier(VALID_BODY, supabase);

      // Persistence is the system of record — a notification outage
      // must never look like, or cause, a failed submission.
      expect(result).toEqual({ status: 200, body: { ok: true } });
    });

    it("passes inquiryId: null to the notification provider (there is no id to pass)", async () => {
      vi.resetModules();
      const notifyNewInquiry = vi.fn().mockResolvedValue(undefined);
      vi.doMock("../../notifications/config", () => ({
        getNotificationProvider: () => ({
          providerId: "spy-test-provider",
          isConfigured: () => true,
          notifyNewInquiry,
        }),
      }));
      const { handleCreateInquiryRequest: handleWithSpyNotifier } = await import("../handler");
      const supabase = mockSupabase();

      await handleWithSpyNotifier(VALID_BODY, supabase);

      expect(notifyNewInquiry).toHaveBeenCalledWith(expect.objectContaining({ inquiryId: null }));
    });
  });
});
