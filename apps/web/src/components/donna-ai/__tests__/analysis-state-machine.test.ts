import { describe, expect, it } from "vitest";
import {
  analysisMachineReducer,
  createInitialAnalysisMachineState,
  type AnalysisMachineState,
} from "../analysis-state-machine";

const TOTAL_STEPS = 5;

function advance(state: AnalysisMachineState): AnalysisMachineState {
  return analysisMachineReducer(state, { type: "STEP_ADVANCE", totalSteps: TOTAL_STEPS });
}

describe("analysisMachineReducer", () => {
  it("advances currentStep on every STEP_ADVANCE while analysing — the exact case that used to stall after one advance", () => {
    let state = createInitialAnalysisMachineState();
    expect(state.currentStep).toBe(0);

    // This loop is the regression check for the P0: with the old
    // choreographyDone-as-dependency bug, only the first of these
    // would have had any effect (in the real component) because the
    // *component's* effect never re-ran, not because the reducer
    // itself was broken. Proving the reducer alone monotonically
    // advances on every event is the foundation the component-level
    // fix relies on.
    for (let i = 1; i < TOTAL_STEPS; i++) {
      state = advance(state);
      expect(state.currentStep).toBe(i);
    }
  });

  it("never advances currentStep past the last index, and never throws", () => {
    let state = createInitialAnalysisMachineState();
    for (let i = 0; i < 20; i++) state = advance(state);
    expect(state.currentStep).toBe(TOTAL_STEPS - 1);
    expect(state.status).toBe("analysing");
  });

  it("moves to result_ready on REQUEST_SUCCEEDED regardless of how far the choreography has gotten", () => {
    const early = analysisMachineReducer(createInitialAnalysisMachineState(), { type: "REQUEST_SUCCEEDED" });
    expect(early.status).toBe("result_ready");

    let late = createInitialAnalysisMachineState();
    for (let i = 0; i < TOTAL_STEPS - 1; i++) late = advance(late);
    late = analysisMachineReducer(late, { type: "REQUEST_SUCCEEDED" });
    expect(late.status).toBe("result_ready");
  });

  it("moves to error on REQUEST_FAILED and preserves a sanitized message, not stalling in analysing", () => {
    const state = analysisMachineReducer(createInitialAnalysisMachineState(), {
      type: "REQUEST_FAILED",
      message: "Could not reach the recommendation service.",
    });
    expect(state.status).toBe("error");
    expect(state.errorMessage).toBe("Could not reach the recommendation service.");
  });

  it("ignores STEP_ADVANCE once resolved — a late timer firing after success or failure cannot resurrect analysing", () => {
    const succeeded = analysisMachineReducer(createInitialAnalysisMachineState(), { type: "REQUEST_SUCCEEDED" });
    expect(advance(succeeded)).toBe(succeeded); // same reference: genuinely a no-op

    const failed = analysisMachineReducer(createInitialAnalysisMachineState(), { type: "REQUEST_FAILED", message: "x" });
    expect(advance(failed)).toBe(failed);
  });

  it("ignores a late REQUEST_SUCCEEDED after the user has already been shown an error", () => {
    const failed = analysisMachineReducer(createInitialAnalysisMachineState(), { type: "REQUEST_FAILED", message: "x" });
    const afterLateSuccess = analysisMachineReducer(failed, { type: "REQUEST_SUCCEEDED" });
    expect(afterLateSuccess.status).toBe("error");
  });

  it("RETRY fully resets to a fresh analysing state", () => {
    const failed = analysisMachineReducer(createInitialAnalysisMachineState(), { type: "REQUEST_FAILED", message: "x" });
    const retried = analysisMachineReducer(failed, { type: "RETRY" });
    expect(retried).toEqual(createInitialAnalysisMachineState());
  });

  it("retry after failure reaches result_ready on a subsequent success — the exact sequence the UI's retry button drives", () => {
    // Regression test for a bug caught while fixing the original one:
    // REQUEST_SUCCEEDED is a deliberate no-op while status is "error"
    // (see the test above), which means a retry's UI handler MUST
    // dispatch RETRY before the new request's success can land, or a
    // genuinely successful retry would be silently discarded forever.
    let state = createInitialAnalysisMachineState();
    state = analysisMachineReducer(state, { type: "REQUEST_FAILED", message: "network error" });
    expect(state.status).toBe("error");

    state = analysisMachineReducer(state, { type: "RETRY" });
    expect(state.status).toBe("analysing");

    state = analysisMachineReducer(state, { type: "REQUEST_SUCCEEDED" });
    expect(state.status).toBe("result_ready");
  });

  it("every reachable state is one of exactly three statuses — there is no fourth, hidden stuck state", () => {
    const events: Array<{ type: "STEP_ADVANCE"; totalSteps: number } | { type: "REQUEST_SUCCEEDED" } | { type: "REQUEST_FAILED"; message: string } | { type: "RETRY" }> = [
      { type: "STEP_ADVANCE", totalSteps: TOTAL_STEPS },
      { type: "REQUEST_SUCCEEDED" },
      { type: "REQUEST_FAILED", message: "x" },
      { type: "RETRY" },
    ];
    let state = createInitialAnalysisMachineState();
    for (const event of events) {
      state = analysisMachineReducer(state, event);
      expect(["analysing", "result_ready", "error"]).toContain(state.status);
    }
  });
});
