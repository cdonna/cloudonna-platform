import "server-only";

/** Mirrors intelligence/select-provider.ts and
 * research/select-research-provider.ts exactly — the same
 * OPENAI_API_KEY, no new secret, honest fallback when unconfigured. */
import type { IntelligenceConfig } from "../../intelligence/config";
import type { ChallengerProvider } from "./provider";
import { deterministicChallengerProvider } from "./providers/deterministic-challenger-provider";
import { createOpenAIChallengerProvider } from "./providers/openai-challenger-provider";

export function selectChallengerProvider(config: IntelligenceConfig): ChallengerProvider {
  if (config.provider === "openai" && config.apiKey) {
    return createOpenAIChallengerProvider(config);
  }
  return deterministicChallengerProvider;
}
