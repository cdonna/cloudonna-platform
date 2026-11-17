import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

type FakeResult = { data: unknown; error: { message: string } | null };

/**
 * A minimal fake Supabase client whose `.from(table)` dispatches to a
 * per-table chain builder, so handler tests that call
 * getDecisionDetail/listResearchEvidenceForDecision/
 * listConflictsForDecision (each hitting a different table) in one
 * request can be satisfied by a single fake client. Each table's
 * terminal value is whatever `{ data, error }` the test configures —
 * every chain method (`select`/`eq`/`order`) just returns the same
 * chain object until a terminal await resolves it.
 *
 * A table's value may also be an ARRAY of results, consumed one per
 * `.from(table)` call in order (the last one repeats once exhausted)
 * — for a handler that legitimately queries or writes the same table
 * more than once per request with a genuinely different expected
 * shape each time (e.g. a list read, then a single-row insert).
 */
export function fakeSupabaseRouter(tableResults: Record<string, FakeResult | FakeResult[]>): SupabaseClient {
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
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
}
