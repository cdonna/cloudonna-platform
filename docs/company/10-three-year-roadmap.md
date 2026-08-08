# Three-Year Strategic Roadmap

**On numbers:** no revenue figures appear in this document. At this stage — pre-approval of Sprint 6.1, zero real customers, zero design partners engaged — any specific dollar figure would be invented, not forecast, and would violate this entire document set's own "truth over hype" principle before the ink is dry. Every year below is defined by capability and trust milestones, with commercial milestones stated qualitatively, and an explicit exit criterion that must be true before advancing to the next year — advancing on a calendar date rather than a met criterion is exactly the kind of premature motion this roadmap exists to prevent.

## Year 0 — Foundation

**Product:** the current, honestly-scoped state — a live, stateless, deterministic scoring engine plus AI narrative layer against an illustrative catalog (`cdonna.com`); Sprint 6.1 (auth, persistence) implemented but not yet approved, committed, or deployed; a narrower Sprint 6.2 slice (version timeline/viewer, diff engine) implemented on the same unapproved basis.

**Data moat:** none accumulated. The architecture is capable of accumulating one; nothing has started.

**Trust:** structurally designed (RLS, deterministic authority, vendor neutrality) but **not yet independently verified** — the RLS test suite has never run against a live Postgres instance; this is a completion criterion, not a nice-to-have, before Year 0 can honestly be called closed.

**GTM:** not started. `06-go-to-market.md` is a plan.

**Customers:** zero.

**Commercial model:** none active.

**Organizational capability:** founder plus AI-assisted engineering; every function in `09-operating-model.md` performed by one person.

**Exit criteria before advancing to Year 1:** Sprint 6.1 formally approved, committed, and deployed to a real environment (not just quality-gated in a worktree); RLS verification actually executed against a live Postgres instance; the Founding Customer Program (`06-go-to-market.md`) has at least one real, engaged design partner working a real decision.

## Year 1 — Product-Market Fit (Enterprise Software Decision Intelligence)

