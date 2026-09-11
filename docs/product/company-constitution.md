# The ClouDonna Constitution

**Version 1.0**
**Status:** Founding document. Amend deliberately, not casually — every
other document in `docs/product/` is downstream of this one, not the
other way around.

## Preamble

ClouDonna exists to make enterprise technology decisions defensible: not
faster, not flashier, not friendlier than the alternative — defensible.
A defensible decision is one you can explain, six months later, to
someone who wasn't in the room, using evidence they can check themselves.
Every article below exists to protect that one property against the
everyday pressures that erode it: the pressure to ship a vendor
partnership, the pressure to sound more confident than the evidence
supports, the pressure to answer fast instead of answering right.

This constitution binds the product, not just the marketing. Where a
feature and a principle conflict, the principle wins, and the feature
gets redesigned — not the other way around.

---

## Article I — Business First

Technology is never the starting point. Every capability, pattern, and
vendor conversation exists downstream of a stated business goal and a
stated desired outcome. A product decision that can be explained without
reference to a specific business goal has skipped a step, not saved one.

*In practice:* the ten-stage workshop flow (`donna-workshop-mode.md`)
makes vendor and product names structurally unreachable before business
context, capabilities, requirements, and constraints have been
established.

## Article II — Evidence Before Opinion

A claim without evidence is an opinion, however fluent. Donna is
permitted to have narrative style. Donna is not permitted to have
opinions the evidence doesn't support.

*In practice:* `IntelligenceEnrichment` has no field capable of holding a
score; every narrative claim is validated against the evidence package
that produced it, and a claim that can't be traced back is rejected, not
softened.

## Article III — Vendor Neutrality

No vendor, partner, sponsorship, or commercial relationship may influence
a score, a ranking, or which platforms are shown. This is not a policy
Donna follows — it's a shape the data model does not allow to be
violated.

*In practice:* the vendor catalog has no tenant owner, no vendor has
write access to its own listing, and every platform is scored on
identical, published, weighted dimensions.

## Article IV — Explainability

Every conclusion answers why, why not, on what evidence, at what
trade-off, at what risk, against what alternatives, missing what
information, and at what confidence. A recommendation that can't answer
all eight is not finished.

*In practice:* see `donna-explain.md` in full.

## Article V — Human Authority

Donna recommends. A person decides. No output of this system is
permitted to take an action in the world — provision, purchase, commit,
notify a vendor — without a human deliberately choosing to. As the
product grows the capability to *act*, this article grows teeth; until
then, it is the boundary nothing gets to cross without a separate,
explicit decision to change it.

## Article VI — Transparency

The user always knows three things: what is real versus illustrative,
what is deterministic versus AI-generated, and what ClouDonna doesn't yet
know. None of these three is optional, hideable, or buried in a settings
page.

*In practice:* "Illustrative example" labeling, the `disclosure` field on
every enrichment, and `missingInformation` as a first-class, always-shown
output.

## Article VII — Privacy

Only the minimum necessary information leaves the system for any purpose,
including a future AI provider call. Data minimization is not a
compliance checkbox — it is a design constraint applied before the first
line of a feature is written, not audited in afterward.

*In practice:* the evidence package sent to any future intelligence
provider is a bounded shortlist and computed facts, never the raw wizard
input, never the full catalog, never more than the narrative task
requires. See `docs/intelligence/evidence-package.md`.

*What this article does not claim:* good architecture is not the same as
legal compliance. Every document that touches data handling in this
project says so explicitly, and this one is no exception — real
deployment requires real legal and policy work this constitution does not
substitute for.

## Article VIII — Learning

A decision that is never revisited teaches nothing. ClouDonna is designed
to remember what was decided, track whether it worked, and let that
memory improve future decisions — for the organization that made the
decision, and, over time, for the model behind Donna Score itself.

*In practice:* `decision-memory.md` — Decision Replay, Decision Timeline,
Decision Evolution, Lessons Learned, and Business Outcome Tracking are the
mechanism; most of it is proposed, not yet built, and this constitution
treats "proposed but honestly unbuilt" as more aligned with this article
than "built but fake."

## Article IX — Long-Term Thinking

Optimize for the decision being right in three years, not for the demo
being impressive today. Every shortcut this project has explicitly
refused — fabricated market data, invented vendor claims, a vendor
comparison presented as certified fact — was refused because it would
have made a better demo and a worse institution.

## Article X — Trust Is the Product

Everything else — the scoring model, the catalog, the narrative layer,
the workshop flow — is infrastructure in service of one asset: whether an
enterprise decision-maker believes what ClouDonna tells them. That asset
is more valuable than any single feature and slower to rebuild than any
outage. When a trade-off must be made between trust and velocity, this
article is the tie-breaker, and it breaks toward trust every time.

---

## On amendment

This document should be hard to change and easy to cite. A proposed
amendment should name which article it revises, why the current wording
no longer serves the preamble's one goal — a defensible decision — and
should survive the same evidence-before-opinion standard Article II holds
the product to. A constitution that can be quietly edited to fit
whatever shipped last sprint is not a constitution.
