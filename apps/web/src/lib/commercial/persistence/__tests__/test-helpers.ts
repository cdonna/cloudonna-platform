import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

type FakeResult = { data: unknown; error: { message: string } | null };

/** Local copy of the shared fakeSupabaseRouter pattern (see
 * donna-ai/research/persistence/__tests__/test-helpers.ts) — kept
 * here rather than imported across the commercial-neutrality
 * boundary, so no lib/commercial file (test or otherwise) ever
 * imports from components/donna-ai/. */
export function fakeSupabaseRouter(tableResults: Record<string, FakeResult | FakeResult[]>, isStaff = true): SupabaseClient {
  const callIndexByTable = new Map<string, number>();

  function chainFor(table: string) {
    const configured = tableResults[table];
    let result: FakeResult;
    if (Array.isArray(configured)) {
      const index = callIndexByTable.get(table) ?? 0;
      result = configured[Math.min(index, configured.length - 1)] ?? { data: null, error: null };
      callIndexByTable.set(table, index + 1);
    } else {
      result = configured ?? { data: null, error: null };
    }
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
      single: vi.fn(() => Promise.resolve(result)),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      in: vi.fn(() => chain),
      or: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
    };
    return chain;
  }

  return {
    from: vi.fn((table: string) => chainFor(table)),
    rpc: vi.fn(() => Promise.resolve({ data: isStaff, error: null })),
  } as unknown as SupabaseClient;
}
