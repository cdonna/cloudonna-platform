/**
 * Vendor Knowledge Refresh — structured-output schema for the claim
 * extraction call. Same whole-response-validation discipline as
 * research/schema.ts: nothing from this call is trusted until it
 * passes this schema AND the provider's own citation-index check.
 * Deliberately no "type" field (official-source/ai-interpretation) —
 * a vendor-refresh claim is always extracted as a direct restatement
 * of an official source by design (brief §17's official-source
 * priority); a provider that wants to flag its own inference still
 * can via the `confidence` field (never "high" for an inference).
 */
import { z } from "zod";

export const extractedVendorClaimSchema = z
  .object({
    claim: z.string().min(1).max(600),
    citationIndex: z.number().int().min(0),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

export const vendorClaimExtractionResponseSchema = z
  .object({
    claims: z.array(extractedVendorClaimSchema).max(15),
  })
  .strict();

export type ExtractedVendorClaim = z.infer<typeof extractedVendorClaimSchema>;
export type VendorClaimExtractionResponse = z.infer<typeof vendorClaimExtractionResponseSchema>;
