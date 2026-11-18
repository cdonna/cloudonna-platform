import Image from "next/image";
import Link from "next/link";
import { Shell } from "@/components/editorial/primitives";
import { en } from "@/i18n/dictionary";
import { interpolate } from "@/i18n/interpolate";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionary";

/** localeHref prefixes a link with `/{locale}` only for routes that
 * actually live under src/app/[locale]/ — /discovery stays unprefixed
 * even when this Footer is rendered with a non-English locale (it
 * never is today, since /discovery only ever calls <Footer /> with no
 * props, but this keeps the helper correct if that changes). */
const LOCALIZED_HREFS = new Set([
  "/donna-ai",
  "/independence",
  "/trust",
  "/decision-skills",
  "/architects",
  "/data-economy",
  "/demo",
  "/examples",
  "/case-study",
  "/scenario-lab",
  "/cost-value-lab",
  "/ai-use-cases",
  "/company",
  "/commercial",
  "/for-vendors",
  "/for-partners",
  "/early-access",
  "/contact",
  "/privacy",
  "/imprint",
  "/terms",
]);
function localeHref(locale: Locale, href: string): string {
  if (href === "/discovery") return href;
  if (href === "/") return `/${locale}`;
  return LOCALIZED_HREFS.has(href) ? `/${locale}${href}` : href;
}

/**
 * Rendered twice in this app: once (translated) from
 * (localized)/[locale]/layout.tsx, and once (English, no props) from
 * src/app/(default)/discovery/page.tsx, which sits outside the locale
 * tree. Defaulting `dict`/`locale` to English keeps that second call
 * site working unchanged rather than requiring every caller to thread a
 * dictionary through.
 *
 * On the editorial register now: warm paper, hairline rules, no card
 * surfaces. The link columns pick up the pages the slimmed-down primary
 * nav no longer carries (Examples, Case Study, Contact), so nothing
 * became unreachable when the bar went from eleven destinations to six.
 */
export default function Footer({ dict = en, locale = DEFAULT_LOCALE }: { dict?: Dictionary; locale?: Locale }) {
  const exploreLinks = [
    { label: dict.nav.links.donnaAi, href: "/donna-ai" },
    { label: dict.scenarioLabPage.badge, href: "/scenario-lab" },
    { label: dict.costValueLabPage.badge, href: "/cost-value-lab" },
    { label: dict.aiPortfolioPage.badge, href: "/ai-use-cases" },
    { label: dict.examplesPage.badge, href: "/examples" },
    { label: dict.caseStudyPage.badge, href: "/case-study" },
    { label: dict.nav.links.demo, href: "/demo" },
    { label: dict.nav.links.discovery, href: "/discovery" },
  ];
  const audienceLinks = [
    { label: dict.commercialPage.badge, href: "/commercial" },
    { label: dict.nav.links.forVendors, href: "/for-vendors" },
    { label: dict.nav.links.forPartners, href: "/for-partners" },
    { label: dict.footer.linkFoundingTester, href: "/early-access" },
    { label: dict.nav.links.contact, href: "/contact" },
  ];
  const trustLinks = [
    { label: dict.companyPage.badge, href: "/company" },
    { label: dict.nav.links.trust, href: "/trust" },
    { label: dict.nav.links.independence, href: "/independence" },
    { label: dict.legal.privacy.h1, href: "/privacy" },
    { label: dict.legal.imprint.h1, href: "/imprint" },
    { label: dict.legal.terms.h1, href: "/terms" },
  ];

  return (
    <footer className="bg-paper">
      <Shell>
        <div className="border-t border-rule py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link href={`/${locale}`} className="flex items-center gap-2.5">
                <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={32} height={32} className="h-7 w-7 object-contain" />
                <span className="text-[1.0625rem] font-medium tracking-[-0.025em] text-ink">
                  Clou<span className="text-accent">Donna</span>
                </span>
              </Link>

              <p className="mt-5 max-w-[30ch] text-sm leading-6 text-ink-2">{dict.footer.tagline}</p>

              <p className="mt-6 font-mono text-label font-medium text-ink-3 uppercase">{dict.footer.badge}</p>
            </div>

            <FooterColumn title={dict.footer.exploreHeading} links={exploreLinks} locale={locale} />
            <FooterColumn title={dict.footer.audiencesHeading} links={audienceLinks} locale={locale} />
            <FooterColumn title={dict.nav.links.trust} links={trustLinks} locale={locale} />
          </div>

          <div className="mt-16 border-t border-rule pt-8">
            <span className="text-sm text-ink-3">{interpolate(dict.footer.copyright, { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </Shell>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  locale,
}: {
  title: string;
  links: { label: string; href: string }[];
  locale: Locale;
}) {
  return (
    <nav aria-label={title}>
      <div className="font-mono text-label font-medium text-ink-3 uppercase">{title}</div>

      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={localeHref(locale, link.href)} className="text-sm text-ink-2 transition-colors duration-control hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
