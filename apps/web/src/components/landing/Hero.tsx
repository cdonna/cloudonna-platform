import { Display, Eyebrow, Lede, PrimaryAction, SecondaryAction, Shell } from "@/components/editorial/primitives";
import { JOURNEY_DECISION } from "@/components/landing/journey-content";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * The hero is now calm by construction: warm paper, no ambient glow
 * field, no gradient button, nothing animated. What filled it before —
 * three drifting blur circles, a pill badge, a gradient-to-coral CTA
 * with a violet glow shadow — is gone, and the space it occupied is now
 * actual whitespace.
 *
 * It ends on the decision the rest of the page works through, stated as
 * a line of the product's own interface rather than as marketing copy,
 * which is what makes the transition into 01 Understand continuous
 * rather than a scroll into a different website.
 */
export default function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const h = dict.hero;

  return (
    <section className="bg-paper pt-16 pb-0 sm:pt-24 lg:pt-32">
      <Shell>
        <div className="max-w-[46rem]">
          <Eyebrow>{h.eyebrow}</Eyebrow>

          <Display level={1} size={1} className="mt-8">
            {h.h1}
            <br />
            <span className="text-ink-2">{h.h1Second}</span>
          </Display>

          <Lede className="mt-8 max-w-[34rem]">{h.sub}</Lede>

          <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-3">
            <PrimaryAction href={`/${locale}/early-access`}>{h.ctaPrimary}</PrimaryAction>
            <SecondaryAction href={`/${locale}/donna-ai`}>{h.ctaSecondary}</SecondaryAction>
          </div>

          <p className="mt-10 font-mono text-label font-medium text-ink-3 uppercase">{h.tagline}</p>
        </div>
      </Shell>

      {/* The handoff into the product story: the decision the entire page
          follows, shown as the workspace's own header line. */}
      <Shell className="mt-20 sm:mt-28">
        <div className="border-t border-rule pt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-mono text-label font-medium text-ink-3 uppercase">{dict.journey.sub}</p>
            <p className="text-sm text-ink-2">{JOURNEY_DECISION.question}</p>
          </div>
        </div>
      </Shell>
    </section>
  );
}
