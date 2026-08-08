# B2B Visitor Intelligence — Vendor Evaluation & Privacy Architecture

**Status:** Research and recommendation only. No vendor has been contracted, no tracking script has been deployed, and no code has been written. This document is Phase 14's complete deliverable; it requires explicit founder approval before any implementation begins.

**Scope reminder (per the original brief):** this is *not* deanonymization of individuals. It is privacy-conscious, company-level identification of anonymous B2B website visitors — "which companies are looking at our site, how, and with what intent" — strictly separated from ClouDonna's Decision Intelligence product data.

---

## 1. Recommended vendor: Snitcher

Company-level IP-to-firmographic matching, EU-hosted (Frankfurt), built-in support for major consent platforms, real-time CRM push, Slack alerting, and the lowest entry price of the shortlist ($49/mo, all integrations included, 14-day trial). It is the best fit for a small team that wants a working signal fast without operating its own tracking infrastructure.

## 2. Runner-up: Leadinfo

Netherlands-based, ISO 27001 certified, cookieless IP-only matching, EU-hosted (Ireland, via AWS EMEA), and the vendor with by far the most extensive public-facing legal/GDPR documentation of the group — a genuine positive signal for a privacy-first buyer. It loses the top slot only on integration/alerting evidence: I could not independently confirm Leadinfo's native Slack/webhook alerting depth the way I could for Snitcher's (see §11 — this is a sourcing gap, not a claim that the capability doesn't exist, and should be verified directly with Leadinfo before a final decision).

## 3. Why (comparative reasoning)

| | Snitcher | Leadinfo | Albacross | Dealfront/Leadfeeder | HubSpot Breeze Intelligence |
|---|---|---|---|---|---|
| Company-only identification | Yes, explicit ("never shares a visitor's IP") | Yes, cookieless IP-only | Yes | Yes | Yes |
| EU hosting | Yes — Frankfurt, DE | Yes — Ireland (AWS EMEA) | Yes (EU-origin product) | Yes, EU-hosted; SCCs for US-entity interaction | US-headquartered; EU hosting only on higher tiers |
| DACH-specific strength | Not vendor-specific; general EU coverage | General EU coverage | **Explicitly strong** — Nordic/DACH/UK origin, better match rates for DACH SMEs | General EU coverage | Weakest — global generic dataset, no DACH emphasis found |
| Consent-platform integration | Cookiebot / OneTrust / Transcend, built in | Not confirmed in this pass | Not confirmed in this pass | Not confirmed in this pass | Newest "AI consent management" (2026), unverified maturity |
| DPA | Not found in this pass (verify before signing) | Available, ISO 27001-backed | Not confirmed | Full DPA — auto for paid, on request for free | Standard HubSpot DPA (part of broader platform terms) |
| Native CRM push | HubSpot / Salesforce / Pipedrive, real-time | HubSpot-centric | Standard set | Standard set | Native (it *is* HubSpot) |
| Native Slack alerting | Yes, confirmed | Not confirmed in this pass (likely exists, unverified) | Not confirmed | Not confirmed | Via HubSpot workflows, Pro/Enterprise tier only |
| Entry pricing | $49/mo | Not confirmed in this pass | €79/mo (self-serve) | Not confirmed in this pass | Add-on to HubSpot; not standalone |
| Sourcing confidence this pass | High (vendor docs + help center) | Medium-high (strong legal docs, weaker on ops/integration docs) | Medium (mostly aggregator sources) | Medium-high (vendor + aggregator) | **Low** — sourcing was almost entirely third-party listicles, not vendor documentation |

Albacross deserves a callout: if DACH/Nordic match-rate quality turns out to matter more than integration polish once real traffic is tested, it is a legitimate alternative #1 — the search evidence for its regional strength was the most specific and vendor-confirmed of any DACH-related claim in this evaluation. Recommend a side-by-side trial of Snitcher and Albacross against real ClouDonna traffic before final commitment (both offer trials/low-commitment entry pricing).

HubSpot Breeze Intelligence is not recommended as primary: the sourcing for its privacy/compliance posture was weak (aggregator content, not vendor documentation), and it only makes sense if ClouDonna is already standardized on HubSpot as its CRM — that has not been established in this codebase or session.

## 4. DACH / Switzerland suitability

- **Albacross** has the strongest documented DACH-region match-rate advantage of the group (Nordic/DACH/UK product origin).
- **Snitcher, Leadinfo, Dealfront/Leadfeeder** all give general EU coverage with no DACH-specific weakness found, but also no DACH-specific strength confirmed.
- **None of the five vendors publish anything Switzerland-specific** (no vendor page mentions nFADP, Swiss data residency, or a Swiss legal entity). Switzerland is not in the EU/EEA, so GDPR "EU hosting" claims do not automatically imply Swiss-law compliance — see §6.
- Practical implication: pick primarily on GDPR posture and integration quality (all five are workable for a Swiss-headquartered company targeting DACH accounts), and treat Swiss-law compliance as ClouDonna's own responsibility layered on top of whichever vendor is chosen (§6), not something to expect a vendor to certify.

## 5. Privacy implications

- **IP addresses are personal data** — confirmed independently for both jurisdictions: GDPR explicitly classifies IP addresses as personal data, and Swiss law "typically considers IP addresses personal data" under the revFADP. **Company-level identification does not remove this fact** — it changes the *legal basis available*, not the data's classification. This document does not claim, and ClouDonna's implementation must not claim, that company-level output means "not personal data."
- **Legal basis for company-level matching:** Art. 6(1)(f) GDPR legitimate interest is the basis all four EU-documented vendors rely on — no explicit visitor consent is claimed to be required for *company-level, cookieless* matching, provided ClouDonna's own privacy policy discloses the practice and a genuine opt-out exists.
- **Individual-level identification is a different, much stricter, category.** GDPR does not carve out an exception for B2B/work-context individuals — full data-subject rights (access, erasure, objection) apply exactly as they would to a consumer. None of the recommended vendors are being evaluated for, or should be used for, individual deanonymization — this stays out of scope per the original brief.
- **ePrivacy ("Cookie Law") applies to storing/reading device information, not to server-side IP matching.** A vendor that performs cookieless, server-side reverse-IP-to-company matching (Leadinfo, Snitcher explicitly; Albacross/Dealfront likely, unconfirmed) does not trigger ePrivacy's cookie-consent requirement by that mechanism alone. If the vendor's script *also* sets a cookie (e.g., for session-level page tracking, deduping, or your own analytics), that separate mechanism does require consent under ePrivacy — this must be checked per-vendor at implementation time, not assumed from the "cookieless matching" claim alone.
- **Regulatory climate note:** the Dutch DPA warned 50 organizations in April 2025 over misleading cookie banners — a general enforcement signal (not specific to any vendor evaluated here) that "we use legitimate interest" claims are being actively scrutinized, reinforcing that ClouDonna's own privacy-policy disclosure must be accurate and specific, not boilerplate.

## 6. Consent requirements

Two distinct legal regimes apply, and neither can be skipped:

**GDPR (applies to visitors from the EU/EEA):**
- Company-level, cookieless matching → Art. 6(1)(f) legitimate interest, no prior opt-in consent required, *provided*: (a) ClouDonna's privacy policy discloses the practice, the categories of data collected (IP address, inferred company, page/behavior data), the purpose (sales/marketing lead qualification), and the vendor used; (b) a genuine, working opt-out mechanism exists and is disclosed; (c) no individual-level identification occurs.
- If the chosen vendor's script sets any cookie → that specific mechanism needs ePrivacy-compliant consent (an existing consent-management platform, e.g. Cookiebot/OneTrust — Snitcher explicitly supports gating on these).

**Swiss revFADP (applies to visitors physically in Switzerland, and to ClouDonna as a Swiss-connected controller):**
- Confirmed applicable to B2B contexts specifically — "B2B transactions regularly involve the processing of data from natural persons (e.g. contact persons)," so the "it's just company data" framing does not exempt ClouDonna from revFADP either.
- IP addresses are typically personal data under Swiss law, same conclusion as GDPR.
- Materially **more permissive than GDPR on cookies specifically**: Swiss law uses a transparency-and-objection (opt-out) model rather than the EU's strict prior-opt-in default — essential cookies need no consent but must be disclosed; functional/analytics cookies can generally run on an opt-out basis with clear disclosure. This is good news for implementation simplicity but is **not** a basis for skipping GDPR's stricter requirement for any EU visitor — the practical rule is: **build to the stricter regime (GDPR) and Swiss compliance follows automatically**, rather than building two separate consent paths.
- Penalties for deliberate revFADP violations run up to CHF 250,000 — a real, non-trivial exposure, not a formality.
- **Disclosed gap:** none of the five vendors publish Swiss-specific compliance documentation. This is not disqualifying (revFADP and GDPR are closely aligned in substance), but it means ClouDonna, not the vendor, carries responsibility for the Swiss-law-specific disclosure language in its own privacy policy. Recommend a short confirmation email to the chosen vendor's DPO/legal contact asking explicitly whether they process/store any data in a way that would be affected by Swiss law, before going live — cheap to do, closes the one real gap in this research.

**Action items before any deployment (all vendors):**
1. Update ClouDonna's public privacy policy with a specific, accurate section naming the visitor-intelligence vendor, what is collected, the legal basis (legitimate interest), and how to opt out.
2. Confirm and execute the vendor's DPA.
3. Confirm the vendor's sub-processor list and retain it for ClouDonna's own records (GDPR Art. 28 requires this regardless of vendor size).
4. Set a retention limit for visitor-intelligence data and confirm the vendor supports configuring/enforcing it.
5. If the vendor's script sets any cookie, wire it through an existing (or newly added) consent-management platform — do not fire it unconditionally.
6. Do not enable the script on any authenticated `/app` page (see §9) — this sidesteps the much harder question of mixing marketing analytics with authenticated user identity entirely, rather than trying to justify it.

## 7. Integration design: `Visitor Intelligence Provider` abstraction

Do not hard-code Snitcher (or any vendor) directly into the marketing site. Mirror the existing `IntelligenceProvider` pattern already used for AI providers in this codebase:

```
apps/web/src/lib/visitor-intelligence/
  provider.ts            # interface: VisitorIntelligenceProvider
  providers/
    snitcher.ts           # concrete adapter (script tag id + config)
    none.ts                # no-op provider — default when unconfigured
  config.ts               # reads VISITOR_INTELLIGENCE_PROVIDER / VISITOR_INTELLIGENCE_SITE_ID
  consent.ts               # gate: only allow load if consent state permits
```

- **Env config:** `VISITOR_INTELLIGENCE_PROVIDER` (e.g. `"snitcher" | "none"`), `VISITOR_INTELLIGENCE_SITE_ID`. Absence of either → the `none` provider, script never loads. This keeps the vendor swappable (e.g., a later move to Albacross after a trial) without touching any page component.
- **Loading mechanism:** a single server-rendered script-loader component mounted once, only in the public marketing layout (never the authenticated `/app` layout — these are already two separate Next.js layout trees in this codebase, which makes the boundary structurally enforceable, not just a convention to remember).
- **Consent gate:** the loader checks consent state (from whatever consent-management integration is wired per §6) before injecting the script tag at all — not "load then respect consent," but "do not load until consent state is known to permit it," consistent with how the vendors that support consent-platform gating (Snitcher confirmed) recommend implementing it.
- **No data ever flows the other direction:** this abstraction only loads a third-party script and lets it observe public page traffic. Nothing in ClouDonna's application data (decisions, evidence, org content, authenticated identity) is ever passed *into* this module — see §9 for the explicit boundary.

## 8. Pages where tracking should run

- `/` (homepage)
- `/donna-ai` (public, unauthenticated Donna AI demo/marketing page)
- `/discovery`, `/independence`, `/for-vendors`, `/for-partners`
- `/early-access` (the lead-capture page — arguably the *highest*-value page for intent signal, since a visitor reaching it is close to a conversion action)
- `/pricing` (if/when it exists)
- Public legal pages (`/privacy`, `/imprint`, `/terms`) are low-value for intent signal but harmless to include for completeness; not a priority.

## 9. Pages where tracking must NEVER run

- **Everything under `/app`** (the entire authenticated product surface) — decisions, evidence, org/workspace content, wizard/report views. This is a hard rule, not a default: the Phase 14 brief explicitly forbids loading on authenticated pages "unless explicitly approved," and no such approval is being given here.
- `/login`, `/signup` and any other auth-flow page — avoids any risk of the visitor-intelligence vendor observing credential-adjacent traffic patterns.
- Any future API route or server action — these vendors are front-end/browser-script based; there is no legitimate reason for a visitor-intelligence SDK to touch a request path that also carries decision inputs, saved decisions, or AI prompts.
- **No-Go data categories, regardless of page:** decision inputs, saved decisions, evidence content, org/workspace content, authenticated user identifiers, confidential enterprise data, AI prompts, uploaded documents. None of these are ever passed to the visitor-intelligence provider, in any form — the provider only ever observes what an anonymous browser natively exposes on a public page (URL, referrer, IP-derived company).

## 10. Events / intent signals

All tiers are deterministic — computed from observable behavior thresholds, never an AI-generated or fabricated "intent score."

| Tier | Example criteria (illustrative — tune after real traffic data exists) |
|---|---|
| **LOW** | Single page view, < 30 seconds on site, no return visit within 30 days |
| **MEDIUM** | 3+ pages in a session, 2+ minutes total time, OR a return visit within 7 days |
| **HIGH** | Visited `/donna-ai` or `/discovery` AND `/for-vendors`/`/for-partners` in the same session (evaluation-pattern browsing), OR 2+ sessions within 14 days |
| **VERY HIGH** | Reached `/early-access` (regardless of form submission), OR 3+ sessions within 30 days from the same company, OR a named target-account company (if/when ClouDonna maintains a target-account list) visits at all |

These thresholds should live in ClouDonna's own config (not the vendor's black-box scoring, if the vendor offers one) so they stay inspectable, adjustable, and honest about being a simple rule set rather than a model.

