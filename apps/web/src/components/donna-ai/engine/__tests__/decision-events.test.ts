import { describe, expect, it } from "vitest";
import type { VersionDiff } from "../../persistence/version-diff";
import { classifyCreationEvent, classifyVersionEvent } from "../decision-events";

function emptyDiff(): VersionDiff {
  return {
    fromVersion: 1,
    toVersion: 2,
    changedConstraints: [],
    changedPriorities: { added: [], removed: [] },
    changedVendors: [],
    changedScores: { donnaScore: { from: 70, to: 70, delta: 0 }, confidenceScore: { from: 60, to: 60, delta: 0 }, dimensions: [] },
    changedRecommendations: {
      primary: { changed: false, from: { id: "a", name: "A" }, to: { id: "a", name: "A" } },
      alternative: { changed: false, from: null, to: null },
    },
    changedProvenance: [],
    hasChanges: false,
  };
}

describe("Decision Memory event classification", () => {
  it("classifies decision creation with no override as a single event", () => {
    const events = classifyCreationEvent(null);
    expect(events).toEqual([{ type: "DECISION_CREATED", label: "Decision created" }]);
  });

  it("adds a human-review event when creation already carries an override", () => {
    const events = classifyCreationEvent({ selectedOptionId: "a", rationale: "Confirmed by steering committee." });
    expect(events.map((e) => e.type)).toContain("HUMAN_REVIEW_RECORDED");
  });

  it("classifies a no-op save as a context-updated event, never an empty list", () => {
    const events = classifyVersionEvent(emptyDiff(), null, false);
    expect(events.length).toBeGreaterThan(0);
  });

  it("classifies a changed recommendation distinctly from a mere score change", () => {
    const diff = emptyDiff();
    diff.changedRecommendations.primary = { changed: true, from: { id: "a", name: "A" }, to: { id: "b", name: "B" } };
    const events = classifyVersionEvent(diff, null, false);
    expect(events.map((e) => e.type)).toContain("RECOMMENDATION_CHANGED");
    expect(events.map((e) => e.type)).not.toContain("SCORE_CHANGED");
  });

  it("classifies a scenario save distinctly", () => {
    const events = classifyVersionEvent(emptyDiff(), null, true);
    expect(events.map((e) => e.type)).toContain("SCENARIO_SAVED");
  });

  it("classifies a human override on an appended version", () => {
    const events = classifyVersionEvent(emptyDiff(), { selectedOptionId: "a", rationale: "Approved." }, false);
    expect(events.map((e) => e.type)).toContain("HUMAN_REVIEW_RECORDED");
  });

  it("classifies a constraint/vendor/priority change as context updated", () => {
    const diff = emptyDiff();
    diff.changedVendors = [{ field: "cloud", label: "Cloud provider", from: "AWS", to: "Azure" }];
    const events = classifyVersionEvent(diff, null, false);
    expect(events.map((e) => e.type)).toContain("CONTEXT_UPDATED");
  });

  it("classifies a provenance change as an engine update", () => {
    const diff = emptyDiff();
    diff.changedProvenance = [{ field: "scoringEngineVersion", label: "Scoring engine", from: "v1", to: "v2" }];
    const events = classifyVersionEvent(diff, null, false);
    expect(events.map((e) => e.type)).toContain("ENGINE_UPDATED");
  });
});
