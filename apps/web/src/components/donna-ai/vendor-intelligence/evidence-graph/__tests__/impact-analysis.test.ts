import { describe, expect, it } from "vitest";
import { buildDecisionOutput } from "../../../engine";
import { buildEngineResult } from "../../../engine/recommendation";
import { SAMPLE_PROFILE } from "../../../data";
import { analyzeDecisionImpact } from "../impact-analysis";

const output = buildDecisionOutput(SAMPLE_PROFILE);
const engineResult = buildEngineResult(SAMPLE_PROFILE, output);
const winnerId = engineResult.recommendedOption.id;
const runnerUpId = engineResult.ranking.find((r) => r.id !== winnerId)?.id ?? winnerId;

describe("analyzeDecisionImpact", () => {
  it("produces a draft referencing the real decision and change ids given, never fabricated ones", () => {
    const draft = analyzeDecisionImpact({
      decisionId: "decision-1",
      changeId: "change-1",
      affectedProductSlug: winnerId,
      affectedCapabilityKey: "architecture",
      changeType: "capability_changed",
      engineResult,
    });
    expect(draft.decisionId).toBe("decision-1");
    expect(draft.changeId).toBe("change-1");
    expect(draft.affectedOption).toBe(winnerId);
  });

  it("resolves the affected criterion from the real capability-to-criterion map, not a guess", () => {
    const draft = analyzeDecisionImpact({
      decisionId: "decision-1",
      changeId: "change-1",
      affectedProductSlug: winnerId,
      affectedCapabilityKey: "genai",
      changeType: "capability_changed",
      engineResult,
    });
    expect(draft.affectedCriterion).toBe("aiReadiness");
  });

  it("is never material for an option that is neither the winner nor a top-two alternative", () => {
    // Pick an option deliberately outside the top two, if the catalog
    // has more than two entries (it does — 10 platforms).
    const outsideTopTwo = engineResult.ranking.find((r) => r.id !== winnerId && r.id !== runnerUpId);
    if (!outsideTopTwo) return; // defensive — would only trigger on a 2-platform catalog
    const draft = analyzeDecisionImpact({
      decisionId: "decision-1",
      changeId: "change-1",
      affectedProductSlug: outsideTopTwo.id,
      affectedCapabilityKey: "architecture",
      changeType: "capability_changed",
      engineResult,
    });
    expect(draft.materiality).toBe("low");
    expect(draft.reviewRecommended).toBe(false);
  });

  it("always returns a non-empty recommendationImpact explanation", () => {
    const draft = analyzeDecisionImpact({
      decisionId: "decision-1",
      changeId: "change-1",
      affectedProductSlug: winnerId,
      affectedCapabilityKey: "architecture",
      changeType: "capability_changed",
      engineResult,
    });
    expect(draft.recommendationImpact.length).toBeGreaterThan(0);
  });
});
