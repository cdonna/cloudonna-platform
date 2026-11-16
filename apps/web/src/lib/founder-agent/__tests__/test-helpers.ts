import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A minimal fake Supabase client for this domain's handler tests —
 * same shape and same reasoning as inquiries/__tests__/handler.test.ts's
 * own mockSupabase(): a query-builder stub that resolves to whatever
 * the test configured, so a handler's authorization/validation logic
 * can be exercised without a real database, and so a handler that
 * starts chaining a method this stub doesn't define fails loudly
 * (`.foo is not a function`) rather than silently passing.
 *
 * `taskRow` seeds what `getTask`/`listTasks` return; `insertResult`
 * seeds what any `.insert(...).select(...).single()` chain resolves
 * to, which is enough for every handler in this domain — none of them
 * run more than one distinct insert per request.
 */
export function mockFounderSupabase(options: {
  taskRow?: Record<string, unknown> | null;
  insertError?: { message: string } | null;
  insertData?: Record<string, unknown> | null;
  updateData?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
} = {}) {
  const { taskRow = null, insertError = null, insertData = { id: "evt-1" }, updateData = null, updateError = null } = options;

  // Same stub regardless of which table is queried — every handler in
  // this domain only ever touches one table per call, so the table
  // name itself doesn't need to change what's returned.
  const from = vi.fn().mockImplementation(() => ({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: insertError ? null : insertData, error: insertError }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: updateError ? null : (updateData ?? taskRow), error: updateError }),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: taskRow, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      order: vi.fn().mockResolvedValue({ data: taskRow ? [taskRow] : [], error: null }),
    }),
  }));

  return { from, rpc: vi.fn() } as unknown as SupabaseClient;
}

/** A real-shaped founder_tasks row, as the repository's mapTaskRow()
 * expects to receive it — i.e. snake_case, the wire shape, not the
 * camelCase FounderTaskRecord the repository returns. */
export function taskRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "task-1",
    created_by: "founder-1",
    title: "Make the Architects page visually closer to Nova",
    description: "Align spacing and type with the new editorial system.",
    priority: "medium",
    target_area: "architects",
    constraints: null,
    acceptance_criteria: "Page matches the editorial primitives used elsewhere.",
    status: "queued",
    failure_reason: null,
    branch_name: null,
    base_commit_sha: null,
    head_commit_sha: null,
    pr_number: null,
    pr_url: null,
    agent_provider: "anthropic",
    agent_model: null,
    created_at: "2026-11-16T09:00:00.000Z",
    started_at: null,
    finished_at: null,
    approved_at: null,
    merged_at: null,
    deployed_at: null,
    ...overrides,
  };
}
