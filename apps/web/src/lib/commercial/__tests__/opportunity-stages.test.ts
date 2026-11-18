import { describe, expect, it } from "vitest";
import { CLOSED_STAGES, DEFAULT_STAGE_PROBABILITY_PERCENT, OPEN_STAGES, OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "../opportunity-stages";

describe("opportunity stages", () => {
  it("every stage has a label and a default probability", () => {
    for (const stage of OPPORTUNITY_STAGES) {
      expect(OPPORTUNITY_STAGE_LABELS[stage]).toBeTruthy();
      expect(DEFAULT_STAGE_PROBABILITY_PERCENT[stage]).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_STAGE_PROBABILITY_PERCENT[stage]).toBeLessThanOrEqual(100);
    }
  });

  it("closed_won is 100% and closed_lost is 0%", () => {
    expect(DEFAULT_STAGE_PROBABILITY_PERCENT.closed_won).toBe(100);
    expect(DEFAULT_STAGE_PROBABILITY_PERCENT.closed_lost).toBe(0);
  });

  it("OPEN_STAGES and CLOSED_STAGES partition the full stage list with no overlap", () => {
    expect(OPEN_STAGES.length + CLOSED_STAGES.length).toBe(OPPORTUNITY_STAGES.length);
    for (const stage of OPEN_STAGES) expect(CLOSED_STAGES).not.toContain(stage);
  });

  it("probability generally increases later in the sales-led stage progression", () => {
    expect(DEFAULT_STAGE_PROBABILITY_PERCENT.inquiry).toBeLessThan(DEFAULT_STAGE_PROBABILITY_PERCENT.qualified);
    expect(DEFAULT_STAGE_PROBABILITY_PERCENT.qualified).toBeLessThan(DEFAULT_STAGE_PROBABILITY_PERCENT.discovery);
    expect(DEFAULT_STAGE_PROBABILITY_PERCENT.discovery).toBeLessThan(DEFAULT_STAGE_PROBABILITY_PERCENT.sprint_committed);
  });
});
