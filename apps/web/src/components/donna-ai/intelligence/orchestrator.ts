/**
 * RecommendationOrchestrator: the composition root for the intelligence
 * pipeline. Sequences validate → compute → retrieve → enrich → validate →
 * merge, and owns every fallback decision — no other module in this
 * domain decides what happens when enrichment fails. See
 * docs/intelligence/fallback-and-failure-model.md.
 */
import { decisionEngine } from "../decision-engine";
import type { AuditSink } from "./audit";
import { noopAuditSink } from "./audit";
import { ENRICHMENT_FAILURE_REASONS } from "./errors";
import type { KnowledgeProvider } from "./knowledge-provider";
import { deterministicKnowledgeProvider } from "./knowledge-provider";
import type { IntelligenceProvider } from "./provider";
import { deterministicIntelligenceProvider } from "./providers/deterministic-provider";
import type { RateLimiter } from "./rate-limit";
import { noopRateLimiter } from "./rate-limit";
import { sanitizeNotesWithMetadata } from "./sanitize";
import {
  decisionInputSchema,
  findUnsupportedNumericClaims,
  findUnsupportedVendorMentions,
  intelligenceEnrichmentSchema,
  validateEvidenceReferences,
} from "./schema";
import type {
  DecisionInput,
  DecisionReport,
  DeterministicDecisionOutput,
  IntelligenceRequest,
  IntelligenceResult,
} from "./types";

export interface RecommendationOrchestrator {
  createDecision(input: DecisionInput, options?: { rateLimitKey?: string }): Promise<DecisionReport>;
}

export interface OrchestratorConfig {
  intelligenceProvider: IntelligenceProvider;
  knowledgeProvider: KnowledgeProvider;
  /** Wall-clock budget for IntelligenceProvider.enrich(). The bundled
   * deterministic provider never approaches this — it exists for future
   * network-bound providers, and is exercised by tests via a
   * deliberately-slow fake provider. */
  enrichmentTimeoutMs: number;
  /** Seam, not a production system — see rate-limit.ts. Defaults to
   * always-allow, which is an honest reflection of today's reality (no
   * abuse protection is actually enforced yet), not a fake limit. */
  rateLimiter: RateLimiter;
  /** Seam, not a wired sink — see audit.ts. Defaults to a no-op. */
  auditSink: AuditSink;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  intelligenceProvider: deterministicIntelligenceProvider,
  knowledgeProvider: deterministicKnowledgeProvider,
  enrichmentTimeoutMs: 8000,
  rateLimiter: noopRateLimiter,
  auditSink: noopAuditSink,
};

