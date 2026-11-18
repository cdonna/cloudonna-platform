import { describe, expect, it } from "vitest";
import { COMMERCIAL_PACKAGES, DECISION_SPRINT, ENTERPRISE, STRATEGIC_DECISION_PROGRAM, TEAM } from "../packages";

describe("commercial package definitions", () => {
  it("Decision Sprint shows a concrete indicative starting price", () => {
    expect(DECISION_SPRINT.startingAtChf).toBe(25_000);
    expect(DECISION_SPRINT.priceDisplay).toContain("Starting from");
    expect(DECISION_SPRINT.priceDisplay).toContain("25,000");
  });

  it("Team shows a concrete indicative annual starting price", () => {
    expect(TEAM.startingAtChf).toBe(75_000);
    expect(TEAM.priceDisplay).toContain("75,000");
    expect(TEAM.priceDisplay).toContain("year");
  });

  it("Enterprise never shows a fixed public price — Talk to ClouDonna only", () => {
    expect(ENTERPRISE.startingAtChf).toBeNull();
    expect(ENTERPRISE.priceDisplay).toBe("Talk to ClouDonna");
  });

  it("the Strategic Decision Program is not one of the two packages with a dedicated public inquiry type", () => {
    expect(STRATEGIC_DECISION_PROGRAM.hasDedicatedInquiryType).toBe(false);
    expect(ENTERPRISE.hasDedicatedInquiryType).toBe(false);
    expect(DECISION_SPRINT.hasDedicatedInquiryType).toBe(true);
    expect(TEAM.hasDedicatedInquiryType).toBe(true);
  });

  it("every package lists only non-empty, real output descriptions — never an empty promise", () => {
    for (const pkg of Object.values(COMMERCIAL_PACKAGES)) {
      expect(pkg.outputs.length).toBeGreaterThan(0);
      for (const output of pkg.outputs) {
        expect(output.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("COMMERCIAL_PACKAGES is keyed consistently with each definition's own id", () => {
    for (const [key, pkg] of Object.entries(COMMERCIAL_PACKAGES)) {
      expect(pkg.id).toBe(key);
    }
  });
});
