# Homepage Donna Demo — Deterministic Decision Logic

**Module:** `apps/web/src/components/donna/demo-decision-engine.ts`
**Used by:** `apps/web/src/components/donna/DonnaLive.tsx` (the homepage demo only)
**Status:** Implemented, not committed

## Why this exists

The homepage Donna demo previously returned the same fixed recommendation
(SAP Business Data Cloud, 94%) no matter what was typed into it — a
structural contradiction with the ClouDonna Decision Framework (Business
Goals → Capabilities → Solution Patterns → Technology Patterns → Vendors),
where a technology/vendor is supposed to be an *outcome* of that chain, not
a fixed starting point. This module fixes that specific problem, for the
homepage demo only.

## How it works

1. The user's free-text input is lowercased and checked against a small,
   curated set of keyword triggers (`DEMO_PROFILES` in the module) — e.g.
   "sap", "s/4hana" → the SAP-modernization profile; "cost", "budget",
   "tco" → the cost-reduction profile. The profile with the most keyword
   hits wins.
2. If no keyword matches at all, a clearly-labeled `FALLBACK_PROFILE` is
   used instead of silently defaulting to any one vendor. Its trait weights
   are deliberately equal across all six traits so every vendor in the
   small demo catalog scores identically in the no-signal case — see the
   comment on `FALLBACK_PROFILE` in the module for why an unequal fallback
   would have quietly reintroduced vendor bias.
3. The matched profile carries a goal, a required capability, a solution
   pattern, and a technology pattern — this is what the homepage now
   visibly renders as the reasoning chain above the recommendation.
4. The profile also carries trait weights, scored against a four-vendor
   demo catalog (`DEMO_VENDORS`) by trait overlap. The ranking, not just
   the score number, changes with the input.
5. `deriveDemoRecommendation()` is a pure function — the same input string
   always produces the same output. There is no randomness and no network
   call anywhere in this module.

## What changed on the homepage

- The Recommendation, Architecture, and TCO tabs all now derive from the
  same `DemoDecisionResult`, so they never contradict each other (e.g. the
  Architecture tab used to say "SAP BDC" even when nothing about SAP was
  mentioned — it now names whichever vendor the current input actually
  produced).
- A new reasoning-chain strip (Goal → Capability → Solution Pattern →
  Technology Pattern → Vendor Recommendation) is now visible above the
  result.
- The score badge was relabeled "Illustrative fit" (was "Confidence") and
  a separate, explicit confidence explanation was added underneath,
  stating in plain language how many signals were actually detected in
  the input — rather than implying statistical confidence that doesn't
  exist here.

## Known limitations

- **Keyword matching, not language understanding.** The demo recognizes a
  fixed list of substrings. Phrasing that doesn't contain one of them
  (including synonyms, other languages, or typos) falls through to the
  neutral fallback profile — this is disclosed via the confidence
  explanation, not hidden.
- **Four vendors, six profiles.** This is intentionally smaller than the
  real Sprint 3 catalog (10 platforms, 10 scoring dimensions, curated
  evidence). It is a demo, not a second implementation of the real engine.
- **Tie-breaking is array order, not a hidden preference.** When two
  vendors score identically (most visibly in the fallback profile, where
  all four currently tie), the one listed first in `DEMO_VENDORS` sorts
  first. This is deterministic and documented, not randomized, to keep
  the "same input → same output" guarantee — but it does mean the
  no-signal case has an arbitrary-looking first place, worth knowing if
  it comes up.
- **The Architecture/TCO tabs are still curated illustrations**, not a
  generated diagram or a real cost model — they now correctly *reference*
  the derived recommendation instead of contradicting it, but the numbers
  and node layout are still hand-authored, deterministic transformations
  of the score, not independent analysis.

## Explicitly not done here

- No change to the full Donna AI product (`/donna-ai`, `components/donna-ai/`).
- No new dependency on, or duplication of, the Sprint 3 decision engine.
- No backend, API, database, or LLM call added anywhere.
