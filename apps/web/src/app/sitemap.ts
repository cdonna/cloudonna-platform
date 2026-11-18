import type { MetadataRoute } from "next";
// Relative, not "@/..." — vitest.config.mts has no path-alias
// resolution (only Next.js's own bundler reads tsconfig `paths`), and
// this module is directly imported from a plain Vitest test
// (seo-domain.test.ts) the same way login/metadata.ts already is, for
// the same reason.
import { LOCALIZED_PATH_PREFIXES, SUPPORTED_LOCALES } from "../i18n/locales";

const SITE_URL = "https://www.cdonna.ch";

/**
 * Rebuilt for the locale-prefixed route structure — the old version
 * listed unprefixed paths (`/donna-ai`, `/contact`, ...) that now only
 * 307-redirect to a resolved locale rather than serving content
 * directly, and it never mentioned /de, /fr, /es, /it at all. Every
 * localized page gets one sitemap entry per locale plus an
 * `alternates.languages` map (mirroring the same hreflang set already
 * emitted in each page's own <head>, built in src/i18n/seo.ts), so
 * search engines see these as language variants of one page, not
 * unrelated duplicate URLs. /early-access is a legacy redirect target,
 * not real content, and is deliberately excluded, as are /login and
 * /signup (auth entry points, not content pages — brief §4). /discovery
 * stays a single unprefixed entry — it's outside the localized route
 * tree (see the localization report's "KNOWN LIMITATIONS").
 *
 * Website Perfection & SEO Release Gate: 10 real, fully-built content
 * pages (trust, decision-skills, architects, data-economy,
 * scenario-lab, cost-value-lab, ai-use-cases, case-study, examples,
 * demo — each with its own generateMetadata, each reachable in
 * production) were missing from this list entirely, meaning every one
 * of them was invisible to search engines for every locale. Added
 * below, each with a priority reflecting how central it is to the
 * product story rather than a uniform default.
 */
const LOCALIZED_ROUTES: Array<{
  path: (typeof LOCALIZED_PATH_PREFIXES)[number];
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/donna-ai", changeFrequency: "weekly", priority: 0.9 },
  { path: "/company", changeFrequency: "monthly", priority: 0.7 },
  { path: "/commercial", changeFrequency: "monthly", priority: 0.8 },
  { path: "/decision-skills", changeFrequency: "weekly", priority: 0.8 },
  { path: "/trust", changeFrequency: "monthly", priority: 0.8 },
  { path: "/architects", changeFrequency: "monthly", priority: 0.7 },
  { path: "/data-economy", changeFrequency: "monthly", priority: 0.7 },
  { path: "/scenario-lab", changeFrequency: "monthly", priority: 0.7 },
  { path: "/cost-value-lab", changeFrequency: "monthly", priority: 0.7 },
  { path: "/ai-use-cases", changeFrequency: "monthly", priority: 0.6 },
  { path: "/case-study", changeFrequency: "monthly", priority: 0.6 },
  { path: "/examples", changeFrequency: "monthly", priority: 0.6 },
  { path: "/demo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/independence", changeFrequency: "monthly", priority: 0.6 },
  { path: "/for-vendors", changeFrequency: "monthly", priority: 0.5 },
  { path: "/for-partners", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/imprint", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const localizedEntries: MetadataRoute.Sitemap = LOCALIZED_ROUTES.flatMap((route) => {
    const languages: Record<string, string> = { "x-default": `${SITE_URL}/en${route.path}` };
    for (const locale of SUPPORTED_LOCALES) {
      languages[locale] = `${SITE_URL}/${locale}${route.path}`;
    }
    return SUPPORTED_LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages },
    }));
  });

  const discoveryEntry: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/discovery`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  };

  return [...localizedEntries, discoveryEntry];
}
