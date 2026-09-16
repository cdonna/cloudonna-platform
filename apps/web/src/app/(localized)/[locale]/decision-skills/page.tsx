import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, Building2, Cpu, Handshake, ListOrdered, RefreshCw, ShieldAlert, TrendingUp } from "lucide-react";
import { DECISION_SKILL_CATEGORIES, type DecisionSkillCategoryId } from "@/components/decision-skills/catalog";
import { EXAMPLE_DECISIONS } from "@/components/showcase/example-decisions";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.decisionSkillsPage.metaTitle}: ClouDonna`;
  const description = dict.decisionSkillsPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/decision-skills"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

// One icon per category, cycling the same restrained accent set used
// across the site (coral, amber, violet, electric blue) rather than a
// distinct color per card — a system, not a rainbow.
const ICONS: Record<DecisionSkillCategoryId, typeof Cpu> = {
  "technology-strategy": Cpu,
  investment: TrendingUp,
  vendor: Handshake,
  transformation: RefreshCw,
  risk: ShieldAlert,
  prioritization: ListOrdered,
  "ai-data": Bot,
  "operating-model": Building2,
};

const ACCENT_TEXT = ["text-sunset-coral", "text-sunset-amber", "text-nova-accent-strong", "text-electric-blue"];
const ACCENT_BG = ["bg-sunset-coral/10", "bg-sunset-amber/10", "bg-nova-accent/10", "bg-electric-blue/10"];

export default async function DecisionSkillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.decisionSkillsPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {d.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-nova-ink sm:text-5xl">{d.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{d.sub}</p>
      </div>

      <div className="mx-auto mt-14 max-w-4xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {DECISION_SKILL_CATEGORIES.map((category, index) => {
            const Icon = ICONS[category.id];
            const accentText = ACCENT_TEXT[index % ACCENT_TEXT.length];
            const accentBg = ACCENT_BG[index % ACCENT_BG.length];
            const example = EXAMPLE_DECISIONS.find((decision) => decision.decisionSkills.includes(category.id));

            return (
              <details key={category.id} className="group rounded-3xl border border-titanium bg-carbon p-6 open:bg-carbon-2">
                <summary className="flex cursor-pointer list-none items-start gap-4 [&::-webkit-details-marker]:hidden">
                  <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl ${accentBg} ${accentText}`}>
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-nova-ink">{category.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-nova-ink-muted">{category.description}</span>
                  </span>
                </summary>

                <div className="mt-5 flex flex-wrap gap-1.5 pl-[3.75rem]">
                  {category.examples.map((exampleLabel) => (
                    <span
                      key={exampleLabel}
                      className="rounded-full border border-titanium bg-carbon px-3 py-1 text-xs text-nova-ink-faint"
                    >
                      {exampleLabel}
                    </span>
                  ))}
                </div>

                {example && (
                  <div className="mt-4 pl-[3.75rem]">
                    <Link
                      href={`/${locale}/examples#${example.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-nova-accent-strong transition duration-control hover:text-nova-ink"
                    >
                      {d.exampleLinkLabel}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </details>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{d.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{d.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {d.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
