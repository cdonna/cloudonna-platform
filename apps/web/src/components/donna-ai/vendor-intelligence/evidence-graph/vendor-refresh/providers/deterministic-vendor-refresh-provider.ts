/**
 * The always-available fallback VendorRefreshProvider. There is no
 * deterministic way to "research the live web" — this provider does
 * not pretend to. Honestly reports retrieval_failed, the same
 * discipline as research/providers/deterministic-research-provider.ts.
 */
import type { VendorRefreshProvider } from "../provider";
import type { VendorRefreshResult } from "../types";

export const deterministicVendorRefreshProvider: VendorRefreshProvider = {
  id: "vendor-refresh-disabled",
  model: null,

  async retrieveAndExtract(): Promise<VendorRefreshResult> {
    return { status: "retrieval_failed", reason: "No vendor refresh provider is configured." };
  },
};
