/**
 * Runtime validation for every boundary-crossing shape in this domain,
 * using Zod (the one new dependency this phase adds — justified in
 * docs/intelligence/donna-intelligence-architecture.md, "Why Zod": it's
 * the schema library OpenAI's own structured-output helpers are written
 * against, so the same schema will define both the future provider
 * request and this validation gate, rather than maintaining two).
 *
 * This is the enforcement point for every rule in the brief's "Runtime
 * validation" section: bounded text, bounded arrays, valid evidence
 * references, and — critically — no numeric score field anywhere in
 * IntelligenceEnrichment.
 */
import { z } from "zod";
import { VENDOR_CATALOG } from "../vendor-intelligence/catalog";

/**
 * Single source of truth for every bound in IntelligenceEnrichment.
 * Providers (deterministic-provider.ts today, any future provider later)
 * import this to build responses that fit by construction, rather than
 * guessing at limits the schema alone enforces.
 */
export const ENRICHMENT_BOUNDS = {
  currentSituation: 800,
  businessOutcomes: 600,
  decisionDrivers: { maxItems: 5, maxLen: 150 },
  recommendationNarrative: 1000,
  alternativeNarrative: 600,
  keyTradeOffs: { maxItems: 5, maxLen: 200 },
  risksNarrative: 600,
  opportunitiesNarrative: 600,
  assumptionsNarrative: 500,
  missingInformation: { maxItems: 5, maxLen: 150 },
  validationQuestions: { maxItems: 5, maxLen: 150 },
  challengeQuestions: { maxItems: 5, maxLen: 150 },
  suggestedNextStepsNarrative: 500,
  suggestedWorkshopsNarrative: 500,
  executiveSummary: 800,
  confidenceExplanation: 400,
  evidenceReferences: { maxItems: 10 },
  disclosure: 300,
} as const;

const shortText = (max: number) => z.string().trim().min(1).max(max);
const narrativeArray = (maxItems: number, maxLen: number) => z.array(shortText(maxLen)).max(maxItems);

/**
 * Deliberately NOT z.record/z.any anywhere in this schema — every field is
 * named and bounded. An enrichment payload with an extra, unexpected
 * field (e.g. a stray "score" or "confidence" number the model added on
 * its own) fails validation by virtue of Zod's default strict-unknown-key
 * behavior via .strict() below, not because someone remembered to check
 * for it.
 */
export const intelligenceEnrichmentSchema = z
  .object({
    currentSituation: shortText(ENRICHMENT_BOUNDS.currentSituation),
    businessOutcomes: shortText(ENRICHMENT_BOUNDS.businessOutcomes),
    decisionDrivers: narrativeArray(ENRICHMENT_BOUNDS.decisionDrivers.maxItems, ENRICHMENT_BOUNDS.decisionDrivers.maxLen),
    recommendationNarrative: shortText(ENRICHMENT_BOUNDS.recommendationNarrative),
    alternativeNarrative: shortText(ENRICHMENT_BOUNDS.alternativeNarrative),
    keyTradeOffs: narrativeArray(ENRICHMENT_BOUNDS.keyTradeOffs.maxItems, ENRICHMENT_BOUNDS.keyTradeOffs.maxLen),
    risksNarrative: shortText(ENRICHMENT_BOUNDS.risksNarrative),
    opportunitiesNarrative: shortText(ENRICHMENT_BOUNDS.opportunitiesNarrative),
    assumptionsNarrative: shortText(ENRICHMENT_BOUNDS.assumptionsNarrative),
    missingInformation: narrativeArray(ENRICHMENT_BOUNDS.missingInformation.maxItems, ENRICHMENT_BOUNDS.missingInformation.maxLen),
    validationQuestions: narrativeArray(ENRICHMENT_BOUNDS.validationQuestions.maxItems, ENRICHMENT_BOUNDS.validationQuestions.maxLen),
    challengeQuestions: narrativeArray(ENRICHMENT_BOUNDS.challengeQuestions.maxItems, ENRICHMENT_BOUNDS.challengeQuestions.maxLen),
    suggestedNextStepsNarrative: shortText(ENRICHMENT_BOUNDS.suggestedNextStepsNarrative),
    suggestedWorkshopsNarrative: shortText(ENRICHMENT_BOUNDS.suggestedWorkshopsNarrative),
    executiveSummary: shortText(ENRICHMENT_BOUNDS.executiveSummary),
    confidenceExplanation: shortText(ENRICHMENT_BOUNDS.confidenceExplanation),
    evidenceReferences: z.array(z.string().min(1)).max(ENRICHMENT_BOUNDS.evidenceReferences.maxItems),
    disclosure: shortText(ENRICHMENT_BOUNDS.disclosure),
  })
  .strict();

/**
 * Reference validation: every id in evidenceReferences must exist in the
 * EvidencePackage the enrichment was generated from. Zod validates shape;
 * this function validates the cross-reference Zod's schema alone can't
 * express (it doesn't know the evidence package at schema-definition
 * time).
 */
