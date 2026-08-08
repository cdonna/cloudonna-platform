/**
 * Save-boundary validation for POST /api/decisions. Deliberately does
 * NOT re-validate every leaf field of DeterministicDecisionOutput with a
 * duplicate Zod schema — VendorPlatformProfile alone has a dozen-plus
 * fields, and a hand-maintained mirror of it would drift the moment the
 * real type changes, silently becoming either too strict or too
 * permissive. Instead: `output` is never trusted from the client at
 * all. handle-save-decision-request.ts recomputes it server-side via
 * buildDecisionOutput(decisionInput.wizardState) — the same pure,
 * already-tested function every other code path uses — and persists
 * that, not whatever the client sent. This is a stronger guarantee than
 * schema validation could ever provide: it doesn't just check the
 * shape is plausible, it proves the score is the actual, correct,
 * unmodified deterministic output for that input. See
 * docs/sprint-6/21-security-review.md, "Why output is recomputed, not
 * validated."
 *
 * enrichment IS validated against the real intelligenceEnrichmentSchema
 * (imported, not duplicated) — reusing the exact gate Sprint 5's own
 * orchestrator already applies, not a second, parallel one.
 */
import { z } from "zod";
import { decisionInputSchema } from "../intelligence/schema";
import { intelligenceEnrichmentSchema } from "../intelligence/schema";

const providerMetadataSchema = z
  .object({
    providerId: z.string().min(1).max(200),
    model: z.string().max(200).nullable(),
  })
  .strict();

const enrichmentStatusSchema = z.enum(["ok", "disabled", "timeout", "rate_limited", "unavailable", "invalid_output"]);

const fallbackMetadataSchema = z
  .object({
    status: enrichmentStatusSchema,
    reason: z.string().max(500).nullable(),
  })
  .strict();

/** The full POST /api/decisions request body. `output` is deliberately
 * absent from this schema — see the file-level comment. */
export const saveDecisionRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    organizationId: z.string().uuid(),
    workspaceId: z.string().uuid(),
    projectId: z.string().uuid(),
    decisionInput: decisionInputSchema,
    enrichment: intelligenceEnrichmentSchema.nullable(),
    provider: providerMetadataSchema,
    fallback: fallbackMetadataSchema,
    changeReason: z.string().max(500).optional(),
  })
  .strict();

export type SaveDecisionRequest = z.infer<typeof saveDecisionRequestSchema>;
