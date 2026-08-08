# Founder Decision Register

Every decision below requires explicit founder approval before being treated as settled. Nothing in this document, or any other document in `docs/company/`, should be read as having silently decided any of these on the founder's behalf.

---

### 1. Company name: `ClouDonna` vs. `ClouDonna Labs`

**QUESTION:** Should the corporate entity be named distinctly from the product (`ClouDonna Labs` building `ClouDonna`), or should company and product share one name?

**OPTIONS:**
- **A.** `ClouDonna Labs` (company) / `ClouDonna` (product) — distinct entity and brand.
- **B.** `ClouDonna` for both — no separate corporate brand.
- **C.** A different corporate suffix entirely (`ClouDonna, Inc.`, `ClouDonna AI`, etc.) — not evaluated in depth here, flagged as a real alternative.

**RECOMMENDATION:** A, with real, disclosed uncertainty — not a confident call.

**RATIONALE:** A distinct company/product naming pattern is well-precedented (e.g., Notion Labs Inc. behind "Notion") and gives room for the product-family expansion this task itself lists (`ClouDonna Enterprise`, `ClouDonna Research`, `ClouDonna Benchmark`, etc.) without the corporate name being read as just one of those products. "Labs" also signals research rigor, which is thematically consistent with a company whose actual moat claim is proprietary knowledge/evidence work, not app polish. Against this: customers contract with and remember the product name, rarely the legal entity, so the practical customer-facing impact of this choice is smaller than it might feel in a naming debate — meaning this decision matters less to get "right" than several others in this register, and shouldn't consume disproportionate founder time.

**RISKS:** "Labs" can read as pre-commercial to a risk-averse enterprise procurement function evaluating multi-year vendor stability — worth weighing against the target ICP's actual sensitivity to this (an Enterprise Architect persona is less likely to be thrown by this than a risk-committee is). **Trademark and domain availability for either option are completely unverified** — this document makes no claim about availability and none should be inferred from anything written here; that verification is an explicit external/legal prerequisite before this decision is finalized, not an afterthought.

**DECISION STATUS:** Pending founder approval. Not decided by this document.

---

### 2. Initial category wording

**QUESTION:** Does ClouDonna lead publicly with "Enterprise Decision Intelligence" as a named category, or with a more familiar, easier-to-place description first?

**OPTIONS:**
- **A.** Lead with the category name immediately — category-creation positioning from day one.
- **B.** Lead with a familiar comparison ("AI-assisted enterprise software evaluation") and introduce the category name once the product has enough proof points to earn it.

**RECOMMENDATION:** B in the near term, transitioning to A once Gate 2 (`11-commercialization-gates.md`) is reached.

**RATIONALE:** Category creation is a real, powerful long-term positioning strategy (`02-category-definition.md`), but it requires enough market proof that the category name itself doesn't read as inflated relative to what a prospect can actually see and touch — precisely the "never describe planned as shipped" discipline this entire document set is built around, applied to marketing language, not just internal documentation.

**RISKS:** Waiting too long forfeits first-mover framing advantage to a fast-following competitor; moving too early risks the category name outrunning the product's actual credibility with the first real buyers.

**DECISION STATUS:** Pending founder approval.

---

### 3. First ICP

**QUESTION:** Confirm or revise the beachhead ICP proposed in `06-go-to-market.md` (mid-market-to-lower-enterprise, Enterprise Architect / Head of Data & AI persona, active data/AI/cloud platform decision).

**OPTIONS:** As proposed in `06`; a narrower slice (single industry vertical first); a broader slice (any enterprise technology decision, not just data/AI/cloud).

**RECOMMENDATION:** As proposed in `06` — narrow by decision type, not narrow by industry, since the product's actual scoring depth today is strongest for data/cloud/AI platform decisions specifically, regardless of industry.

**RATIONALE:** The product's real, tested capability today maps to this ICP more precisely than to any industry-first cut — building the go-to-market wedge around what the product can actually prove today, per `04-decision-intelligence-moat.md`'s own honesty about current versus roadmap capability.

**RISKS:** Real-world design-partner conversations may reveal a different, better-fitting wedge than this hypothesis — `07-customer-learning-system.md`'s structured learning process exists specifically to catch and act on that if it happens, rather than defending the original hypothesis past its useful life.

