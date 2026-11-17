/**
 * The always-available fallback ChallengerProvider — honestly reports
 * no AI-assisted challenges when no provider is configured, exactly
 * like research/providers/deterministic-research-provider.ts. The
 * deterministic challenges in ../deterministic-challenges.ts still run
 * regardless (they need no AI at all), so "Challenge Recommendation"
 * is never empty even with this provider active — only the
 * qualitative (ASSUMPTION/ARCHITECTURE/RISK) challenges are absent.
 */
import type { ChallengeGenerationResult, ChallengerProvider } from "../provider";

export const deterministicChallengerProvider: ChallengerProvider = {
  id: "challenger-disabled",
  model: null,

  async generateChallenges(): Promise<ChallengeGenerationResult> {
    return { status: "disabled", reason: "No challenger provider is configured." };
  },
};
