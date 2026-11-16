import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Display, Eyebrow, Lede, Section, Shell } from "@/components/editorial/primitives";
import { EvidenceTag, type EvidenceType } from "@/components/showcase/EvidenceTag";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/** In the exact order dict.trustCenterPage.evidenceCategories already
 * lists them — see that array's own six entries (Official source,
 * Customer input, Observed data, Calculated, AI interpretation,
 * Assumption). Reusing it here means this strip and the Trust Center
 * can never describe the same evidence type two different ways. */
const TYPES: EvidenceType[] = ["official-source", "customer-input", "observed-data", "calculated", "ai-interpretation", "assumption"];

/**
 * The brief's §14 Trust System taxonomy, surfaced directly on the
 * homepage — the same six EvidenceTag types the Trust Center, every
 * example decision, and 02 Evidence above all use, so a visitor who
 * never scrolls past the homepage still sees the full taxonomy once,
 * clearly.
 */
export default function EvidenceTaxonomyStrip({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const e = dict.evidenceTaxonomySection;
  const categories = dict.trustCenterPage.evidenceCategories;

  return (
    <Section size="lg">
      <Shell>
        <div className="max-w-[44rem]">
          <Eyebrow>{e.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {e.heading}
          </Display>
          <Lede className="mt-7">{e.body}</Lede>
        </div>

        <dl className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((type, index) => (
            <div key={type} className="bg-paper p-6">
              <EvidenceTag type={type} />
              <dd className="mt-3 text-sm leading-6 text-ink-2">{categories[index]?.body}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          <Link href={`/${locale}/trust`} className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors duration-control hover:text-accent">
            {e.linkLabel}
            <ArrowRight size={14} className="transition-transform duration-control ease-nova-settle group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Shell>
    </Section>
  );
}
