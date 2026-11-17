import { describe, expect, it } from "vitest";
import { buildDecisionOutput } from "../../engine";
import { SAMPLE_PROFILE } from "../../data";
import { applyScenarioToOutput } from "../apply-scenario";

describe("applyScenarioToOutput", () => {
  it("returns the exact same output when given no overrides", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const result = applyScenarioToOutput(SAMPLE_PROFILE, output, {});
    expect(result).toBe(output);
  });

  it("never mutates the base output object it was given", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const snapshot = JSON.parse(JSON.stringify(output));
    applyScenarioToOutput(SAMPLE_PROFILE, output, { cost: 0.5 });
    expect(JSON.parse(JSON.stringify(output))).toEqual(snapshot);
  });

  it("recomputes donnaScore and dimensions consistently with the new winner", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const [leader, runnerUp] = [output.recommendation, ...output.alternatives];
    const pivot = leader.dimensions.find((d) => {
      const runnerDim = runnerUp.dimensions.find((rd) => rd.key === d.key);
      return runnerDim && runnerDim.score > d.score;
    })!;

    const scenario = applyScenarioToOutput(SAMPLE_PROFILE, output, { [pivot.key]: 0.95 });
    expect(scenario.recommendation.platform.id).toBe(runnerUp.platform.id);
    expect(scenario.donnaScore).toBe(scenario.recommendation.overallScore);
    expect(scenario.dimensions).toEqual(scenario.recommendation.dimensions);
  });

  it("attaches a fresh engineResult reflecting the scenario ranking, not the base ranking", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const [leader, runnerUp] = [output.recommendation, ...output.alternatives];
    const pivot = leader.dimensions.find((d) => {
      const runnerDim = runnerUp.dimensions.find((rd) => rd.key === d.key);
      return runnerDim && runnerDim.score > d.score;
    })!;

    const scenario = applyScenarioToOutput(SAMPLE_PROFILE, output, { [pivot.key]: 0.95 });
    expect(scenario.engineResult!.recommendedOption.id).toBe(runnerUp.platform.id);
  });

  it("every dimension's weight in the result sums to 1 after reweighting", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const scenario = applyScenarioToOutput(SAMPLE_PROFILE, output, { cost: 0.4 });
    const total = scenario.recommendation.dimensions.reduce((sum, d) => sum + d.weight, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it("is deterministic for identical input", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const a = applyScenarioToOutput(SAMPLE_PROFILE, output, { governance: 0.3 });
    const b = applyScenarioToOutput(SAMPLE_PROFILE, output, { governance: 0.3 });
    expect(a).toEqual(b);
  });
});
