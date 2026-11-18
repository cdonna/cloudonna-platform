import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import robots from "../robots";
import sitemap from "../sitemap";
// Relative, not "@/..." — vitest.config.mts has no path-alias
// resolution (only Next.js's own bundler reads tsconfig `paths`); see
// login/metadata.ts's identical comment for the same constraint.
import { LOCALIZED_PATH_PREFIXES, SUPPORTED_LOCALES } from "../../i18n/locales";

const CANONICAL_DOMAIN = "https://www.cdonna.ch";
const WRONG_DOMAIN_PATTERN = /cdonna\.com/i;

/**
 * Website Perfection & SEO Release Gate (brief §30): the production
 * domain is https://www.cdonna.ch. An earlier release had
 * `www.cdonna.com` hard-coded in six places (robots.ts, sitemap.ts,
 * both root layouts' metadataBase/Organization JSON-LD, not-found.tsx,
 * and the homepage's SoftwareApplication JSON-LD) — found only by a
 * manual repository-wide grep. This suite makes that class of
 * regression fail CI instead of waiting for another manual audit.
 */
describe("Canonical domain", () => {
  it("robots.ts points its sitemap at the real .ch domain", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${CANONICAL_DOMAIN}/sitemap.xml`);
  });

  it("robots.ts disallows private/internal/API surfaces from being crawled", () => {
    const result = robots();
    const disallow = Array.isArray(result.rules) ? [] : (result.rules.disallow as string[] | undefined) ?? [];
    for (const path of ["/app/", "/founder/", "/api/", "/auth/"]) {
      expect(disallow).toContain(path);
    }
  });

  it("every sitemap entry uses the real .ch domain, never .com", () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url.startsWith(CANONICAL_DOMAIN)).toBe(true);
      expect(entry.url).not.toMatch(WRONG_DOMAIN_PATTERN);
      const languages = entry.alternates?.languages as Record<string, string> | undefined;
      if (languages) {
        for (const altUrl of Object.values(languages)) {
          expect(altUrl.startsWith(CANONICAL_DOMAIN)).toBe(true);
        }
      }
    }
  });

  it("no .ts/.tsx source file under src/app references the wrong .com domain", () => {
    const appDir = path.join(__dirname, "..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
          const content = fs.readFileSync(full, "utf-8");
          if (WRONG_DOMAIN_PATTERN.test(content)) offenders.push(full);
        }
      }
    };
    walk(appDir);
    expect(offenders).toEqual([]);
  });
});

/**
 * Sitemap completeness (brief §4): every real, publicly-reachable
 * content page under src/app/(localized)/[locale]/ must appear in the
 * sitemap for every supported locale. Ten real pages (trust,
 * decision-skills, architects, data-economy, scenario-lab,
 * cost-value-lab, ai-use-cases, case-study, examples, demo) were
 * entirely missing before this release — this list is the exhaustive
 * set of real content pages, kept in sync manually with
 * LOCALIZED_PATH_PREFIXES's own comment.
 */
describe("Sitemap completeness", () => {
  const REQUIRED_CONTENT_PATHS = [
    "",
    "/donna-ai",
    "/trust",
    "/decision-skills",
    "/architects",
    "/data-economy",
    "/scenario-lab",
    "/cost-value-lab",
    "/ai-use-cases",
    "/case-study",
    "/examples",
    "/demo",
    "/company",
    "/commercial",
    "/independence",
    "/for-vendors",
    "/for-partners",
    "/contact",
    "/privacy",
    "/terms",
    "/imprint",
  ];

  it("includes every required content path for every supported locale", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((e) => e.url));
    for (const contentPath of REQUIRED_CONTENT_PATHS) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(urls.has(`${CANONICAL_DOMAIN}/${locale}${contentPath}`)).toBe(true);
      }
    }
  });

  it("every required content path is also a known localized path prefix (so a bare URL redirects, not 404s)", () => {
    for (const contentPath of REQUIRED_CONTENT_PATHS) {
      expect((LOCALIZED_PATH_PREFIXES as readonly string[]).includes(contentPath)).toBe(true);
    }
  });

  it("never includes an auth-only or legacy-redirect route as a content entry", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    for (const excluded of ["/login", "/signup", "/early-access"]) {
      expect(urls.some((u) => u.includes(excluded))).toBe(false);
    }
  });
});
