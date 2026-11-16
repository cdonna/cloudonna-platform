import { Display, Eyebrow, Section, Shell } from "@/components/editorial/primitives";
import type { Dictionary } from "@/i18n/dictionary";

/**
 * Explicitly not an icon grid. The brief rules one out, and an icon grid
 * would also be the wrong shape for this content: these four are rules
 * with consequences, not features with benefits, so each gets a row, a
 * hairline, and room for a sentence that can actually be read.
 *
 * Replaces EnterpriseIntelligence.tsx (three bordered cards, one lucide
 * icon each, an ambient cyan glow behind them).
 */
export default function ProductPrinciples({ dict }: { dict: Dictionary }) {
  const p = dict.principles;
  const items = [p.items.explainable, p.items.evidenceBased, p.items.adaptive, p.items.remembering];

  return (
    <Section size="lg" id="principles">
      <Shell>
        <div className="max-w-[40rem]">
          <Eyebrow>{p.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {p.heading}
          </Display>
        </div>

        <dl className="mt-16 border-t border-rule">
          {items.map((item, index) => (
            <div
              key={item.label}
              className="grid gap-3 border-b border-rule py-9 lg:grid-cols-[4rem_14rem_1fr] lg:items-baseline lg:gap-10"
            >
              <dt className="font-mono text-label font-medium text-ink-3 tabular-nums uppercase lg:order-first">
                {String(index + 1).padStart(2, "0")}
              </dt>
              <dt className="text-display-3 font-medium tracking-[-0.02em] text-ink">{item.label}</dt>
              <dd className="max-w-[48ch] text-[0.9375rem] leading-7 text-ink-2">{item.body}</dd>
            </div>
          ))}
        </dl>
      </Shell>
    </Section>
  );
}
