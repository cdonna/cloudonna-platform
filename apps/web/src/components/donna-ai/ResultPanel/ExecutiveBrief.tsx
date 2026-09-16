"use client";

/**
 * A board-quality export using the browser's own print engine (print
 * CSS in globals.css's .print-target rule), not a PDF library — same
 * "prefer native browser capabilities" call as everywhere else in this
 * product. Every field here comes straight from DecisionOutput; there
 * is no Decision Owner or Review Date to show because that's real
 * governance state this product doesn't persist yet, so those two
 * fields are printed as blank lines for a human to fill in by hand,
 * never invented.
 */
import type { ReactNode } from "react";
import { Printer, X } from "lucide-react";
import { localizedDimensionLabel } from "@/i18n/dimension-labels";
import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/locales";
import type { DimensionResult, ScoreDimensionKey } from "../scoring/types";
import type { DecisionOutput } from "../types";

const IMPACT_GROUPS: { titleKey: "businessImpactHeading" | "architectureImpactHeading" | "financialImpactHeading"; dimensions: ScoreDimensionKey[] }[] = [
  { titleKey: "businessImpactHeading", dimensions: ["business", "strategic", "aiReadiness"] },
  { titleKey: "architectureImpactHeading", dimensions: ["architecture", "technology", "ecosystem", "governance", "security"] },
  { titleKey: "financialImpactHeading", dimensions: ["cost", "timeToValue"] },
];

export function ExecutiveBrief({ output, onClose }: { output: DecisionOutput; onClose: () => void }) {
  const { dict, locale } = useLocale();
  const b = dict.executiveBrief;
  const generatedOn = new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="print-target fixed inset-0 z-50 overflow-y-auto bg-white text-[#14171f]">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <span className="text-sm font-semibold">{b.openLabel}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#14171f] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Printer size={15} />
            {b.printLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={b.closeLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-[#14171f] transition hover:bg-black/5"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="text-xs font-semibold tracking-[0.14em] text-black/50 uppercase">
          ClouDonna · {b.generatedOnLabel} {generatedOn}
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{output.recommendation.platform.productName}</h1>
        <p className="mt-1 text-sm text-black/60">{output.recommendation.platform.vendor}</p>

        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="font-semibold">{b.donnaScoreLabel}:</span> {output.donnaScore}%
          </div>
          <div>
            <span className="font-semibold">{b.confidenceLabel}:</span> {output.confidenceScore}%
          </div>
        </div>

        <Section title={b.contextHeading}>
          <p>{output.currentSituation}</p>
        </Section>

        <Section title={b.executiveSummaryHeading}>
          <p>{output.executiveSummary}</p>
        </Section>

        <div className="mt-8 grid grid-cols-3 gap-6 break-inside-avoid">
          {IMPACT_GROUPS.map((group) => (
            <ImpactColumn
              key={group.titleKey}
              title={b[group.titleKey]}
              dimensions={output.dimensions.filter((dimension) => group.dimensions.includes(dimension.key))}
              locale={locale}
            />
          ))}
        </div>

        <Section title={b.tradeOffsHeading}>
          <BulletList items={output.concerns.map((item) => item.text)} />
        </Section>

        <Section title={b.risksHeading}>
          <BulletList items={output.risks.map((item) => item.text)} />
        </Section>

        <Section title={b.assumptionsHeading}>
          <BulletList items={output.assumptions.map((item) => item.text)} />
        </Section>

        <Section title={b.alternativesHeading}>
          <BulletList items={output.alternatives.map((alt) => `${alt.platform.productName} (${alt.overallScore}%)`)} />
        </Section>

        <Section title={b.evidenceHeading}>
          <BulletList items={output.positiveEvidence.map((item) => item.text)} />
        </Section>

        <Section title={b.nextActionsHeading}>
          <BulletList items={output.nextSteps.map((item) => item.text)} />
        </Section>

        <div className="mt-10 grid grid-cols-2 gap-8 border-t border-black/10 pt-6 text-sm break-inside-avoid">
          <div>
            <div className="font-semibold">{b.ownerLabel}</div>
            <div className="mt-8 border-b border-black/30" />
          </div>
          <div>
            <div className="font-semibold">{b.reviewDateLabel}</div>
            <div className="mt-8 border-b border-black/30" />
          </div>
        </div>

        <p className="mt-8 text-xs leading-5 text-black/50">{b.disclaimerNote}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8 break-inside-avoid">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-black/50 uppercase">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-black/80">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-black/40">—</p>;
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ImpactColumn({ title, dimensions, locale }: { title: string; dimensions: DimensionResult[]; locale: Locale }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.1em] text-black/50 uppercase">{title}</h3>
      <div className="mt-2 space-y-1.5">
        {dimensions.map((dimension) => (
          <div key={dimension.key} className="flex items-center justify-between text-xs">
            <span className="text-black/70">{localizedDimensionLabel(dimension.key, dimension.label, locale)}</span>
            <span className="font-mono font-semibold">{dimension.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
