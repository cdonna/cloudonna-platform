/**
 * Challenger Agent V1 — structured-output schema for the AI-assisted
 * challenge generation call. Same whole-response-validation discipline
 * as intelligence/schema.ts and research/schema.ts: `type` is
 * restricted to the three challenge types that genuinely require
 * qualitative judgment (ASSUMPTION/ARCHITECTURE/RISK) — the model is
 * never even offered FINANCIAL_CHALLENGE, EVIDENCE_CHALLENGE,
 * CONSTRAINT_CHALLENGE or ALTERNATIVE_CHALLENGE as options, since
 * those are deterministic by construction (deterministic-challenges.ts)
 * and asking the model for them would just invite it to restate a
 * number with less rigor than the real calculation already has.
 */
import { z } from "zod";

const SCORE_DIMENSION_KEYS = ["architecture", "business", "technology", "governance", "aiReadiness", "security", "ecosystem", "cost", "timeToValue", "strategic"] as const;

export const aiChallengeSchema = z
  .object({
    type: z.enum(["ASSUMPTION_CHALLENGE", "ARCHITECTURE_CHALLENGE", "RISK_CHALLENGE"]),
    statement: z.string().min(1).max(500),
    severity: z.enum(["low", "medium", "high"]),
    /** Must name an option actually present in the context given —
     * validated post-hoc against the real ranking, never trusted
     * outright (same discipline as research's citationIndex check). */
    affectedOptionId: z.string().max(200).nullable(),
    affectedCriterion: z.enum(SCORE_DIMENSION_KEYS).nullable(),
    suggestedValidation: z.string().min(1).max(300),
  })
  .strict();

export const challengerResponseSchema = z
  .object({
    challenges: z.array(aiChallengeSchema).max(8),
  })
  .strict();

export type AiChallenge = z.infer<typeof aiChallengeSchema>;
