"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { DataProduct } from "./catalog";

export function DataProductCard({ product }: { product: DataProduct }) {
  const { dict } = useLocale();
  const d = dict.dataEconomyPage;

  return (
    <details className="group rounded-3xl border border-titanium bg-carbon p-6 open:bg-carbon-2">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="block font-semibold text-nova-ink">{product.name}</span>
        <span className="mt-1.5 block text-sm leading-6 text-nova-ink-muted">{product.description}</span>
      </summary>

      <div className="mt-5 space-y-4 text-sm leading-6">
        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{d.ownerLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{product.owner}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{d.consumersLabel}:</span>
          {product.consumers.map((consumer) => (
            <span key={consumer} className="rounded-full border border-titanium bg-carbon px-2.5 py-0.5 text-xs text-nova-ink-muted">
              {consumer}
            </span>
          ))}
        </div>

        <div className="rounded-2xl border border-titanium bg-carbon-2 p-4">
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-accent-strong uppercase">{d.businessValueLabel}</div>
          <p className="mt-1.5 text-nova-ink-muted">{product.businessValue}</p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{d.aiRelevanceLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{product.aiRelevance}</p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{d.qualityRiskLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{product.qualityRisk}</p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{d.decisionDependencyLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{product.decisionDependency}</p>
        </div>
      </div>
    </details>
  );
}
