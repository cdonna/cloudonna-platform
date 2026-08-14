/**
 * The explicit state machine behind AnalysingState — extracted as a
 * pure reducer specifically so "no valid execution can remain
 * indefinitely in analysing" is something a test can prove directly,
 * not something inferred from reading timer code. See
 * __tests__/analysis-state-machine.test.ts.
 *
 * Root cause of the P0 stall this replaces: AnalysingState previously
 * derived a `choreographyDone` boolean from `currentStep` and used
 * *that* as a useEffect dependency instead of `currentStep` itself.
 * `choreographyDone` is `false` for steps 0 through length-2 — the
 * exact same value across several renders — so React's dependency
 * comparison never saw a change after the very first step advance,
 * and the effect that schedules the next timer never ran again. The
 * fix here is structural: step advancement is a reducer transition
 * keyed directly off state, not a value a component effect has to
 * infer strict inequality from.
 */

export type AnalysisStatus = "analysing" | "result_ready" | "error";

export interface AnalysisMachineState {
  status: AnalysisStatus;
  /** Choreography index — meaningful only while status is
   * "analysing"; frozen at whatever it was when status changed. */
  currentStep: number;
  /** Sanitized, user-safe text only — never a raw error/stack. See
   * request-decision.ts, the one place a raw error is read and turned
   * into this string. */
  errorMessage: string | null;
}

export type AnalysisMachineEvent =
  | { type: "STEP_ADVANCE"; totalSteps: number }
  | { type: "REQUEST_SUCCEEDED" }
  | { type: "REQUEST_FAILED"; message: string }
  | { type: "RETRY" };

export function createInitialAnalysisMachineState(): AnalysisMachineState {
  return { status: "analysing", currentStep: 0, errorMessage: null };
}

export function analysisMachineReducer(state: AnalysisMachineState, event: AnalysisMachineEvent): AnalysisMachineState {
  switch (event.type) {
    case "STEP_ADVANCE": {
      // Once resolved (either way), a timer firing late — e.g. one
      // whose cleanup should have fired but raced with a state update —
      // must never resurrect "analysing" or move currentStep. This is
      // the direct guard against the "stale closure" / "timer
      // lifecycle" failure classes named in the bug report.
      if (state.status !== "analysing") return state;
      const next = Math.min(state.currentStep + 1, event.totalSteps - 1);
      if (next === state.currentStep) return state;
      return { ...state, currentStep: next };
    }

    case "REQUEST_SUCCEEDED":
      // A failed request only leaves "error" via an explicit RETRY —
      // a request that happens to resolve successfully after the user
      // has already been shown an error (a very late, superseded
      // response) must not silently overwrite that.
      if (state.status === "error") return state;
      return { ...state, status: "result_ready" };

    case "REQUEST_FAILED":
      return { status: "error", currentStep: state.currentStep, errorMessage: event.message };

    case "RETRY":
      return createInitialAnalysisMachineState();

    default:
      return state;
  }
}
