/**
 * VendorRefreshProvider — the seam between the deterministic vendor-
 * refresh pipeline and whatever actually performs live retrieval.
 * The same Model Router pattern already proven three times
 * (IntelligenceProvider, ResearchProvider, ChallengerProvider) applied
 * a fourth time — vendor-refresh-orchestrator.ts depends only on this
 * interface, never on the OpenAI SDK directly.
 */
import type { VendorRefreshResult, VendorRefreshTask } from "./types";

export interface VendorRefreshProvider {
  readonly id: string;
  readonly model: string | null;
  retrieveAndExtract(task: VendorRefreshTask): Promise<VendorRefreshResult>;
}
