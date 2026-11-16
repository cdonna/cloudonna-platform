"use client";

import { Disclosure, FrameField, FramePanel, Tag } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import type { DataProduct } from "./catalog";

export function DataProductCard({ product }: { product: DataProduct }) {
  const { dict } = useLocale();
  const d = dict.dataEconomyPage;

  return (
    <Disclosure title={product.name} summary={product.description}>
      <FrameField label={d.ownerLabel}>{product.owner}</FrameField>

      <FrameField label={d.consumersLabel}>
        <div className="flex flex-wrap gap-1.5">
          {product.consumers.map((consumer) => (
            <Tag key={consumer}>{consumer}</Tag>
          ))}
        </div>
      </FrameField>

      <FrameField label={d.aiRelevanceLabel}>{product.aiRelevance}</FrameField>

      <FrameField label={d.qualityRiskLabel}>{product.qualityRisk}</FrameField>

      <FramePanel tone="accent">
        <FrameField label={d.businessValueLabel}>{product.businessValue}</FrameField>
      </FramePanel>

      <FrameField label={d.decisionDependencyLabel}>{product.decisionDependency}</FrameField>
    </Disclosure>
  );
}
