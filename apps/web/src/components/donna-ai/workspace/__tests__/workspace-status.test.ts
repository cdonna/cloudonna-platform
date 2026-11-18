import { describe, expect, it } from "vitest";
import { deriveWorkspaceStatus, type WorkspaceStatusInput } from "../workspace-status";

const BASE: WorkspaceStatusInput = {
  decisionStatus: "saved",
  hasEngineResult: true,
  readinessLevel: "MEDIUM",
  hasHumanDecision: false,
  implementationStarted: false,
  realizedOutcomeKnown: false,
};

describe("deriveWorkspaceStatus", () => {
  it("prioritizes ARCHIVED regardless of any other signal", () => {
    expect(deriveWorkspaceStatus({ ...BASE, decisionStatus: "archived", hasHumanDecision: true, realizedOutcomeKnown: true })).toBe("ARCHIVED");
  });

  it("moves through the lifecycle in the expected priority order", () => {
    expect(deriveWorkspaceStatus({ ...BASE, hasEngineResult: false })).toBe("DRAFT");
    expect(deriveWorkspaceStatus({ ...BASE, readinessLevel: "LOW" })).toBe("FRAMING");
    expect(deriveWorkspaceStatus({ ...BASE, readinessLevel: "MEDIUM" })).toBe("ANALYZING");
    expect(deriveWorkspaceStatus({ ...BASE, readinessLevel: "HIGH" })).toBe("READY_FOR_REVIEW");
    expect(deriveWorkspaceStatus({ ...BASE, hasHumanDecision: true })).toBe("DECIDED");
    expect(deriveWorkspaceStatus({ ...BASE, hasHumanDecision: true, implementationStarted: true })).toBe("IMPLEMENTING");
    expect(deriveWorkspaceStatus({ ...BASE, hasHumanDecision: true, implementationStarted: true, realizedOutcomeKnown: true })).toBe("OUTCOME_REVIEW");
  });
});
