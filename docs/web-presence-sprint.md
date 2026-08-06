# Web Presence Completion Sprint

**Branch:** `worktree-web-presence`
**Status:** Implemented, not yet merged
**Scope:** `apps/web` public site — technical SEO, positioning, audience journeys

This sprint repositions the ClouDonna public site around the **ClouDonna Decision Framework**:
Business Goal → Business Context → Capabilities → Requirements → Constraints → Solution
Approaches → Technology → Vendor → Implementation → Partner → Executive Decision Report.
Technology and vendor selection are treated as an outcome of that chain, never the starting
point, and no vendor can influence its own placement in it.

## Audit findings (before this sprint)

- No `robots.txt`, no `sitemap.xml`, no canonical URLs, no Open Graph/Twitter Card metadata, no
  structured data anywhere — confirmed against both the repository and the live
  `www.cdonna.com` deployment.
- The homepage hero's mock dashboard named a real vendor (Snowflake) favorably with fabricated,
  unlabeled numbers (91% match, $2.1M TCO, "18% below market median") — a neutrality-optics risk
  inconsistent with the honest "illustrative alpha output" labeling already used on `/donna-ai`.
- No independence/neutrality statement existed anywhere on the site.
- Every audience (enterprise customer, vendor, partner, community) funneled into one
  undifferentiated Early Access form with a product-name interest dropdown.
- Only 5 routes existed in total.

## What shipped

**Technical SEO foundation**
- `app/robots.ts`, `app/sitemap.ts`, dynamic `app/opengraph-image.tsx`
- Sitewide `metadataBase` and `Organization` JSON-LD in `layout.tsx`
- Self-referential `alternates.canonical` on every route, new and existing

**Homepage**
- Hero rewritten goal-first; mock dashboard relabeled "Illustrative example" with the named
  vendor anonymized to "Platform A" and percentages replaced with qualitative maturity bands
- New `NarrativeSequence` section (the eleven-step Discovery path)
- New `TrustStrip` linking to `/independence`
- Nav and footer rebuilt around Discovery / Donna AI / Independence / For Vendors / For Partners

**New routes**
- `/discovery` — the full Discovery path, step by step, ending with a link to `/donna-ai`
- `/independence` — the public neutrality statement and the rules behind it
- `/for-vendors`, `/for-partners` — audience-specific journeys ending in an audience-aware
  Early Access CTA
- `/early-access` — dedicated route; reads `?type=customer|vendor|partner|community` server-side
  (via the page's `searchParams` prop, not a client-side `useSearchParams` hook, so no Suspense
  boundary is needed) and adapts headline, copy, and the preselected "I'm interested as a" field

**Honesty pass on `DonnaLive`**
- Added a visible "Illustrative example" badge next to the demo's recommendation, matching the
  disclosure pattern already used on `/donna-ai` and the new Hero. The demo's underlying logic
  (a fixed result regardless of input) was intentionally left unchanged — see below.

## Deliberately deferred

Building these now would mean thin pages with no real content behind them:

- `/solutions/[goal]`, `/capabilities`, `/compare`, `/vendors`, `/partners`, `/pricing`,
  `/research`, `/about`
- A content model for the dynamic pages (`Goal`, `Capability`, `Category`, `Comparison`,
  `Vendor`, `Partner` entities) is designed but not built — see the Phase 1 planning artifact for
  the full field list.
- `/for-enterprises` was considered and rejected — the homepage already is that pitch; a
  separate page would duplicate it.

## Known follow-up (not part of this sprint)

`components/donna/DonnaLive.tsx` (built in an earlier sprint) always returns the same fixed
recommendation — SAP Business Data Cloud at 94%, with the same named alternatives — regardless
of what's typed into the demo. This sprint only added visible disclosure; making the demo
actually reason through the Decision Framework is a larger, separate undertaking and a candidate
for its own future sprint.

## Explicit non-goals

No OpenAI integration, no persistence or auth, no analytics wiring, no DNS or Vercel changes.
This sprint is fully independent of Sprint 3 (Donna Intelligence Foundation / vendor-intelligence
catalog / Donna Score v2), which lives only on `worktree-sprint-3` and was never merged into
`main` — nothing under `components/donna-ai/` was touched here.
