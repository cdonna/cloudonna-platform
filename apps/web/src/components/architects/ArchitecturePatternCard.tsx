"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { ArchitecturePattern } from "./architecture-patterns";

export function ArchitecturePatternCard({ pattern }: { pattern: ArchitecturePattern }) {
  const { dict } = useLocale();
  const a = dict.architectsPage;

  return (
    <details className="group rounded-3xl border border-titanium bg-carbon p-6 open:bg-carbon-2">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="block font-semibold text-nova-ink">{pattern.name}</span>
        <span className="mt-1.5 block text-sm leading-6 text-nova-ink-muted">{pattern.purpose}</span>
      </summary>

      <div className="mt-5 space-y-4 text-sm leading-6">
        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.problemLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{pattern.problem}</p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.componentsLabel}</div>
          <ul className="mt-1.5 space-y-1">
            {pattern.components.map((item) => (
              <li key={item} className="flex gap-2 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{dict.executiveBrief.tradeOffsHeading}</div>
          <ul className="mt-1.5 space-y-1">
            {pattern.tradeOffs.map((item) => (
              <li key={item} className="flex gap-2 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.whoCaresLabel}:</span>
          {pattern.whoShouldCare.map((role) => (
            <span key={role} className="rounded-full border border-titanium bg-carbon px-2.5 py-0.5 text-xs text-nova-ink-muted">
              {role}
            </span>
          ))}
        </div>

        <div className="rounded-2xl border border-titanium bg-carbon-2 p-4">
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-accent-strong uppercase">{a.cfoNoteLabel}</div>
          <p className="mt-1.5 text-nova-ink-muted">{pattern.cfoNote}</p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.whatChangesLabel}</div>
          <p className="mt-1 text-nova-ink-muted">{pattern.whatChangesIt}</p>
        </div>
      </div>
    </details>
  );
}