**DECISION STATUS:** Pending founder approval as the initial working hypothesis; expected to be revisited after the first design-partner cohort, not treated as permanent.

---

### 4. First commercial model

**QUESTION:** Which model from `05-commercial-model.md` should be the first one actually built toward commercially?

**OPTIONS:** Enterprise SaaS (direct); API-first; something else.

**RECOMMENDATION:** Enterprise SaaS, direct relationship, per `05-commercial-model.md`'s own sequencing logic.

**RATIONALE:** Lowest trust risk, cleanest fit with the neutrality principle, and the only model where ClouDonna controls the full customer experience end to end — important while the company is still establishing what "trustworthy" looks like in practice, not just in a document.

**RISKS:** Slower initial revenue than a marketplace-adjacent model might offer — accepted deliberately, per `08-founding-culture.md`'s "trust before monetization."

**DECISION STATUS:** Pending founder approval.

---

### 5. First paid offering

**QUESTION:** What is the smallest real thing a customer could pay for first?

**OPTIONS:** Paid access to the save/history/replay capability once deployed (Gate 2); a paid pilot bundling implementation support alongside the product; something narrower still (e.g., a one-time paid "decision audit" engagement using the existing deterministic engine, sold as a service before any SaaS relationship exists at all).

**RECOMMENDATION:** Worth genuine founder consideration of the narrowest option — a paid, single-decision "evidenced decision audit," delivered manually/semi-manually using what's already live today (the deterministic engine, unauthenticated), requiring zero further engineering before it could be sold. This is not the long-term commercial model, but it could be the fastest real path to a first paying customer and real market signal, ahead of Sprint 6.1 even being deployed.

**RATIONALE:** Consistent with `04-decision-intelligence-moat.md`'s central finding — the flywheel doesn't start until real customer engagement exists, and the fastest way to real engagement may not be the platform's eventual steady-state offering.

**RISKS:** A services-flavored first offering could set the wrong expectation (bespoke consulting) rather than the platform expectation the company is actually building toward — needs to be framed carefully as a preview of the platform, not a permanent business line.

**DECISION STATUS:** Pending founder approval — genuinely open, not a confident recommendation like items 1–4.

---

### 6. Founding customer model

**QUESTION:** Confirm the Founding Customer Program design in `06-go-to-market.md` (3–5 partners, learning-optimized, not discount-optimized).

**RECOMMENDATION:** As proposed.

**RATIONALE:** See `06-go-to-market.md` and `07-customer-learning-system.md` in full.

**RISKS:** Too few partners under-samples decision-pattern variety; too many dilutes the founder-level attention `07`'s learning framework depends on.

**DECISION STATUS:** Pending founder approval.

---

### 7. Marketplace timing

**QUESTION:** When, if ever, does marketplace/partner-matching work begin?

**OPTIONS:** Per the existing roadmap sequence (blocked on Sprint 6.4); pulled forward for revenue reasons; deferred indefinitely as a non-core distraction from the core SaaS thesis.

**RECOMMENDATION:** Hold the existing roadmap's sequencing (`docs/roadmap/07-sprint-7-marketplace.md`) — not before Sprint 6.4 is real, and not before the neutrality-wall architecture has its own independent, separate review and approval, never bundled into a general roadmap-stage approval.

**RATIONALE:** `05-commercial-model.md`'s trust-risk ranking places this among the highest-risk models in the entire document; the existing engineering roadmap already reached the same conclusion independently, which is a meaningful corroboration, not just this document's own opinion.

**RISKS:** This is also the commercial model most likely to look attractive under investor or board revenue pressure — naming that tension explicitly now, so it's a known, anticipated pressure rather than a surprise later.

**DECISION STATUS:** Pending founder approval; strong recommendation against pulling forward.

---

### 8. Outcome benchmarking policy

**QUESTION:** What is the company's committed policy on cross-tenant outcome benchmarking — timing, consent model, anonymization standard?

**OPTIONS:** As designed in `docs/sprint-6/25-outcome-intelligence.md` (explicit opt-in consent, minimum cohort thresholds, `benchmark_eligible` and `anonymization_status` as separate, both-required gates); a lighter-touch model; deferred entirely until a dedicated privacy-engineering review.

