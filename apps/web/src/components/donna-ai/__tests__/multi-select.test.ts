import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE } from "../data";
import { wizardReducer } from "../engine";

/**
 * TOGGLE_GOAL is the actual mechanism the multi-select "goals" question
 * is built on (see intake/AdaptiveIntake.tsx's buildFieldAction) — the
 * P0 multi-select bug was never in this reducer (it has always been a
 * correct toggle); it was in AdaptiveIntake's own activeField
 * derivation auto-advancing after a single selection. That fix isn't
 * unit-testable directly (no component-rendering harness in this repo
 * — see the Founder report's disclosure on this), but the reducer
 * behavior the fix depends on being correct is fully testable here.
 */
describe("TOGGLE_GOAL — the multi-select mechanism", () => {
  it("selects a goal that wasn't previously chosen", () => {
    const next = wizardReducer(EMPTY_WIZARD_STATE, { type: "TOGGLE_GOAL", value: "modernization" });
    expect(next.goals.goals).toEqual(["modernization"]);
  });

  it("selecting a second goal keeps the first — a real multi-select, not a replace", () => {
    let state = wizardReducer(EMPTY_WIZARD_STATE, { type: "TOGGLE_GOAL", value: "modernization" });
    state = wizardReducer(state, { type: "TOGGLE_GOAL", value: "governance" });
    expect(state.goals.goals).toEqual(["modernization", "governance"]);
  });

  it("toggling an already-selected goal deselects only that one, leaving the rest untouched", () => {
    let state = wizardReducer(EMPTY_WIZARD_STATE, { type: "TOGGLE_GOAL", value: "modernization" });
    state = wizardReducer(state, { type: "TOGGLE_GOAL", value: "governance" });
    state = wizardReducer(state, { type: "TOGGLE_GOAL", value: "cost-reduction" });
    state = wizardReducer(state, { type: "TOGGLE_GOAL", value: "governance" }); // deselect
    expect(state.goals.goals).toEqual(["modernization", "cost-reduction"]);
  });

  it("selections persist across unrelated dispatches — a multi-select choice isn't reset by answering a different field", () => {
    let state = wizardReducer(EMPTY_WIZARD_STATE, { type: "TOGGLE_GOAL", value: "modernization" });
    state = wizardReducer(state, { type: "SET_LANDSCAPE_FIELD", field: "erp", value: "sap-s4hana" });
    state = wizardReducer(state, { type: "SET_CONSTRAINT_FIELD", field: "budget", value: "moderate" });
    expect(state.goals.goals).toEqual(["modernization"]);
  });

  it("selecting every goal option is a real, order-preserving accumulation, not a set that silently caps or reorders", () => {
    const allGoals = ["modernization", "business-ai", "planning", "governance", "data-products", "cost-reduction", "compliance", "innovation"] as const;
    let state = EMPTY_WIZARD_STATE;
    for (const goal of allGoals) {
      state = wizardReducer(state, { type: "TOGGLE_GOAL", value: goal });
    }
    expect(state.goals.goals).toEqual(allGoals);
  });
});
