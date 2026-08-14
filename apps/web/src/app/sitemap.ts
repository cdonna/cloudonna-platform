import type { MetadataRoute } from "next";
import { LOCALIZED_PATH_PREFIXES, SUPPORTED_LOCALES } from "@/i18n/locales";

const SITE_URL = "https://www.cdonna.com";

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
 * not real content, and is deliberately excluded. /discovery stays a
 * single unprefixed entry — it's outside the localized route tree
 * (see the localization report's "KNOWN LIMITATIONS").
 */
const LOCALIZED_ROUTES: Array<{
  path: (typeof LOCALIZED_PATH_PREFIXES)[number];
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/donna-ai", changeFrequency: "weekly", priority: 0.9 },
  { path: "/independence", changeFrequency: "monthly", priority: 0.7 },
  { path: "/for-vendors", changeFrequency: "monthly", priority: 0.6 },
  { path: "/for-partners", changeFrequency: "monthly", priority: 0.6 },
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
