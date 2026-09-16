"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { ArchitectureTransformation } from "./architecture-transformations";

export function ArchitectureTransformationCard({ transformation }: { transformation: ArchitectureTransformation }) {
  const { dict } = useLocale();
  const a = dict.architectsPage;

  return (
    <div className="rounded-3xl border border-titanium bg-carbon p-6 sm:p-8">
      <h3 className="font-semibold text-nova-ink">{transformation.title}</h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-titanium bg-carbon-2 p-5">
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.beforeLabel}</div>
          <ul className="mt-3 space-y-1.5">
            {transformation.beforeItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sunset-coral" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-nova-accent/30 bg-nova-accent/5 p-5">
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-accent-strong uppercase">{a.afterLabel}</div>
          <ul className="mt-3 space-y-1.5">
            {transformation.afterItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.architectureImpactLabel}</div>
          <p className="mt-1.5 text-sm leading-6 text-nova-ink-muted">{transformation.architectureImpact}</p>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.businessImpactLabel}</div>
          <p className="mt-1.5 text-sm leading-6 text-nova-ink-muted">{transformation.businessImpact}</p>
        </div>
      </div>
    </div>
  );
}
