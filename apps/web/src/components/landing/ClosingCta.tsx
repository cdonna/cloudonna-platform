import { Display, Eyebrow, Lede, PrimaryAction, SecondaryAction, Section, Shell } from "@/components/editorial/primitives";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * The closing dark beat. One of exactly two full-width dark sections on
 * the homepage (the other is 05 Remember) — dark here because this is
 * where the page stops explaining and asks for something, and because a
 * dark close reads as an ending rather than another band.
 */
export default function ClosingCta({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const c = dict.closing;

  return (
    <Section size="lg" register="dark">
      <Shell>
        <div className="max-w-[46rem]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <Display size={1} className="mt-8">
            {c.heading}
          </Display>
          <Lede className="mt-8 max-w-[38rem]">{c.body}</Lede>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
            <PrimaryAction href={`/${locale}/early-access`}>{c.ctaPrimary}</PrimaryAction>
            <SecondaryAction href={`/${locale}/donna-ai`}>{c.ctaSecondary}</SecondaryAction>
          </div>
        </div>
      </Shell>
    </Section>
  );
}
