import "server-only";

/**
 * Mirrors intelligence/select-provider.ts exactly: one place decides
 * which concrete ResearchProvider is active, reusing the SAME
 * OPENAI_API_KEY and IntelligenceConfig the narrative-enrichment path
 * already loads — no new environment variable, no new secret, no new
 * third-party account. If no key is configured, research is honestly
 * unavailable (deterministicResearchProvider), never faked.
 */
import type { IntelligenceConfig } from "../intelligence/config";
import type { ResearchProvider } from "./provider";
import { deterministicResearchProvider } from "./providers/deterministic-research-provider";
import { createOpenAIResearchProvider } from "./providers/openai-research-provider";

export function selectResearchProvider(config: IntelligenceConfig): ResearchProvider {
  if (config.provider === "openai" && config.apiKey) {
    return createOpenAIResearchProvider(config);
  }
  return deterministicResearchProvider;
}