## 11. Alerting model

Prefer vendor-native integrations over custom infrastructure, per the brief:

- **Primary:** Snitcher's native Slack alerting for VERY HIGH / HIGH tier visits (confirmed capability — "Slack alerts when target accounts visit").
- **Secondary:** real-time CRM push (HubSpot/Salesforce/Pipedrive, confirmed for Snitcher) so account records update without manual entry.
- **Fallback/expansion:** Zapier or the vendor's webhook (Snitcher's webhook integration is documented as **beta** — treat as not production-load-bearing yet; re-check maturity before depending on it for anything time-sensitive).
- **Explicitly not recommended yet:** a custom ClouDonna-built alerting service. Nothing in this evaluation surfaced a gap that vendor-native Slack + CRM push doesn't already cover for a team this size.

## 12. Cost / complexity assessment

| | Snitcher | Leadinfo | Albacross |
|---|---|---|---|
| Entry price | $49/mo | Not found this pass — request quote | €79/mo self-serve |
| Trial | 14 days | Not confirmed | Available (self-serve tier) |
| Setup complexity | Low — single script tag, existing consent-platform integrations, 14-day trial with no confirmed long-term contract | Low-medium — strong docs, but not self-serve pricing (likely sales-assisted onboarding) | Low — self-serve tier available |
| Engineering effort on ClouDonna's side | Small — one script-loader component + consent gate + env config (§7); no dashboard build needed, vendor UI serves as the Founder/GTM view initially | Same shape | Same shape |
| Ongoing maintenance | Minimal — no infrastructure to run, no data pipeline to maintain | Minimal | Minimal |

