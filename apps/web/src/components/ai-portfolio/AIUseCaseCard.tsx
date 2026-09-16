"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { AIUseCase } from "./catalog";

export function AIUseCaseCard({ useCase }: { useCase: AIUseCase }) {
  const { dict } = useLocale();
  const p = dict.aiPortfolioPage;

  return (
    <details className="group rounded-2xl border border-titanium bg-carbon p-5 open:bg-carbon-2">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="block text-sm font-semibold text-nova-ink">{useCase.name}</span>
        <span className="mt-1 block text-xs leading-5 text-nova-ink-muted">{useCase.description}</span>
      </summary>

      <div className="mt-4 space-y-3 text-xs leading-5">
        <div>
          <div className="font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{p.businessValueLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{useCase.businessValue}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{p.dataReadinessLabel}</div>
            <p className="mt-1 text-nova-ink-muted">{useCase.dataReadiness}</p>
          </div>
          <div>
            <div className="font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{p.riskLabel}</div>
            <p className="mt-1 text-nova-ink-muted">{useCase.risk}</p>
          </div>
          <div>
            <div className="font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{p.effortLabel}</div>
            <p className="mt-1 text-nova-ink-muted">{useCase.effort}</p>
          </div>
          <div>
            <div className="font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{p.timeToValueLabel}</div>
            <p className="mt-1 text-nova-ink-muted">{useCase.timeToValue}</p>
          </div>
        </div>
        <div>
          <div className="font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{p.strategicRelevanceLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{useCase.strategicRelevance}</p>
        </div>
        <div className="rounded-xl border border-titanium bg-carbon-2 p-3">
          <div className="font-semibold tracking-[0.06em] text-nova-accent-strong uppercase">{p.governanceNoteLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{useCase.governanceNote}</p>
        </div>
      </div>
    </details>
  );
}
