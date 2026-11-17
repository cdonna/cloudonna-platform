import "server-only";

/**
 * Mirrors research/select-research-provider.ts exactly: one place
 * decides which concrete VendorRefreshProvider is active, reusing the
 * SAME OPENAI_API_KEY/IntelligenceConfig every other AI-assisted path
 * already loads — no new environment variable, no new secret.
 */
import type { IntelligenceConfig } from "../../../intelligence/config";
import type { VendorRefreshProvider } from "./provider";
import { deterministicVendorRefreshProvider } from "./providers/deterministic-vendor-refresh-provider";
import { createOpenAIVendorRefreshProvider } from "./providers/openai-vendor-refresh-provider";

export function selectVendorRefreshProvider(config: IntelligenceConfig): VendorRefreshProvider {
  if (config.provider === "openai" && config.apiKey) {
    return createOpenAIVendorRefreshProvider(config);
  }
  return deterministicVendorRefreshProvider;
}