None of the three top candidates justify building a custom dashboard at this stage — each vendor's own web UI already provides an account/last-visit/pages/source view close to what was described as the desired experience. Revisit a custom dashboard only if/when ClouDonna needs to *unify* visitor intelligence with other Founder/GTM data sources in one place — not before.

## 13. GO / NO-GO recommendation

**GO — with a trial-first sequencing, not a direct annual commitment.**

Recommended sequence:
1. Start a Snitcher trial (14 days, $49/mo if continued) using the `Visitor Intelligence Provider` abstraction described in §7, restricted to public marketing pages only (§8–9), with the script gated behind existing/added consent-management (§6–7).
2. In parallel, request an Albacross self-serve trial to compare DACH match-rate quality against Snitcher using real ClouDonna traffic — this is the one open comparative question this research couldn't resolve from public documentation alone.
3. Before either trial goes live: publish the privacy-policy update (§6, action item 1) and confirm the DPA (§6, action item 2). This is a hard gate, not a parallel task — per the original brief, "do not deploy any third-party tracker until its privacy requirements have been reviewed," and that review is what this document constitutes; the remaining action items are the *implementation* of that review's conclusions, not further review.
4. Send the one remaining open question — Swiss-law-specific data handling — directly to the chosen vendor's legal/DPO contact before committing beyond the trial period.

This document does not authorize implementation. The next step requires an explicit founder decision on which vendor to trial first (Snitcher is recommended, per §1) before any code is written or any script is added to `.env`.
