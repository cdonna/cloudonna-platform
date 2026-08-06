import "server-only";

/**
 * The one place a config object becomes a concrete provider. Kept
 * separate from config.ts (which only reads environment variables) and
 * from orchestrator.ts (which never imports openai-provider.ts directly)
 * — this is the sole file that imports both the deterministic and OpenAI
 * providers side by side, so the "which one do we use" decision has
 * exactly one home. Server-only, like everything upstream of it.
 */
import type { IntelligenceConfig } from "./config";
import type { IntelligenceProvider } from "./provider";
import { deterministicIntelligenceProvider } from "./providers/deterministic-provider";
import { createOpenAIIntelligenceProvider } from "./providers/openai-provider";

export function selectIntelligenceProvider(config: IntelligenceConfig): IntelligenceProvider {
  if (config.provider === "openai" && config.apiKey) {
    return createOpenAIIntelligenceProvider(config);
  }

  // No API key, or an unrecognized provider value — the deterministic
  // provider is not a fallback bolted on here, it's the actual default:
  // Donna works with zero configuration by design (see
  // docs/intelligence/provider-boundaries.md).
  return deterministicIntelligenceProvider;
}