/**
 * Races a promise against a timer. Deliberately does NOT catch the
 * promise's own rejection — that propagates to the caller so
 * createDecision's try/catch can tell "the provider threw" (→
 * "unavailable") apart from "the timer won" (→ "timeout"). Swallowing
 * both into the same outcome was a real bug caught by this phase's own
 * tests — see orchestrator.test.ts, "falls back cleanly when the
 * provider throws" vs "...times out".
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<{ timedOut: true } | { timedOut: false; value: T }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ timedOut: true }), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve({ timedOut: false, value });
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function buildReport(
  output: DeterministicDecisionOutput,
  provider: IntelligenceProvider,
  fallback: { status: keyof typeof ENRICHMENT_FAILURE_REASONS } | { status: "ok" },
  enrichment: DecisionReport["enrichment"] = null,
): DecisionReport {
  return {
    output,
    enrichment,
    provider: { providerId: provider.id, model: provider.model },
    fallback:
      fallback.status === "ok"
        ? { status: "ok", reason: null }
        : { status: fallback.status, reason: ENRICHMENT_FAILURE_REASONS[fallback.status] },
    generatedAt: new Date().toISOString(),
  };
}

export function createRecommendationOrchestrator(
  config: OrchestratorConfig = DEFAULT_ORCHESTRATOR_CONFIG,
): RecommendationOrchestrator {
  return {
    async createDecision(input: DecisionInput, options: { rateLimitKey?: string } = {}): Promise<DecisionReport> {
      const startedAt = Date.now();

      // 0. Rate limit — checked before any real work happens. A rejection
      // here throws, same as a validation failure: this is a caller-side
      // condition ("you're calling too fast"), not a provider outcome, so
      // it doesn't produce a degraded-but-successful DecisionReport.
      const rateLimitKey = options.rateLimitKey ?? "anonymous";
      const rateLimitResult = await config.rateLimiter.checkAndConsume(rateLimitKey);
      if (!rateLimitResult.allowed) {
        throw new Error(rateLimitResult.reason ?? "Rate limit exceeded.");
      }

      // 1. Validate input — a validation failure here is a caller bug
      // (malformed WizardState), not a runtime provider condition, so it
      // throws rather than silently falling back.
      decisionInputSchema.parse(input);

      // 2. Deterministic compute — the ONLY source of scores, ranking,
      // and structured evidence. Never touched by anything below this line.
      const output = decisionEngine.run(input.wizardState);
      const resolvedOutput = await Promise.resolve(output);

      // 3. Retrieval — bounded evidence, never the full catalog.
      const evidence = config.knowledgeProvider.buildEvidencePackage(input, resolvedOutput);

      const emitAudit = (status: DecisionReport["fallback"]["status"], noteMeta: ReturnType<typeof sanitizeNotesWithMetadata>) => {
        config.auditSink({
          timestamp: new Date().toISOString(),
          providerId: config.intelligenceProvider.id,
          model: config.intelligenceProvider.model,
          enrichmentStatus: status,
          sanitizedNoteCount: noteMeta.notes.length,
          sanitizedNoteTotalLength: noteMeta.notes.reduce((sum, n) => sum + n.length, 0),
          shortlistSize: evidence.shortlist.length,
          anyNoteFlaggedAsInstructionLike: noteMeta.anyFlaggedAsInstructionLike,
          durationMs: Date.now() - startedAt,
        });
      };

      // 4. Build the minimized request — sanitized notes only, never raw
      // wizard state, never the full evidence package's internal-only
      // fields beyond what IntelligenceRequest declares.
      const noteMeta = sanitizeNotesWithMetadata([
        input.wizardState.company.note,
        input.wizardState.landscape.note,
        input.wizardState.goals.note,
        input.wizardState.constraints.note,
      ]);
      const request: IntelligenceRequest = { evidence, sanitizedNotes: noteMeta.notes };

      if (evidence.shortlist.length === 0) {
        emitAudit("invalid_output", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "invalid_output" });
      }

      // 5. Enrich, with a hard timeout budget.
      let raced: { timedOut: true } | { timedOut: false; value: IntelligenceResult };
      try {
        raced = await withTimeout<IntelligenceResult>(
          config.intelligenceProvider.enrich(request),
          config.enrichmentTimeoutMs,
        );
      } catch {
        emitAudit("unavailable", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "unavailable" });
      }

      if (raced.timedOut) {
        emitAudit("timeout", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "timeout" });
      }

      const result = raced.value;

      if (result.status !== "ok") {
        // rate_limited / unavailable / disabled / invalid_output all pass
        // straight through — the provider already classified its own failure.
        emitAudit(result.status, noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: result.status });
      }

      // 6. Validate the response whole — no partial acceptance.
      const shapeCheck = intelligenceEnrichmentSchema.safeParse(result.enrichment);
      if (!shapeCheck.success) {
        emitAudit("invalid_output", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "invalid_output" });
      }

      const knownPlatformIds = new Set(evidence.shortlist.map((p) => p.id));
      const referenceCheck = validateEvidenceReferences(shapeCheck.data.evidenceReferences, knownPlatformIds);
      if (!referenceCheck.valid) {
        emitAudit("invalid_output", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "invalid_output" });
      }

      const knownScores = new Set<number>([
        resolvedOutput.donnaScore,
        resolvedOutput.confidenceScore,
        ...evidence.shortlist.flatMap((p) => [p.overallScore, ...p.dimensionScores.map((d) => d.score)]),
      ]);
      const unsupportedClaims = findUnsupportedNumericClaims(shapeCheck.data, knownScores);
      if (unsupportedClaims.length > 0) {
        emitAudit("invalid_output", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "invalid_output" });
      }

      const shortlistProductNames = new Set(evidence.shortlist.map((p) => p.name));
      const unsupportedVendorMentions = findUnsupportedVendorMentions(shapeCheck.data, shortlistProductNames);
      if (unsupportedVendorMentions.length > 0) {
        emitAudit("invalid_output", noteMeta);
        return buildReport(resolvedOutput, config.intelligenceProvider, { status: "invalid_output" });
      }

      // 7. Merge — narrative only. `output` is passed through byte-for-byte.
      emitAudit("ok", noteMeta);
      return buildReport(resolvedOutput, config.intelligenceProvider, { status: "ok" }, shapeCheck.data);
    },
  };
}

export const recommendationOrchestrator = createRecommendationOrchestrator();
