"use client";

/**
 * Same print-only-this-element technique as ExecutiveBrief.tsx (see
 * globals.css's .print-target rule) — reused here rather than
 * reinvented. Reuses dict.executiveBrief's generic print/close/date
 * labels instead of adding duplicate ones under architectsPage.
 */
import { useState } from "react";
import { Printer, X } from "lucide-react";
import { FrameField, FramePanel } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ArchitectureDecisionExample } from "./catalog";

export function ArchitectureDecisionCard({ example }: { example: ArchitectureDecisionExample }) {
  const { dict } = useLocale();
  const a = dict.architectsPage;
  const b = dict.executiveBrief;
  const [printOpen, setPrintOpen] = useState(false);

  return (
    <div className="border-t border-rule pt-7">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{example.title}</h3>
        <button
          type="button"
          onClick={() => setPrintOpen(true)}
          aria-label={b.printLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors duration-control hover:bg-paper-3 hover:text-ink focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          <Printer size={15} />
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <FrameField label={a.contextLabel}>{example.context}</FrameField>
        <FrameField label={a.decisionLabel}>{example.decision}</FrameField>
        <FrameField label={a.consequencesLabel}>{example.consequences}</FrameField>

        <FramePanel tone="accent">
          <FrameField label={a.executiveLabel}>{example.executiveTranslation}</FrameField>
        </FramePanel>
      </div>

      {printOpen && (
        <div className="print-target fixed inset-0 z-50 overflow-y-auto bg-white text-[#141311]">
          <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
            <span className="text-sm font-semibold">{example.title}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#141311] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                <Printer size={15} />
                {b.printLabel}
              </button>
              <button
                type="button"
                onClick={() => setPrintOpen(false)}
                aria-label={b.closeLabel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-[#141311] transition hover:bg-black/5"
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
