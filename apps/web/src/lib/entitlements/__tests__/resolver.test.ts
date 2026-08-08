import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FOUNDING_TESTER_ENTITLEMENTS } from "../default-entitlements";
import { getEntitlementLimit, getEntitlementsForOrganization, hasEntitlement } from "../resolver";

function mockSupabaseWithNoSubscription(): SupabaseClient {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("getEntitlementsForOrganization", () => {
  it("returns the Founding Tester bundle when the organization has no live subscription (today's only real path)", async () => {
    const supabase = mockSupabaseWithNoSubscription();
    const result = await getEntitlementsForOrganization(supabase, "org-1");
    expect(result).toEqual(FOUNDING_TESTER_ENTITLEMENTS);
  });

  it("overrides only the keys a plan defines a row for, leaving every other key at the safe default", async () => {
    const subscriptionsFrom = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { plan_id: "plan-professional" }, error: null }),
          }),
        }),
      }),
    };
    const planEntitlementsFrom = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            { entitlement_key: "executive_reports", boolean_value: true, integer_value: null },
            { entitlement_key: "max_users", boolean_value: null, integer_value: 25 },
          ],
          error: null,
        }),
      }),
    };

    const from = vi.fn().mockImplementation((table: string) => (table === "subscriptions" ? subscriptionsFrom : planEntitlementsFrom));
    const supabase = { from } as unknown as SupabaseClient;

    const result = await getEntitlementsForOrganization(supabase, "org-1");

    expect(result.executive_reports).toBe(true);
    expect(result.max_users).toBe(25);
    // Untouched keys keep the Founding Tester default.
    expect(result.decision_replay).toBe(false);
    expect(result.max_workspaces).toBe(FOUNDING_TESTER_ENTITLEMENTS.max_workspaces);
  });

  it("never grants decision_replay through the default bundle — the capability does not exist yet", async () => {
    const supabase = mockSupabaseWithNoSubscription();
    const result = await getEntitlementsForOrganization(supabase, "org-1");
    expect(result.decision_replay).toBe(false);
  });
});

describe("hasEntitlement / getEntitlementLimit", () => {
  it("hasEntitlement reads a single boolean key through the same resolved bundle", async () => {
    const supabase = mockSupabaseWithNoSubscription();
    await expect(hasEntitlement(supabase, "org-1", "decision_memory")).resolves.toBe(true);
    await expect(hasEntitlement(supabase, "org-1", "api_access")).resolves.toBe(false);
  });

  it("getEntitlementLimit reads a single integer key through the same resolved bundle", async () => {
    const supabase = mockSupabaseWithNoSubscription();
    await expect(getEntitlementLimit(supabase, "org-1", "max_decisions_per_month")).resolves.toBe(
      FOUNDING_TESTER_ENTITLEMENTS.max_decisions_per_month,
    );
  });
});
