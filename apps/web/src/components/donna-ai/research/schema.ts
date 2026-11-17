/**
 * Research Agent V1 — structured-output schema for the claim
 * extraction call, and request-boundary schemas for the API routes.
 * Same whole-response-validation discipline as
 * intelligence/schema.ts: nothing from this call is trusted until it
 * passes this schema AND the provider's own citation-index check.
 */
import { z } from "zod";

const SCORE_DIMENSION_KEYS = ["architecture", "business", "technology", "governance", "aiReadiness", "security", "ecosystem", "cost", "timeToValue", "strategic"] as const;

/** Deliberately does NOT ask the model for criterionId/optionId — both
 * are already known from the ResearchTask that triggered this call
 * (the task is itself scoped to one option/criterion). Asking the
 * model to re-derive them would only add a second, less reliable path
 * to a fact the pipeline already has, and a surface for it to drift
 * from the real task. The provider injects them after extraction. */
export const extractedClaimSchema = z
  .object({
    claim: z.string().min(1).max(600),
    citationIndex: z.number().int().min(0),
    type: z.enum(["official-source", "ai-interpretation", "observed-data"]),
    interpretation: z.string().max(600).nullable(),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

export const extractedConflictSchema = z
  .object({
    claimIndexA: z.number().int().min(0),
    claimIndexB: z.number().int().min(0),
    severity: z.enum(["low", "medium", "high"]),
    explanation: z.string().min(1).max(500),
  })
  .strict();

/** The full structured output of one claim-extraction call. Bounded
 * array sizes — a single research task's output never needs to be
 * large, and an oversized response is itself a signal something is
 * wrong, not a case to accommodate. */
export const claimExtractionResponseSchema = z
  .object({
    claims: z.array(extractedClaimSchema).max(20),
    conflicts: z.array(extractedConflictSchema).max(10),
  })
  .strict();

export type ExtractedClaim = z.infer<typeof extractedClaimSchema>;
export type ClaimExtractionResponse = z.infer<typeof claimExtractionResponseSchema>;

// ---------------------------------------------------------------------------
// API request boundaries

export const researchPlanRequestSchema = z
  .object({
    decisionId: z.string().uuid(),
    criterionId: z.enum(SCORE_DIMENSION_KEYS).optional(),
    optionId: z.string().max(200).optional(),
  })
  .strict();

export const researchRunRequestSchema = z
  .object({
    decisionId: z.string().uuid(),
    criterionId: z.enum(SCORE_DIMENSION_KEYS).optional(),
    optionId: z.string().max(200).optional(),
  })
  .strict();
