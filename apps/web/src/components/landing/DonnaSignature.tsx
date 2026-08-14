"use client";

/**
 * Replaces the old NarrativeSequence — an 11-card numbered grid that
 * explained Donna's process instead of letting anyone feel it. This is
 * a single, scroll-triggered, passive sequence: nothing to type,
 * nothing to click. It plays once when it enters the viewport and
 * settles, mirroring the exact same beats (and the same ScoreRing
 * component) as the real AnalysingState → ResultPanel flow later in
 * the product, so what a visitor watches here is a true preview, not a
 * different invented experience. Explicitly labeled illustrative, same
 * disclosure convention as DonnaLive's own example-question demo.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Check } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { ScoreRing } from "@/components/donna-ai/shared";
import { interpolate } from "@/i18n/interpolate";
import { useLocale } from "@/i18n/LocaleProvider";

// The recommended product name in this illustrative example is a real
// ClouDonna platform name (never translated, like every other
// product/vendor name in this app) — not sourced from the dictionary.
const RECOMMENDATION_NAME = "SAP Business Data Cloud";
const DONNA_SCORE = 91;
const CONFIDENCE_SCORE = 88;

const STAGES = ["question", "thinking", "evidence", "confidence", "recommendation"] as const;
type Stage = (typeof STAGES)[number];
// Delay before advancing FROM stage i TO stage i+1.
const STAGE_DELAY_MS = [500, 900, 1200, 1000];

export default function DonnaSignature() {
  const { dict } = useLocale();
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!inView || stageIndex >= STAGES.length - 1) return;
    const timer = window.setTimeout(() => setStageIndex((index) => index + 1), STAGE_DELAY_MS[stageIndex]);
    return () => window.clearTimeout(timer);
  }, [inView, stageIndex]);

  const stage: Stage = inView ? STAGES[stageIndex] : "question";
  const atLeast = (target: Stage) => STAGES.indexOf(stage) >= STAGES.indexOf(target);

  return (
    <section className="relative overflow-hidden bg-void px-6 py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 motion-safe:animate-aurora-drift">
        <div className="absolute top-0 left-1/2 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-aurora-secondary/15 blur-[140px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">
          {dict.donnaSignature.badge}
        </div>
        <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{dict.donnaSignature.h2}</h2>

        <div className="mt-14 overflow-hidden rounded-[2rem] border border-titanium bg-carbon text-left shadow-nova-glow">
          <div className="min-h-[22rem] p-8 sm:p-10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-titanium bg-carbon-2 text-[10px] font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">
                {dict.donnaSignature.youLabel}
              </div>
              <p className="mt-1.5 text-base leading-7 text-nova-ink">{dict.donnaSignature.question}</p>
            </div>

            <div className="mt-8 flex items-start gap-3">
              <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nova-accent text-white">
                {atLeast("recommendation") ? <Check size={16} /> : <Bot size={16} />}
                {atLeast("thinking") && !atLeast("recommendation") && (
                  <span className="absolute inset-0 rounded-full border border-nova-accent-strong motion-safe:animate-nova-breathe" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {atLeast("thinking") && !atLeast("evidence") && (
                  <p className="text-sm font-medium text-nova-ink-faint motion-safe:animate-in motion-safe:fade-in duration-panel ease-nova-settle">
                    {dict.donnaSignature.reading}
                  </p>
                )}

                {atLeast("evidence") && (
                  <div className="space-y-2">
                    {dict.donnaSignature.evidence.map((line, index) => (
                      <div
                        key={line}
                        className="flex items-center gap-2 text-sm text-nova-ink-muted motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-1 duration-panel ease-nova-settle"
                        style={{ animationDelay: `${index * 140}ms`, animationFillMode: "backwards" }}
                      >
                        <Check size={13} className="shrink-0 text-nova-success" />
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                {atLeast("confidence") && !atLeast("recommendation") && (
                  <p className="mt-4 text-sm font-medium text-nova-accent-strong motion-safe:animate-in motion-safe:fade-in duration-panel ease-nova-settle">
                    {dict.donnaSignature.weighing}
                  </p>
                )}

                {atLeast("recommendation") && (
                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-nova-success/25 bg-nova-success/10 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-panel ease-nova-settle">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold tracking-[0.1em] text-nova-success uppercase">{dict.donnaSignature.recommendationFormed}</div>
                      <div className="mt-1 font-semibold text-nova-ink">{RECOMMENDATION_NAME}</div>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <ScoreRing value={DONNA_SCORE} label={dict.donnaSignature.donnaScoreLabel} emphasize />
                      <ScoreRing value={CONFIDENCE_SCORE} label={dict.donnaSignature.confidenceLabel} />
                    </div>
                  </div>
                )}

                <div role="status" aria-live="polite" className="sr-only">
                  {atLeast("recommendation")
                    ? interpolate(dict.donnaSignature.srRecommendation, { name: RECOMMENDATION_NAME, confidence: CONFIDENCE_SCORE })
                    : atLeast("confidence")
                      ? dict.donnaSignature.srWeighing
                      : atLeast("evidence")
                        ? dict.donnaSignature.srEvidence
                        : dict.donnaSignature.srReading}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-nova-ink-faint">
          {dict.donnaSignature.illustrativeNote}{" "}
          <Link href="/discovery" className="font-medium text-nova-accent-strong hover:text-nova-ink">
            {dict.donnaSignature.methodologyLink}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
