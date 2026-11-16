import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow, Section, Shell } from "@/components/editorial/primitives";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * The entry points into the long-form pages that carry the same
 * illustrative decision further: five worked examples, one editorial
 * case study, the scenario and cost models behind it. A ruled index,
 * not four teaser cards — it is a table of contents, so it looks like
 * one, and the whole row is the target rather than a separate "learn
 * more" link repeating the title next to it.
 */
export default function ExploreMore({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const entries = [
    { label: dict.examplesPage.badge, body: dict.examplesPage.sub, href: `/${locale}/examples` },
    { label: dict.caseStudyPage.badge, body: dict.caseStudyPage.metaDescription, href: `/${locale}/case-study` },
    { label: dict.scenarioLabPage.badge, body: dict.scenarioLabPage.metaDescription, href: `/${locale}/scenario-lab` },
    { label: dict.costValueLabPage.badge, body: dict.costValueLabPage.metaDescription, href: `/${locale}/cost-value-lab` },
  ];

  return (
    <Section size="md" tone="sunken">
      <Shell>
        <Eyebrow>{dict.showcase.exploreMoreLabel}</Eyebrow>

        <ul className="mt-10 border-t border-rule">
          {entries.map((entry) => (
            <li key={entry.href} className="border-b border-rule">
              <Link
                href={entry.href}
                className="group grid gap-3 py-8 transition-colors duration-control lg:grid-cols-[18rem_1fr_auto] lg:items-baseline lg:gap-10"
              >
                <h3 className="text-display-3 font-medium tracking-[-0.02em] text-ink transition-colors duration-control group-hover:text-accent">
                  {entry.label}
                </h3>
                <p className="max-w-[54ch] text-[0.9375rem] leading-7 text-ink-2">{entry.body}</p>
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="text-ink-3 transition-transform duration-control ease-nova-settle group-hover:translate-x-1 group-hover:text-accent lg:justify-self-end"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Shell>
    </Section>
  );
}
