import { ArrowRight } from "lucide-react";
import { Display, Eyebrow, Lede, Section, Shell } from "@/components/editorial/primitives";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * The brief's §18 commercial entry points — Decision Sprint / Team /
 * Enterprise — routed through the existing /contact inquiry flow
 * (founding_tester / enterprise) rather than a new commerce system, per
 * "reuse the existing platform logic." No price is shown anywhere on
 * this page; the brief is explicit that showing a fake one would be
 * worse than showing none.
 */
export default function CommercialPaths({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const c = dict.commercialSection;
  const tiers = [
    { ...c.tiers.sprint, href: `/${locale}/contact?type=founding_tester` },
    { ...c.tiers.team, href: `/${locale}/contact?type=enterprise` },
    { ...c.tiers.enterprise, href: `/${locale}/contact?type=enterprise` },
  ];

  return (
    <Section size="lg" tone="sunken">
      <Shell>
        <div className="max-w-[44rem]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {c.heading}
          </Display>
          <Lede className="mt-7">{c.body}</Lede>
        </div>

        <div className="mt-14 grid gap-px border border-rule bg-rule sm:grid-cols-3">
          {tiers.map((tier) => (
            <a key={tier.name} href={tier.href} className="group flex flex-col bg-paper p-7 transition-colors duration-control hover:bg-paper-2">
              <span className="font-mono text-label font-medium text-ink-3 uppercase">{tier.name}</span>
              <h3 className="mt-4 text-lg font-medium text-ink">{tier.tagline}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink-2">{tier.body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-transform duration-control ease-nova-settle group-hover:translate-x-0.5">
                {tier.cta}
                <ArrowRight size={14} />
              </span>
            </a>
          ))}
        </div>
      </Shell>
    </Section>
  );
}
