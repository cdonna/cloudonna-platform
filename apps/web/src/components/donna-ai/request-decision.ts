/**
 * Extracted from DonnaAIExperience so the request/timeout/fallback
 * logic is unit-testable without rendering React — `fetch` and the
 * timeout duration are injectable specifically so tests can simulate
 * a slow, hanging, or failing network without a real one. See
 * __tests__/request-decision.test.ts.
 *
 * The deterministic local fallback (buildLocalFallbackReport) is not
 * new here — it is this codebase's long-standing, deliberate answer
 * to "the network failed": a complete, real, non-fabricated
 * DecisionOutput computed with the exact same engine the server would
 * have used, clearly disclosed via `fallback.status`. What's new is
 * (1) a bounded timeout around the fetch itself, so a request that
 * never settles at all — the literal "unresolved Promise" failure
 * mode — degrades into that same honest fallback within a fixed time
 * instead of leaving the caller waiting forever, and (2) the fallback
 * computation itself is no longer assumed infallible: if
 * buildDecisionOutput throws (a malformed WizardState, the one
 * scenario neither the network nor a retry can fix), that is the one
 * case surfaced as a real, distinct failure — never silently
 * swallowed, never spun on forever.
 */
import { buildDecisionOutput } from "./engine";
import type { DecisionReport } from "./intelligence/types";
import type { WizardState } from "./types";

export const REQUEST_TIMEOUT_MS = 12_000;

export type RequestDecisionResult = { ok: true; report: DecisionReport } | { ok: false; message: string };

const GENERIC_FAILURE_MESSAGE = "Donna couldn't build a recommendation from this assessment. Nothing was lost — you can retry with the same answers.";

function buildLocalFallbackReport(state: WizardState): DecisionReport {
  return {
    output: buildDecisionOutput(state),
    enrichment: null,
    provider: { providerId: "local-fallback", model: null },
    fallback: {
      status: "unavailable",
      reason: "Could not reach the Donna AI service — showing a locally-computed deterministic result only.",
    },
    generatedAt: new Date().toISOString(),
  };
}

/** The one place a raw error becomes user-facing text — deliberately
 * generic. Never `error.stack`, never the raw error object, never
 * anything that could echo an internal path or config value back to
 * the browser. The real error still goes to the console for
 * debugging, console output being the safe place for it (this runs
 * client-side; nothing here ever had access to a server secret to
 * begin with). */
function toSafeFailure(context: string, error: unknown): { ok: false; message: string } {
  console.error(`[donna-ai] ${context}:`, error instanceof Error ? error.message : error);
  return { ok: false, message: GENERIC_FAILURE_MESSAGE };
}

export interface RequestDecisionDeps {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function requestDecision(state: WizardState, deps: RequestDecisionDeps = {}): Promise<RequestDecisionResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? REQUEST_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl("/api/donna-ai/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wizardState: state }),
      signal: controller.signal,
    });

    if (!response.ok) return fallbackOrFail(state);

    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("report" in data)) {
      return fallbackOrFail(state);
    }
    return { ok: true, report: (data as { report: DecisionReport }).report };
  } catch {
    // Network unreachable, aborted (including our own timeout above),
    // or JSON parse failure — all land here. Not yet a user-facing
    // failure: the local deterministic path still needs a chance.
    return fallbackOrFail(state);
  } finally {
    clearTimeout(timeoutId);
  }
}

function fallbackOrFail(state: WizardState): RequestDecisionResult {
  try {
    return { ok: true, report: buildLocalFallbackReport(state) };
  } catch (error) {
    return toSafeFailure("local_fallback_failed", error);
  }
}
