import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { COST_VALUE_SCENARIO } from "@/components/showcase/cost-value-scenario";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.costValueLabPage.metaTitle}: ClouDonna`;
  const description = dict.costValueLabPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/cost-value-lab"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const EXPOSURE_STYLE: Record<string, string> = {
  "mostly fixed": "border-nova-success/30 bg-nova-success/10 text-nova-success",
  mixed: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  "mostly variable": "border-sunset-coral/30 bg-sunset-coral/10 text-sunset-coral",
};

export default async function CostValueLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const c = dict.costValueLabPage;
  const s = dict.showcase;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {c.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{c.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{c.sub}</p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl px-6 pb-16">
        <div className="rounded-3xl border border-titanium bg-carbon p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-titanium bg-carbon-2 px-3 py-1 text-[10px] font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">
              {s.illustrativeLabel}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-nova-ink">{COST_VALUE_SCENARIO.title}</h2>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {COST_VALUE_SCENARIO.parameters.map((parameter) => (
              <span key={parameter} className="rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs text-nova-ink-muted">
                {parameter}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.driversHeading}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {COST_VALUE_SCENARIO.drivers.map((driver) => (
              <div key={driver.label} className="rounded-2xl border border-titanium bg-carbon p-5">
                <h3 className="font-semibold text-nova-ink">{driver.label}</h3>
                <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{driver.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.profilesHeading}</h2>
          <div className="mt-4 space-y-4">
            {COST_VALUE_SCENARIO.profiles.map((profile) => (
              <div key={profile.platform} className="rounded-2xl border border-titanium bg-carbon p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-nova-ink">{profile.platform}</h3>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${EXPOSURE_STYLE[profile.exposure]}`}>
                    {c.exposureLabel}: {profile.exposure}
                  </span>
                </div>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{c.commitmentLabel}</dt>
                    <dd className="mt-1 text-sm leading-6 text-nova-ink-muted">{profile.commitmentNote}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{c.dataMovementLabel}</dt>
                    <dd className="mt-1 text-sm leading-6 text-nova-ink-muted">{profile.dataMovementNote}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.06em] text-nova-ink-faint uppercase">{c.operationsLabel}</dt>
                    <dd className="mt-1 text-sm leading-6 text-nova-ink-muted">{profile.operationsNote}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-titanium bg-carbon-2 p-6">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.notComparableHeading}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-nova-ink-muted">
            {COST_VALUE_SCENARIO.notComparable.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{c.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{c.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {c.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
