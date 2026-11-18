"use client";

import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Display, Eyebrow, Lede, Section, Shell } from "@/components/editorial/primitives";
import { getAnalyticsProvider } from "@/lib/analytics/config";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * Commercial Engine V1 (brief §6) — Decision Sprint / Team / Enterprise,
 * each routed to its own inquiry type (decision_sprint / team /
 * enterprise) rather than reusing founding_tester, now that each has
 * distinct qualification fields (InquiryForm's own progressive logic).
 * Pricing is shown as indicative "starting from" entry points, never a
 * fixed price or a self-service checkout (brief §7) — ClouDonna stays
 * enterprise-sales-led throughout.
 */
export default function CommercialPaths({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const c = dict.commercialSection;
  const tiers = [
    { ...c.tiers.sprint, href: `/${locale}/contact?type=decision_sprint`, eventName: "decision_sprint_clicked" },
    { ...c.tiers.team, href: `/${locale}/contact?type=team`, eventName: "team_clicked" },
    { ...c.tiers.enterprise, href: `/${locale}/contact?type=enterprise`, eventName: "enterprise_clicked" },
  ];

  useEffect(() => {
    getAnalyticsProvider().trackEvent({ name: "commercial_section_viewed" });
  }, []);

  return (
    <Section size="lg" tone="sunken">
      <Shell>
        <div className="max-w-[44rem]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {c.heading}
          </Display>
          <Lede className="mt-7">{c.valueProp}</Lede>
          <p className="mt-4 text-sm leading-6 text-ink-2">{c.body}</p>
        </div>

        <div className="mt-14 grid gap-px border border-rule bg-rule sm:grid-cols-3">
          {tiers.map((tier) => (
            <a
              key={tier.name}
              href={tier.href}
              onClick={() => getAnalyticsProvider().trackEvent({ name: tier.eventName })}
              className="group flex flex-col bg-paper p-7 transition-colors duration-control hover:bg-paper-2"
            >
              <span className="font-mono text-label font-medium text-ink-3 uppercase">{tier.name}</span>
              <h3 className="mt-4 text-lg font-medium text-ink">{tier.tagline}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink-2">{tier.body}</p>
              <span className="mt-5 text-sm font-medium text-ink">{tier.priceLabel}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-transform duration-control ease-nova-settle group-hover:translate-x-0.5">
                {tier.cta}
                <ArrowRight size={14} />
              </span>
            </a>
          ))}
        </div>

        <p className="mt-6 text-xs text-ink-3">{c.priceDisclosureNote}</p>
      </Shell>
    </Section>
  );
}