**RECOMMENDATION:** Adopt the existing design as the committed policy, and treat "a dedicated Outcome Intelligence release... deserves its own scoped review" (the existing document's own words) as binding, not aspirational.

**RATIONALE:** This is sensitive, cross-tenant data handling with real reputational and legal exposure if done carelessly — the existing design is already thoughtful and specific; the founder decision needed here is committing to hold it under commercial pressure later, not redesigning it now.

**RISKS:** None from adopting the policy; real risk from *not* holding it once benchmark data becomes commercially valuable.

**DECISION STATUS:** Pending founder approval.

---

### 9. Neutrality safeguards — operational, not just architectural

**QUESTION:** Beyond the existing structural safeguard (the scoring engine has no field a commercial relationship could occupy), what operational governance ensures neutrality holds as the company grows — e.g., an internal review gate before any commercial feature ships, an external audit commitment, a public neutrality pledge?

**OPTIONS:** Internal-only review discipline (status quo); a formal internal governance gate requiring explicit, minuted sign-off before any Action-system or marketplace-adjacent feature ships; a future external, independent neutrality audit as a customer-facing trust signal.

**RECOMMENDATION:** Formalize an internal governance gate now, while it costs nothing (one person, one decision) — commit to an external audit as a Year 2–3 trust investment once there's a real business to audit.

**RATIONALE:** The architectural safeguard is necessary but not sufficient — it prevents a score from being *directly* purchasable, but doesn't by itself prevent a well-intentioned future feature (a "recommended partners" widget, a "customers also considered" module fed by commercial data) from creeping toward influence without anyone deciding it should. A named, explicit gate makes that a deliberate decision every time, not a drift.

**RISKS:** Process overhead at a stage where the company is otherwise trying to move fast — worth it specifically because this is the one principle whose violation would be closest to fatal to the company's entire thesis.

**DECISION STATUS:** Pending founder approval.

---

### 10. Product vs. research brand architecture

**QUESTION:** Does ClouDonna present its research/intelligence work (the knowledge graph, evidence engine, benchmark corpus) under the main product brand, or as a distinct research brand (e.g., `ClouDonna Research`) with its own credibility-building publishing motion?

**OPTIONS:** One brand, no separation; a distinct research sub-brand publishing findings independently of the product (closer to how a Bloomberg or an analyst firm builds credibility through visible research output, not just product features).

**RECOMMENDATION:** Genuinely open — leaning toward a distinct research-facing surface once there's real research to publish (Year 2+, once Sprint 6.4's knowledge work is real), since visible, citable research output is a strong, underused enterprise-credibility lever precisely aligned with the "Bloomberg Terminal" positioning ambition — but building this brand architecture before there's real research behind it would be exactly the kind of premature packaging this document set warns against elsewhere.

**RATIONALE:** See `01-company-vision.md`'s ambition and `04-decision-intelligence-moat.md`'s emphasis on real, evidenced knowledge as the compounding asset — a research brand only has value once it has something real to say.

**RISKS:** Splitting brand attention too early dilutes a small company's limited marketing capacity; waiting too long forfeits an opportunity to build credibility incrementally as research work happens rather than all at once later.

**DECISION STATUS:** Pending founder approval; not time-sensitive today.

---

## Carried forward from existing technical/architecture reviews, still open

Not re-litigated here — each already has its own QUESTION/OPTIONS/RECOMMENDATION structure in its source document, listed so this register is a complete index of what awaits founder approval, not a partial one:

- **Approve Sprint 6.1 (and the narrower Sprint 6.2 slice) as complete and ready to commit/merge/push/deploy** — `docs/roadmap/10-release-sequencing.md`'s own still-pending, still-unresolved ask, now compounded by a second, later implementation pass having happened on top of it without that approval ever having been formally given — the most concrete, immediate, and overdue item in this entire register.
- **`profiles` vs. `users` table reconciliation** — `docs/roadmap/10-release-sequencing.md`.
- **Disposition of the now-unused `decision_reports` table** — same source.
- **Whether audit logging is pulled forward** — flagged three separate times across this codebase's own documents now; still unresolved.
- **Password sign-in offered by default, or magic-link-only** — `docs/sprint-6/02-auth.md`.
- **Data retention policy** — `docs/sprint-6/12-roadmap.md`.
- **Which Supabase environment tier to provision, and a real production-migration timeline** — same source; notably, **no Supabase project has ever been provisioned for this codebase** — the schema exists only in git history today.
- **Organization-deletion UX** — deliberately deferred design work, same source.
