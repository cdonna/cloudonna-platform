# Internationalization — Architecture Plan (Design Only)

**Status: not implemented.** This is a plan to review, not code that shipped. Restructuring every route under a `[locale]` segment is invasive enough — it touches every existing page, layout, and internal link — that doing it in the same pass as the Business Operations work above risked destabilizing a release that just went live. Sequencing it as its own reviewed sprint is the actual recommendation here, not a postponement for its own sake.

## Canonical language

English, per the brief. German is the first additional language; French and Italian are named as future, not scoped now.

## Why full `next-intl`-style routing, not a quick fix

Three shapes were considered:

1. **Query-param locale** (`?lang=de`) — cheapest, but doesn't produce real per-language URLs, breaks SEO (`hreflang` needs distinct URLs), and doesn't persist across navigation without extra plumbing anyway.
2. **Cookie-only locale switch, same URL** — persists, but the same SEO problem: Google needs `/de/...` and `/en/...` as distinct, crawlable, canonical URLs to rank each language separately.
3. **`[locale]` path segment** (`/en/...`, `/de/...`), recommended — the only shape that gets real per-language URLs, `hreflang` alternates, and localized metadata for free from Next.js's own routing.

## Recommended shape (not yet built)

```
apps/web/src/
  middleware.ts          # extended: locale detection (Accept-Language header,
                          # then cookie override) before the existing Supabase
                          # session-refresh logic — same file, two concerns
  app/
    [locale]/
      layout.tsx           # today's root layout, moved down one level
      page.tsx              # homepage
      contact/
      early-access/
      donna-ai/
      discovery/
      independence/
      privacy/ terms/ imprint/
    app/                    # the authenticated /app shell stays
                            # English-only for now — deliberately excluded,
                            # see "What's explicitly out of scope" below
  dictionaries/
    en.json
    de.json
```

Every `<Link>` and `redirect()` call across the public site needs the locale prefix threaded through — this is the bulk of the actual work, not the routing config itself.

## What's explicitly out of scope for the first pass

- **The authenticated `/app` shell** (decisions, settings, Founder Dashboard) stays English-only. Translating an internal operational tool before translating the pages that actually drive signups is the wrong order of investment.
- **Machine translation of any kind.** The brief is explicit: "never perform literal machine translation... every language must feel native." Eight pages (Homepage, Donna, Contact, Early Access, Privacy, Terms, Imprint, Independence) of genuinely native-quality German copy is real, careful writing work — the same editorial bar this session already held English copy to (see the removed fabricated-stats episode). That's a dedicated pass with its own review cycle, not a checkbox inside a larger sprint.
- **hreflang and localized OpenGraph metadata** follow directly once routing exists — mechanical once the `[locale]` structure is in place, not attempted before it.

## Recommended sequencing

1. Land `[locale]` routing with English only, verify nothing broke (this alone touches every route file).
2. Write real German copy for the 8 pages above, reviewed the way English copy was reviewed tonight (Human/LLM/Clarity/Emotion/Trust scoring).
3. Wire the language selector and locale persistence.
4. `hreflang` + localized metadata.

Each step is independently shippable and reversible — deliberately, so a bad step doesn't block the others.
