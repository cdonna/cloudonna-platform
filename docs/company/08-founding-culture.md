# Founding Culture

## Method

Every candidate principle below was tested against one question: is there already real, checkable evidence in this codebase that the company behaves this way, or is it an aspiration dressed as a value? Principles with real evidence are kept and cited. Principles that are true but generic — the kind any startup's slide could claim — are cut or merged. This is not a brainstorm; it's an audit of a culture that partly already exists.

## Cut, and why

- **"Vision before features"** — cut. As stated, it's the kind of line that sounds right and constrains nothing. What actually governs this codebase is more specific and more useful: nothing ships without an explicit written scope and exclusion list before code, and nothing starts before the previous stage is approved (`docs/roadmap/02-engineering-operating-model.md`'s fifteen-step process). That's a real operating discipline. "Vision before features" is the marketing paraphrase of it — the paraphrase is dropped, the actual discipline is kept below as **Architecture and sequencing before implementation**.
- **"Evidence over opinion"** — cut as a separate line, merged into *Truth over hype* below. Keeping both invites two principles that would be graded identically by the same test case; one sharper principle is more useful than two overlapping ones.

## Kept, with evidence

**Truth over hype, proven in evidence, not just asserted.** The product's own UI tells a user, on-screen, that its vendor catalog is "curated summary based on general public vendor positioning... not sourced from live market data" (`vendor-intelligence/catalog.ts`) rather than letting an AI-adjacent product imply more authority than it has. This document set itself follows the same discipline — every "implemented" claim in `docs/roadmap/` and `docs/sprint-6/` is qualified by what's verified versus assumed. The test: would a claim survive a skeptical technical buyer checking it against the actual running code? If not, it doesn't ship, in the product or in this document.

**Architecture and sequencing before implementation.** Every sprint in this codebase's history began with an explicit scope document and an architecture review before a single line of implementation code — not a retrospective description of process, a rule enforced in the actual fifteen-step operating model. The cost of this is visible and real (Sprint 6.1 remains unapproved, uncommitted weeks into its own existence); the discipline is being kept anyway, which is the actual test of whether a principle is real.

**Trust before monetization.** Every commercial model with real trust risk (marketplace, data products) is explicitly sequenced to Year 3+ in `05-commercial-model.md`, after the models with near-zero trust risk (direct SaaS) are proven first — not because trust-risky models are less lucrative (they may be more so) but because the sequencing itself is the principle.

**Independence is structural, not promised.** The scoring engine has no field a commercial relationship could occupy — this has been independently, mechanically verifiable since Sprint 3, not something a customer has to take a salesperson's word for. A culture that holds this line does not build the field even when a marketplace deal would make it tempting to.

**Disclose what's not done as rigorously as what is.** The single most distinctive, consistently-evidenced trait in this entire codebase's documentation, and the one most worth protecting deliberately as the company grows: every architecture document, test report, and security review in `docs/sprint-6/` names its own gaps explicitly — unexecuted RLS tests, unwritten audit logs, an illustrative rather than real catalog — rather than presenting a clean report that omits them. This is unusual discipline, easy to lose the moment external pressure (an investor update, a sales deck) creates an incentive to round a "designed" up to a "shipped." Naming it as its own principle, not assuming it survives by default.

**Every recommendation carries responsibility.** Concretely: a human approves every consequential action (`docs/manifesto/cloudonna-manifesto-v1.md`, "Human governance"), and no roadmap stage — including the multi-agent orchestration eventually planned for Sprint 8 — is designed to remove that human from the loop. This is a constraint the team has held even where it would be architecturally easier not to (e.g., outcomes never auto-updating scoring, `docs/roadmap/09-outcome-intelligence.md`).

**Every customer meeting improves Donna.** Formalized as an actual mechanism, not a sentiment — `07-customer-learning-system.md`. A principle without a mechanism is a wall poster; this one has a process behind it.

**Less, but significantly better.** Borrowed deliberately, not invented here — Dieter Rams' design maxim, already adopted verbatim as this codebase's own design principle (`docs/design/01-design-philosophy.md`). Worth being honest about the borrowing rather than presenting it as original; worth keeping because it's already load-bearing in real design decisions (the entire design-system rework this codebase has undergone is an application of it).

**Enterprise does not have to look boring.** Also already load-bearing (`docs/design/01-design-philosophy.md`), and directly relevant to the category bet: a Bloomberg Terminal-caliber positioning claim is not credible coming from software that looks like a generic SaaS starter template.

**AI should feel calm.** Also already established (`docs/design/09-donna-experience.md`) and directly downstream of the deterministic-authority architecture: a system whose AI layer only narrates, never decides, can afford to sound calm, because it isn't performing false confidence about something it didn't actually compute.

**Build for decades.** The one principle most tied to the 10-year ambition (`01-company-vision.md`) and most concretely evidenced architecturally: immutable, append-only decision and knowledge history isn't a compliance feature, it's this principle expressed as a database constraint — a company that plans to be trusted for decades cannot be the company whose own historical record turned out to be editable.

## What this list is for

Ten principles a small founding team can actually hold in their head and check a real decision against — not thirty aspirational values nobody consults after the offsite that produced them. When a future decision (a customer ask, an investor request, a hiring choice) creates tension with one of these, the tension itself is the useful signal — surface it explicitly (`14-founder-decisions.md` is where structural tensions like this get resolved on the record), rather than letting the principle quietly erode.
