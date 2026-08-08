import { AlertCircle, Check, MessageCircleQuestion, Sparkles } from "lucide-react";
import { SectionLabel } from "../shared";
import type { DecisionReport } from "../intelligence/types";

/**
 * Renders `DecisionReport.enrichment` when present and valid, or a clear,
 * accessible "unavailable" state otherwise — never a blank tab, never a
 * spinner that never resolves. See docs/intelligence/decision-report-contract.md.
 *
 * Every field here is narrative only. The scores and ranking this tab
 * references are rendered elsewhere (OverviewTab, AlternativesTab) from
 * `DecisionReport.output` — unchanged, unaffected by anything in this file.
 */
export function IntelligenceTab({ report }: { report: DecisionReport }) {
  if (report.fallback.status !== "ok" || !report.enrichment) {
    return (
      <div role="status" aria-live="polite" className="rounded-2xl border border-dashed border-titanium bg-carbon-2 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-carbon-2 text-nova-ink-faint">
          <AlertCircle size={22} />
        </div>
        <h4 className="mt-4 font-semibold text-nova-ink">AI enrichment unavailable</h4>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-nova-ink-faint">
          {report.fallback.reason ?? "AI enrichment was not available for this result."}
        </p>
        <p className="mx-auto mt-4 max-w-md text-xs leading-5 text-nova-ink-faint">
          Your Donna Score, ranking and evidence above are complete and unaffected — they were
          computed before enrichment was attempted and do not depend on it.
        </p>
      </div>
    );
  }

  const { enrichment } = report;
  const platformNamesById = new Map(
    [report.output.recommendation, ...report.output.alternatives].map((ranked) => [
      ranked.platform.id,
      ranked.platform.productName,
    ]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-nova-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-nova-accent-strong">
          <Sparkles size={13} />
          AI-enriched narrative
        </span>
        <span className="text-xs text-nova-ink-faint">{enrichment.disclosure}</span>
      </div>

      <div className="rounded-2xl border border-titanium p-5">
        <SectionLabel>Executive summary</SectionLabel>
        <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.executiveSummary}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Current situation</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.currentSituation}</p>
        </div>
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Business outcomes</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.businessOutcomes}</p>
        </div>
      </div>

      {enrichment.decisionDrivers.length > 0 && (
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Decision drivers</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {enrichment.decisionDrivers.map((driver) => (
              <span key={driver} className="rounded-full bg-carbon-2 px-3 py-1 text-xs font-medium text-nova-ink-muted">
                {driver}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Why this recommendation</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.recommendationNarrative}</p>
        </div>
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Why not the alternative</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.alternativeNarrative}</p>
        </div>
      </div>

      {enrichment.keyTradeOffs.length > 0 && (
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Key trade-offs</SectionLabel>
          <div className="mt-3 space-y-2">
            {enrichment.keyTradeOffs.map((tradeOff) => (
              <p key={tradeOff} className="text-sm leading-6 text-nova-ink-muted">
                {tradeOff}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Risks, in context</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.risksNarrative}</p>
        </div>
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Opportunities, in context</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.opportunitiesNarrative}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-titanium p-5">
        <SectionLabel>Assumptions</SectionLabel>
        <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.assumptionsNarrative}</p>
      </div>

      {enrichment.missingInformation.length > 0 && (
        <div className="rounded-2xl border border-nova-warning/30 bg-nova-warning/10/60 p-5">
          <SectionLabel>What Donna doesn&apos;t know yet</SectionLabel>
          <div className="mt-3 space-y-2">
            {enrichment.missingInformation.map((gap) => (
              <div key={gap} className="flex items-start gap-2 text-sm leading-6 text-nova-ink-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-warning/100" />
                {gap}
              </div>
            ))}
          </div>
        </div>
      )}

      {(enrichment.validationQuestions.length > 0 || enrichment.challengeQuestions.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {enrichment.validationQuestions.length > 0 && (
            <div className="rounded-2xl border border-titanium p-5">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion size={15} className="text-nova-accent-strong" />
                <SectionLabel>Questions to validate</SectionLabel>
              </div>
              <ul className="mt-3 space-y-2">
                {enrichment.validationQuestions.map((question) => (
                  <li key={question} className="text-sm leading-6 text-nova-ink-muted">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {enrichment.challengeQuestions.length > 0 && (
            <div className="rounded-2xl border border-titanium p-5">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion size={15} className="text-nova-accent-strong" />
                <SectionLabel>Questions to challenge this</SectionLabel>
              </div>
              <ul className="mt-3 space-y-2">
                {enrichment.challengeQuestions.map((question) => (
                  <li key={question} className="text-sm leading-6 text-nova-ink-muted">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Suggested next steps</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.suggestedNextStepsNarrative}</p>
        </div>
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Suggested workshops</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.suggestedWorkshopsNarrative}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-titanium bg-carbon-2 p-5">
        <div className="flex items-center gap-2">
          <Check size={15} className="text-nova-success" />
          <SectionLabel>Confidence explanation</SectionLabel>
        </div>
        <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{enrichment.confidenceExplanation}</p>
      </div>

      {enrichment.evidenceReferences.length > 0 && (
        <p className="text-xs text-nova-ink-faint">
          Based on evidence for: {enrichment.evidenceReferences.map((id) => platformNamesById.get(id) ?? id).join(", ")}
        </p>
      )}
    </div>
  );
}
