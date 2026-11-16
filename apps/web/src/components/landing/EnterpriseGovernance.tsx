import Link from "next/link";
import { ArrowRight, Lock, ScrollText, ShieldCheck } from "lucide-react";
import { Display, Eyebrow, Lede, Section, Shell } from "@/components/editorial/primitives";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

const ICONS = [ShieldCheck, ScrollText, Lock];

/**
 * The brief's §12/§14 "Enterprise Security / Governance" homepage
 * section — three factual claims already stated and kept true
 * elsewhere in this product (Row Level Security, deterministic
 * scoring, an auditable record), not a new subsystem invented for this
 * section. Deliberately short: the Trust Center is where this gets
 * argued in full; this is the three-sentence version a CISO reads on
 * the way past.
 */
export default function EnterpriseGovernance({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const g = dict.governanceSection;

  return (
    <Section size="lg" tone="sunken">
      <Shell>
        <div className="max-w-[44rem]">
          <Eyebrow>{g.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {g.heading}
          </Display>
          <Lede className="mt-7">{g.body}</Lede>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {g.points.map((point, index) => {
            const Icon = ICONS[index];
            return (
              <div key={point.label} className="rounded-lg border border-rule bg-paper p-6">
                <Icon size={18} className="text-gold" />
                <h3 className="mt-4 text-sm font-semibold tracking-[0.04em] text-ink uppercase">{point.label}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-2">{point.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <Link
            href={`/${locale}/trust`}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors duration-control hover:text-gold"
          >
            {g.linkLabel}
            <ArrowRight size={14} className="transition-transform duration-control ease-nova-settle group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Shell>
    </Section>
  );
}