**Product:** the full save → version → replay → diff loop live and used by real customers on real decisions (Sprint 6.2 completed beyond this sprint's narrower slice, per `docs/roadmap/04-sprint-6-2-history-and-versioning.md`); Sprint 6.3's multi-user/team tenancy, since a design partner's team, not just one architect, needs to use this together.

**Data moat:** the first real (not illustrative) decision history — small, but real. Still weak-to-medium per `04-decision-intelligence-moat.md`'s ranking; the compounding assets haven't had time to compound yet.

**Trust:** RLS independently verified; a real, honest privacy/data-handling posture communicated to design partners (no GDPR claim made until it's actually true, per `docs/sprint-6/08-security.md`).

**GTM:** the Founding Customer Program running at its intended 3–5-partner scale; the beachhead use case (`06-go-to-market.md`) either validated with real evidence or explicitly revised based on what those conversations actually show.

**Customers:** the design-partner cohort, not yet paying customers in the traditional sense — see `05-commercial-model.md`'s sequencing.

**Commercial model:** enterprise SaaS pricing designed and priced, not yet charged at scale — first real paid pilots possible late in this year if Gate 2 (`11-commercialization-gates.md`) is genuinely met, not assumed.

**Organizational capability:** likely the first hire — a GTM/customer-relationship function, per `09-operating-model.md`'s own reasoning that this is the least AI-assistable function and the one with zero current capacity.

**Exit criteria before advancing to Year 2:** at least one paid pilot (Gate 2 met); the beachhead ICP validated by real usage patterns, not just hypothesis; audit logging closed (a named, repeated gap across three documents already — `docs/roadmap/10-release-sequencing.md`).

## Year 2 — Intelligence Network (Knowledge, Evidence, Benchmarks, Outcomes)

**Product:** Sprint 6.4 — the real knowledge graph and evidence engine replacing the illustrative catalog; explainability layer and confidence decomposition live; the first real outcome data starting to accumulate from Year 1's earliest saved decisions.

**Data moat:** the first genuinely proprietary knowledge — reviewed, provenanced facts, not a curated illustrative catalog — plus the beginning of real outcome linkage. This is where the moat ranking in `04-decision-intelligence-moat.md` starts moving from "weak/medium" toward "strong" for the first time.

**Trust:** the `product_facts_ai_never_self_verifies` discipline proven in production, not just designed; a real security review of the new cross-tenant knowledge-sharing surface (`docs/sprint-6/08-security.md` already flags this as needing its own review pass, not a checkbox).

**GTM:** expansion from the beachhead persona to the broader buying center (CTO/CIO economic buyers) within existing accounts; the API and Enterprise Intelligence subscription models (`05-commercial-model.md`) become viable for the first time, since they depend on the knowledge graph being real.

**Customers:** a small but real paying customer base, expanding from the Year 1 design partners plus new-logo growth within the same ICP.

**Commercial model:** enterprise SaaS at real scale; cautious, contractually-guarded API pilots; Enterprise Intelligence subscription for early adopters.

**Organizational capability:** the first Knowledge/Research function (`09-operating-model.md`), since fact review and verification is explicitly a human-authority function that cannot scale on founder time alone once real ingestion volume exists.

**Exit criteria before advancing to Year 3:** the knowledge graph contains real, reviewed facts covering the beachhead decision category with credible depth (not a specific number invented here — a qualitative bar: a design partner, shown the evidence behind a recommendation, finds it genuinely more rigorous than what they had before, not merely differently presented); enough outcome data exists to make the System of Learning's non-negotiable ("never silently retrain scoring") a real, exercised discipline rather than a theoretical one.

## Year 3 — Category Leadership (Broader Enterprise Decision Intelligence)

**Product:** Sprint 6.3's organizational depth fully mature; the beginning of category expansion beyond the initial technology-decision wedge, per `02-category-definition.md`'s broader ambition — evaluated critically at this point, not assumed to be the right move by default (see the critical review's "narrowest wedge" question).

**Data moat:** the compounding assets from `04-decision-intelligence-moat.md` genuinely compounding — real decision history, real outcome data, real evidence corroboration across a meaningful customer base. This is the earliest point in this roadmap where "moat" stops being an architectural aspiration and starts being a checkable competitive fact.

**Trust:** the closest this roadmap gets to a real enterprise-security posture — but still explicitly not claiming formal compliance certifications unless genuinely pursued and achieved; category leadership claims must remain as evidenced as every other claim in this document set.

**GTM:** category-defining marketing and thought leadership becomes credible for the first time — before this point, "category leader" positioning would be aspirational language unsupported by actual market position, exactly the gap this document warns against elsewhere.

**Customers:** a real, referenceable customer base spanning the initial ICP and early expansion into adjacent enterprise-architecture buying centers.

**Commercial model:** the higher-trust-risk models (marketplace, benchmark subscriptions, data products) become considerable for the first time, gated on their own independent review per `05-commercial-model.md` — not automatically greenlit because the calendar reached Year 3.

**Organizational capability:** a real, small, functionally-complete team across the roles in `09-operating-model.md`, no longer one founder wearing every hat.

**Exit criteria — this is the point where "exit criteria" becomes "what does category leadership actually require next," not a gate to another year of this specific roadmap.** That is itself a founder-level strategic decision this document does not resolve in advance.

## The honest summary of this roadmap

Year 0 is mostly still ahead of where the codebase actually is today (Sprint 6.1 unapproved). Year 1 is where the company starts existing commercially in any real sense. Year 2 is where the moat starts being real rather than architected-for. Year 3 is the earliest point "category leadership" stops being aspirational language. Anyone reading this roadmap and concluding the company is closer to Year 2 or 3 than this document states has misread it — that misreading is precisely the failure mode `01-company-vision.md`'s "product today / platform tomorrow / company ambition" distinction exists to prevent.
