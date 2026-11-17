import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Display, Eyebrow, IllustrativeLabel, Lede, Section, Shell } from "@/components/editorial/primitives";
import { EXAMPLE_DECISIONS } from "@/components/showcase/example-decisions";
import { JOURNEY_DECISION } from "@/components/landing/journey-content";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * The brief's §10 Sample Decisions index — every illustrative decision
 * on the site, in one scannable list, so a visitor can see there are
 * nine worked examples (not one flagship and nothing else) without
 * opening each one first. Every row is explicitly labelled "Sample
 * decision" — the brief's required disclosure — rather than left to be
 * inferred from the page it links to.
 */
export default function SampleDecisions({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const s = dict.sampleDecisionsSection;

  return (
    <Section size="lg">
      <Shell>
        <div className="max-w-[44rem]">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {s.heading}
          </Display>
          <Lede className="mt-7">{s.body}</Lede>
        </div>

        <ul className="mt-12 border-t border-rule">
          {EXAMPLE_DECISIONS.map((decision) => {
            const isFlagship = decision.title === JOURNEY_DECISION.title;
            return (
              <li key={decision.id} className="border-b border-rule">
                <Link href={`/${locale}/examples#${decision.id}`} className="group grid gap-3 py-7 transition-colors duration-control sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-[1.0625rem] font-medium tracking-[-0.015em] text-ink transition-colors duration-control group-hover:text-accent">
                        {decision.title}
                      </h3>
                      <IllustrativeLabel>{isFlagship ? s.flagshipLabel : s.sampleLabel}</IllustrativeLabel>
                    </div>
                    <p className="mt-2 max-w-[62ch] text-sm leading-6 text-ink-2">{decision.question}</p>
                  </div>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="hidden shrink-0 self-center text-ink-3 transition-transform duration-control ease-nova-settle group-hover:translate-x-1 group-hover:text-accent sm:block"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Shell>
    </Section>
  );
}
