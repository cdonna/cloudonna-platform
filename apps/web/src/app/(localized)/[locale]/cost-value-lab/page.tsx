import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FrameField,
  IllustrativeLabel,
  PageCta,
  PageHeader,
  ProductFrame,
  RuledList,
  Section,
  SectionHeading,
  Shell,
  Tag,
} from "@/components/editorial/primitives";
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

/**
 * Credible to a CFO means four things this page didn't do before:
 * exposure stated per platform as a real comparison rather than a
 * coloured badge on a card, cost drivers separated from business value,
 * cost of delay named, and the uncertainty stated as prominently as the
 * model itself.
 *
 * The one hard rule: no currency figure appears anywhere on this page
 * (see the catalog's own header comment). A made-up number would make
 * the page look more finished and be worth less than nothing.
 */
const EXPOSURE_TONE: Record<string, string> = {
  "mostly fixed": "text-sig-positive",
  mixed: "text-sig-caution",
  "mostly variable": "text-sig-critical",
};

export default async function CostValueLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const c = dict.costValueLabPage;

  return (
    <main className="bg-paper">
      <PageHeader
        eyebrow={c.badge}
        title={c.h1}
        lede={c.sub}
        aside={
          <div>
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{c.scenarioHeading}</div>
            <p className="mt-4 text-[0.9375rem] leading-7 text-ink">{COST_VALUE_SCENARIO.title}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {COST_VALUE_SCENARIO.parameters.map((parameter) => (
                <Tag key={parameter}>{parameter}</Tag>
              ))}
            </div>
            <div className="mt-6">
              <IllustrativeLabel>{dict.showcase.illustrativeLabel}</IllustrativeLabel>
            </div>
          </div>
        }
      />

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={c.badge} title={c.profilesHeading} note={c.noFiguresNote} />

          {/* Exposure as a table, so four platforms can be compared on
              one dimension at a time — the thing a cost conversation
              actually needs and a grid of cards actively prevents. */}
          <ProductFrame className="mt-12" label={c.profilesHeading} meta={dict.showcase.illustrativeLabel}>
            <table className="hidden w-full border-collapse text-left lg:table">
              <thead>
                <tr className="border-b border-rule">
                  <th scope="col" className="w-[22%] px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">
                    {c.scenarioHeading}
                  </th>
                  <th scope="col" className="px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">{c.exposureLabel}</th>
                  <th scope="col" className="px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">{c.commitmentLabel}</th>
                  <th scope="col" className="px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">{c.dataMovementLabel}</th>
                  <th scope="col" className="px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">{c.operationsLabel}</th>
                </tr>
              </thead>
              <tbody>
                {COST_VALUE_SCENARIO.profiles.map((profile) => (
                  <tr key={profile.platform} className="border-b border-rule last:border-0">
                    <th scope="row" className="px-6 py-5 align-top text-sm font-medium text-ink">
                      {profile.platform}
                    </th>
                    <td className={`px-6 py-5 align-top font-mono text-label font-medium uppercase ${EXPOSURE_TONE[profile.exposure]}`}>
                      {profile.exposure}
                    </td>
                    <td className="px-6 py-5 align-top text-sm leading-6 text-ink-2">{profile.commitmentNote}</td>
                    <td className="px-6 py-5 align-top text-sm leading-6 text-ink-2">{profile.dataMovementNote}</td>
                    <td className="px-6 py-5 align-top text-sm leading-6 text-ink-2">{profile.operationsNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divide-y divide-rule lg:hidden">
              {COST_VALUE_SCENARIO.profiles.map((profile) => (
                <div key={profile.platform} className="p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-medium text-ink">{profile.platform}</h3>
                    <span className={`font-mono text-label font-medium uppercase ${EXPOSURE_TONE[profile.exposure]}`}>{profile.exposure}</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <FrameField label={c.commitmentLabel}>{profile.commitmentNote}</FrameField>
                    <FrameField label={c.dataMovementLabel}>{profile.dataMovementNote}</FrameField>
                    <FrameField label={c.operationsLabel}>{profile.operationsNote}</FrameField>
                  </div>
                </div>
              ))}
            </div>
          </ProductFrame>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading title={c.driversHeading} />
              <dl className="mt-10 border-t border-rule">
                {COST_VALUE_SCENARIO.drivers.map((driver) => (
                  <div key={driver.label} className="border-b border-rule py-6">
                    <dt className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{driver.label}</dt>
                    <dd className="mt-2 max-w-[60ch] text-sm leading-7 text-ink-2">{driver.description}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <SectionHeading title={c.businessValueHeading} />
              <dl className="mt-10 border-t border-rule">
                {COST_VALUE_SCENARIO.businessValue.map((item) => (
                  <div key={item.label} className="border-b border-rule py-6">
                    <dt className="text-[1.0625rem] font-medium tracking-[-0.018em] text-accent">{item.label}</dt>
                    <dd className="mt-2 max-w-[60ch] text-sm leading-7 text-ink-2">{item.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Shell>
      </Section>

      <Section size="lg">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading title={c.costOfDelayHeading} />
              <dl className="mt-10 border-t border-rule">
                {COST_VALUE_SCENARIO.costOfDelay.map((item) => (
                  <div key={item.label} className="border-b border-rule py-6">
                    <dt className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{item.label}</dt>
                    <dd className="mt-2 max-w-[60ch] text-sm leading-7 text-ink-2">{item.description}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Uncertainty gets the same weight as the model, not a
                dashed box at the bottom of the page. */}
            <div>
              <SectionHeading title={c.uncertaintyHeading} note={c.notComparableHeading} />
              <div className="mt-10 border-t border-rule pt-8">
                <RuledList items={COST_VALUE_SCENARIO.notComparable} tone="caution" />
              </div>
            </div>
          </div>
        </Shell>
      </Section>

      <PageCta
        heading={c.ctaHeading}
        body={c.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={c.ctaLabel}
        secondaryHref={`/${locale}/scenario-lab`}
        secondaryLabel={dict.scenarioLabPage.badge}
      />
    </main>
  );
}
