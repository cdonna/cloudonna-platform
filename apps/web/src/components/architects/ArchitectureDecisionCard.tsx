"use client";

/**
 * Same print-only-this-element technique as ExecutiveBrief.tsx (see
 * globals.css's .print-target rule) — reused here rather than
 * reinvented. Reuses dict.executiveBrief's generic print/close/date
 * labels instead of adding duplicate ones under architectsPage.
 */
import { useState } from "react";
import { Printer, X } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ArchitectureDecisionExample } from "./catalog";

export function ArchitectureDecisionCard({ example }: { example: ArchitectureDecisionExample }) {
  const { dict } = useLocale();
  const a = dict.architectsPage;
  const b = dict.executiveBrief;
  const [printOpen, setPrintOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-titanium bg-carbon p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-nova-ink">{example.title}</h3>
        <button
          type="button"
          onClick={() => setPrintOpen(true)}
          aria-label={b.printLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-titanium text-nova-ink-faint transition hover:border-titanium-strong hover:text-nova-ink"
        >
          <Printer size={14} />
        </button>
      </div>

      <dl className="mt-4 space-y-3 text-sm leading-6">
        <div>
          <dt className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.contextLabel}</dt>
          <dd className="mt-1 text-nova-ink-muted">{example.context}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.decisionLabel}</dt>
          <dd className="mt-1 text-nova-ink-muted">{example.decision}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{a.consequencesLabel}</dt>
          <dd className="mt-1 text-nova-ink-muted">{example.consequences}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-2xl border border-titanium bg-carbon-2 p-4">
        <div className="text-xs font-semibold tracking-[0.08em] text-nova-accent-strong uppercase">{a.executiveLabel}</div>
        <p className="mt-1.5 text-sm leading-6 text-nova-ink-muted">{example.executiveTranslation}</p>
      </div>

      {printOpen && (
        <div className="print-target fixed inset-0 z-50 overflow-y-auto bg-white text-[#14171f]">
          <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
            <span className="text-sm font-semibold">{example.title}</span>
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
                onClick={() => setPrintOpen(false)}
                aria-label={b.closeLabel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-[#14171f] transition hover:bg-black/5"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-2xl px-8 py-10">
            <div className="text-xs font-semibold tracking-[0.14em] text-black/50 uppercase">ClouDonna · {a.badge}</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{example.title}</h1>

            <PrintSection title={a.contextLabel}>{example.context}</PrintSection>
            <PrintSection title={a.decisionLabel}>{example.decision}</PrintSection>
            <PrintSection title={a.consequencesLabel}>{example.consequences}</PrintSection>
            <PrintSection title={a.executiveLabel}>{example.executiveTranslation}</PrintSection>
          </div>
        </div>
      )}
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: string }) {
  return (
    <div className="mt-6 break-inside-avoid">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-black/50 uppercase">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-black/80">{children}</p>
    </div>
  );
}
