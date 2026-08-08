/**
 * Save-boundary validation for POST /api/decisions/[id]/versions (Sprint
 * 6.2, Slice C). Same shape and reasoning as save-decision-schema.ts's
 * saveDecisionRequestSchema, minus title/organizationId/workspaceId/
 * projectId — an append targets an already-existing decision (its id
 * comes from the URL, its organization/workspace/project are inherited
 * from that decision server-side, never re-submitted or re-validated
 * against a client-supplied value) — plus changeReason, required here
 * rather than optional: an append is explicitly a deliberate re-run of
 * an existing decision, and the human reason for doing so is exactly
 * the provenance this capability exists to preserve.
 *
 * `output` is deliberately absent, for the same reason as the save
 * schema: always recomputed server-side via buildDecisionOutput, never
 * trusted from the client. See docs/sprint-6/21-security-review.md.
 *
 * providerMetadataSchema/fallbackMetadataSchema are intentionally
 * duplicated from save-decision-schema.ts rather than imported — both
 * are ten lines, neither is exported from that file today, and keeping
 * this schema fully self-contained keeps this slice's diff isolated to
 * new files only, per Sprint 6.2's own "no hidden coupling between
 * slices" review finding.
 */
import { z } from "zod";
import { decisionInputSchema, intelligenceEnrichmentSchema } from "../intelligence/schema";

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

export const appendDecisionVersionRequestSchema = z
  .object({
    decisionInput: decisionInputSchema,
    enrichment: intelligenceEnrichmentSchema.nullable(),
    provider: providerMetadataSchema,
    fallback: fallbackMetadataSchema,
    changeReason: z.string().trim().min(1).max(500),
  })
  .strict();

export type AppendDecisionVersionRequest = z.infer<typeof appendDecisionVersionRequestSchema>;