export function validateEvidenceReferences(
  evidenceReferences: string[],
  knownPlatformIds: ReadonlySet<string>,
): { valid: true } | { valid: false; unknownIds: string[] } {
  const unknownIds = evidenceReferences.filter((id) => !knownPlatformIds.has(id));
  return unknownIds.length === 0 ? { valid: true } : { valid: false, unknownIds };
}

/**
 * Content-bound heuristic: a number that looks like it's trying to state
 * a score/percentage that doesn't correspond to any dimension score
 * actually present in the evidence package. Best-effort, not a
 * guarantee — see docs/intelligence/fallback-and-failure-model.md.
 */
export function findUnsupportedNumericClaims(
  enrichment: Pick<
    z.infer<typeof intelligenceEnrichmentSchema>,
    "recommendationNarrative" | "alternativeNarrative" | "executiveSummary"
  >,
  knownScores: ReadonlySet<number>,
): string[] {
  const percentPattern = /(\d{1,3})\s*%/g;
  const suspicious: string[] = [];

  // Explicit field list, not Object.entries(enrichment): the caller may
  // legally pass the full IntelligenceEnrichment (a superset of the Pick
  // above), which also contains array fields .matchAll would crash on.
  const fieldsToCheck: Array<["recommendationNarrative" | "alternativeNarrative" | "executiveSummary", string]> = [
    ["recommendationNarrative", enrichment.recommendationNarrative],
    ["alternativeNarrative", enrichment.alternativeNarrative],
    ["executiveSummary", enrichment.executiveSummary],
  ];

  for (const [field, text] of fieldsToCheck) {
    for (const match of text.matchAll(percentPattern)) {
      const value = Number(match[1]);
      if (!knownScores.has(value)) {
        suspicious.push(`${field}: claims ${match[1]}% which does not match any known dimension or overall score`);
      }
    }
  }

  return suspicious;
}

const NARRATIVE_TEXT_FIELDS = [
  "currentSituation",
  "businessOutcomes",
  "recommendationNarrative",
  "alternativeNarrative",
  "risksNarrative",
  "opportunitiesNarrative",
  "assumptionsNarrative",
  "executiveSummary",
] as const;

/**
 * Content-bound heuristic: flags a narrative that names a real catalog
 * product NOT present in the shortlist it was generated from — the
 * "fabricated vendor claim" case named explicitly in the Sprint 5 test
 * requirements. Checks against the full Sprint 3 catalog (not just an
 * arbitrary word list) so this catches an actual product name, not a
 * false positive on an unrelated word. Best-effort, same caveat as
 * findUnsupportedNumericClaims: a paraphrased or misspelled mention
 * would not be caught.
 */
export function findUnsupportedVendorMentions(
  enrichment: Pick<z.infer<typeof intelligenceEnrichmentSchema>, (typeof NARRATIVE_TEXT_FIELDS)[number]>,
  shortlistProductNames: ReadonlySet<string>,
): string[] {
  const outOfShortlistNames = VENDOR_CATALOG.map((p) => p.productName).filter((name) => !shortlistProductNames.has(name));

  const suspicious: string[] = [];
  for (const field of NARRATIVE_TEXT_FIELDS) {
    const text = enrichment[field];
    for (const name of outOfShortlistNames) {
      if (text.includes(name)) {
        suspicious.push(`${field}: mentions "${name}", which is not in this session's shortlist`);
      }
    }
  }
  return suspicious;
}

// ---------------------------------------------------------------------------
// DecisionInput validation — bounds on the free-text fields the wizard
// already collects, enforced before anything downstream touches them.
//
// This bound is deliberately generous (not the ~500 chars that actually
// reach an evidence package or prompt — see sanitize.ts's MAX_NOTE_LENGTH
// for that narrower, product-shaping limit). This one exists only to
// reject pathological payload sizes; ordinary long-but-reasonable input
// is accepted here and gracefully truncated downstream, not rejected —
// see docs/intelligence/fallback-and-failure-model.md, "Excessive input".

export const decisionInputNoteSchema = z.string().max(20_000);

export const decisionInputSchema = z.object({
  wizardState: z.object({
    stepIndex: z.number(),
    company: z.object({ note: decisionInputNoteSchema }).passthrough(),
    landscape: z.object({ note: decisionInputNoteSchema }).passthrough(),
    goals: z.object({ note: decisionInputNoteSchema, goals: z.array(z.string()) }).passthrough(),
    constraints: z.object({ note: decisionInputNoteSchema }).passthrough(),
  }),
  organizationContext: z
    .object({
      organizationId: z.string().nullish(),
      organizationName: z.string().nullish(),
    })
    .nullish(),
  desiredOutcomes: z.array(z.string().max(300)).max(10).optional(),
  architectureContext: z.string().max(2000).nullish(),
  operatingModelContext: z.string().max(2000).nullish(),
});

export type ValidatedDecisionInput = z.infer<typeof decisionInputSchema>;
