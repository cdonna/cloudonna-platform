import Image from "next/image";
import Link from "next/link";
import { en } from "@/i18n/dictionary";
import { interpolate } from "@/i18n/interpolate";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionary";

/** localeHref prefixes a link with `/{locale}` only for routes that
 * actually live under src/app/[locale]/ — /discovery stays unprefixed
 * even when this Footer is rendered with a non-English locale (it
 * never is today, since /discovery only ever calls <Footer /> with no
 * props, but this keeps the helper correct if that changes). */
const LOCALIZED_HREFS = new Set(["/donna-ai", "/independence", "/for-vendors", "/for-partners", "/early-access", "/contact", "/privacy", "/imprint", "/terms"]);
function localeHref(locale: Locale, href: string): string {
  if (href === "/discovery") return href;
  if (href === "/") return `/${locale}`;
  return LOCALIZED_HREFS.has(href) ? `/${locale}${href}` : href;
}

/**
 * Rendered twice in this app: once (translated) from
 * src/app/[locale]/layout.tsx for the 12 localized Founder-journey
 * pages, and once (English, no props) from src/app/discovery/page.tsx,
 * which sits outside the locale tree — see that file's own comment.
 * Defaulting `dict`/`locale` to English keeps that second call site
 * working unchanged rather than requiring every caller to thread a
 * dictionary through.
 */
export default function Footer({ dict = en, locale = DEFAULT_LOCALE }: { dict?: Dictionary; locale?: Locale }) {
  const exploreLinks = [
    { label: dict.nav.links.discovery, href: "/discovery" },
    { label: dict.nav.links.donnaAi, href: "/donna-ai" },
    { label: dict.nav.links.independence, href: "/independence" },
  ];
  const audienceLinks = [
    { label: dict.nav.links.forVendors, href: "/for-vendors" },
    { label: dict.nav.links.forPartners, href: "/for-partners" },
    { label: dict.footer.linkFoundingTester, href: "/early-access" },
    { label: dict.nav.links.contact, href: "/contact" },
  ];
  const legalLinks = [
    { label: dict.legal.privacy.h1, href: "/privacy" },
    { label: dict.legal.imprint.h1, href: "/imprint" },
    { label: dict.legal.terms.h1, href: "/terms" },
  ];

  return (
    <footer className="border-t border-titanium bg-obsidian px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-2.5">
              <Image
                src="/cloudonna-favicon-512.png"
                alt="ClouDonna"
                width={44}
                height={44}
                className="brand-mark h-10 w-10 object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-nova-ink">
                Clou<span className="text-nova-accent-strong">Donna</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-nova-ink-faint">{dict.footer.tagline}</p>
          </div>

          <FooterColumn title={dict.footer.exploreHeading} links={exploreLinks} locale={locale} />
          <FooterColumn title={dict.footer.audiencesHeading} links={audienceLinks} locale={locale} />
          <FooterColumn title={dict.footer.legalHeading} links={legalLinks} locale={locale} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-titanium pt-8 text-sm text-nova-ink-faint sm:flex-row">
          <span>{interpolate(dict.footer.copyright, { year: new Date().getFullYear() })}</span>
          <span className="rounded-full border border-titanium bg-carbon px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong">
            {dict.footer.badge}
          </span>
        </div>
      </div>
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
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-ink-faint">{title}</div>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={localeHref(locale, link.href)} className="text-sm text-nova-ink-muted transition duration-200 hover:text-nova-accent-strong">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
