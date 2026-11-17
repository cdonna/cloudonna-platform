import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A minimal fake Supabase client whose `.from(table)` dispatches to a
 * per-table chain builder, so handler tests that call
 * getDecisionDetail/listResearchEvidenceForDecision/
 * listConflictsForDecision (each hitting a different table) in one
 * request can be satisfied by a single fake client. Each table's
 * terminal value is whatever `{ data, error }` the test configures —
 * every chain method (`select`/`eq`/`order`) just returns the same
 * chain object until a terminal await resolves it.
 */
export function fakeSupabaseRouter(tableResults: Record<string, { data: unknown; error: { message: string } | null }>): SupabaseClient {
  function chainFor(table: string) {
    const result = tableResults[table] ?? { data: null, error: null };
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => Promise.resolve(result)),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
      single: vi.fn(() => Promise.resolve(result)),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
    };
    return chain;
  }

  return {
    from: vi.fn((table: string) => chainFor(table)),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
}
