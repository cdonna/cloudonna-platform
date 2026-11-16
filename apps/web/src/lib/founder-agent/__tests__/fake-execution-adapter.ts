import { vi } from "vitest";
import type { ExecutionAdapter } from "../execution-adapter";

/** A test double for ExecutionAdapter — used only in this domain's own
 * test files, never by application code (see execution-adapter.ts's
 * own comment: the product never simulates execution; tests using a
 * double to isolate a handler from the network is ordinary practice,
 * not the same thing). Every method defaults to the "not configured"
 * shape, matching this repository's actual, honest state unless a
 * test explicitly configures otherwise. */
export function fakeExecutionAdapter(overrides: Partial<ExecutionAdapter> = {}): ExecutionAdapter {
  const notConfigured = { ok: false as const, reason: "not configured", notConfigured: true as const };
  return {
    isConfigured: vi.fn().mockReturnValue(false),
    dispatchTask: vi.fn().mockResolvedValue(notConfigured),
    syncTask: vi.fn().mockResolvedValue(notConfigured),
    checkMergePreconditions: vi.fn().mockResolvedValue(notConfigured),
    mergeTask: vi.fn().mockResolvedValue(notConfigured),
    ...overrides,
  };
}
