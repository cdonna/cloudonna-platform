/**
 * Live-provider test — makes a REAL call to OpenAI, costs real tokens,
 * requires a real OPENAI_API_KEY. Excluded from the default test run by
 * vitest.config.mts's `**\/*.live.test.ts` pattern; only runs when
 * DONNA_AI_RUN_LIVE_TESTS is set AND a real key is present. Never runs in
 * normal CI. See docs/intelligence/testing-strategy.md, "Live-provider
 * tests".
 *
 * To run: DONNA_AI_RUN_LIVE_TESTS=1 OPENAI_API_KEY=sk-... npx vitest run
 * src/components/donna-ai/intelligence/__tests__/openai-provider.live.test.ts
 */
import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { loadIntelligenceConfig } from "../config";
import { deterministicKnowledgeProvider } from "../knowledge-provider";
import { createOpenAIIntelligenceProvider } from "../providers/openai-provider";
import { intelligenceEnrichmentSchema } from "../schema";

const hasRealKey = Boolean(process.env.OPENAI_API_KEY);

describe.skipIf(!hasRealKey)("createOpenAIIntelligenceProvider — live", () => {
  it("returns a schema-valid enrichment from a real OpenAI call", async () => {
    const config = loadIntelligenceConfig();
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage({ wizardState: SAMPLE_PROFILE }, output);
    const provider = createOpenAIIntelligenceProvider(config);

    const result = await provider.enrich({ evidence, sanitizedNotes: [] });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(intelligenceEnrichmentSchema.safeParse(result.enrichment).success).toBe(true);
    }
  }, 20_000);
});
