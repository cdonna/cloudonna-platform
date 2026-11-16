"use client";

import { Disclosure, FrameField, FramePanel } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import type { AIUseCase } from "./catalog";

export function AIUseCaseCard({ useCase }: { useCase: AIUseCase }) {
  const { dict } = useLocale();
  const p = dict.aiPortfolioPage;

  return (
    <Disclosure title={useCase.name} summary={useCase.description}>
      <FrameField label={p.businessValueLabel}>{useCase.businessValue}</FrameField>
      <FrameField label={p.strategicRelevanceLabel}>{useCase.strategicRelevance}</FrameField>
      <FrameField label={p.dataReadinessLabel}>{useCase.dataReadiness}</FrameField>
      <FrameField label={p.riskLabel}>{useCase.risk}</FrameField>
      <FrameField label={p.effortLabel}>{useCase.effort}</FrameField>
      <FrameField label={p.timeToValueLabel}>{useCase.timeToValue}</FrameField>

      <FramePanel tone="accent" className="sm:col-span-2">
        <FrameField label={p.governanceNoteLabel}>{useCase.governanceNote}</FrameField>
      </FramePanel>
    </Disclosure>
  );
}
