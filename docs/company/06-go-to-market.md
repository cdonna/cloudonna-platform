# Go-to-Market

## Initial target personas, ranked by fit — not all pursued with equal priority

| Persona | Why they're relevant | Priority |
|---|---|---|
| **Chief Architect / Enterprise Architect** | Owns the actual reasoning process this product replaces — evaluates platforms for a living, feels the pain of undocumented decisions most acutely, most likely to appreciate deterministic + explainable as a real feature rather than marketing language. | **Primary beachhead persona** |
| **Head of Data & AI** | Owns exactly the category of decision the current product scores best (data/AI platform choices) — highest product-market overlap with what's actually built today. | **Primary beachhead persona** |
| **CTO** | Budget authority and organizational reach; cares about the decision but is one level removed from doing the evaluation work personally. | Secondary — champion or buyer, not the daily user |
| **CIO** | Ultimate budget owner for platform decisions at scale; the eventual economic buyer once the product has proven itself with the personas above. | Secondary — later-stage buyer, not first-contact |
| **CDO** | Cares deeply about data-platform decisions specifically; strong overlap with Head of Data & AI. | Secondary |
| **Transformation Leader** | Cares about the decision *process* being defensible, especially in regulated or board-scrutinized transformations. | Tertiary — good for later expansion, weaker initial fit (their pain is more about program governance than any single platform choice) |
| **Procurement** | Cares about the outcome (a defensible, documented decision trail) but is rarely the one doing the evaluation — more a downstream beneficiary/enforcer of the practice than an initial adopter. | Tertiary |

## Beachhead use case

**A specific, named, recurring enterprise technology decision — not "help me decide anything."** Given what's actually built (a scoring engine tuned for data/cloud/AI platform decisions across 10 real platform categories), the beachhead is: **"Which data/AI platform should we choose for [a specific initiative]"** — the exact decision shape the product already scores today, not a hypothetical broader claim.

## Ideal customer profile

- Mid-market to lower-enterprise (roughly 500–5,000 employees, `500m-2b` revenue band in the product's own segmentation) — large enough to have a real, high-stakes platform decision and a designated architecture function, small enough that a design partner relationship with a startup is plausible without an 18-month procurement cycle.
- Actively evaluating a data platform, cloud migration, or AI-adjacent technology decision *right now* — not "might need this someday."
- Has a named Enterprise Architect or Head of Data & AI role, not just a generalist IT manager — the beachhead persona needs to exist inside the organization for the product to have a natural owner.
- No existing, entrenched internal "decision framework" tool they're already emotionally and politically invested in replacing.

## Painful triggering event

A specific, dated moment where the organization must choose between multiple competing platforms/vendors and currently has no rigorous, evidenced, defensible way to do it — e.g., an ERP modernization kickoff, a cloud data platform RFP, a board or audit committee asking "why did we choose this vendor" about a past decision with no good answer on file.

## Compelling event

The decision has a deadline (a contract renewal, a budget cycle, a board presentation) that forces resolution within a specific window — a compelling event is what turns "this would be nice to have" into "we need this in the next six weeks," and is the difference between a design partner who engages seriously and one who lets the conversation drift.

## Buying center

The Enterprise Architect or Head of Data & AI is the initial user and champion; the CTO or CIO is the economic buyer who needs to approve spend once the relationship moves past a free/design-partner stage. In the design-partner phase (`Founding Customer Program`, below), there may be no formal "buying center" at all — the goal there is learning, not a sale.

## Land motion

Land through the beachhead persona directly, on a single, specific, real decision they're already working on — not a broad platform pilot. The product's own existing unauthenticated, no-signup-required Donna AI experience is a genuine asset here: a real architect can get a real, evidenced recommendation on a real decision in minutes, with zero procurement friction, before any commercial conversation happens at all. This is the single strongest go-to-market asset already built and live — worth naming explicitly, since it means the land motion can start today, informally, without waiting for Sprint 6.1's auth/persistence layer to be approved and deployed.

## Expansion motion

Land on one decision → the architect saves it (once persistence ships) and experiences the System of Record value → expand to the architect's broader team and their next several decisions → expand to org-wide adoption as the default decision practice → expand commercially from a free/design-partner relationship to a paid SaaS seat, once Gate 2/3 (`11-commercialization-gates.md`) is actually met.

## Founding Customer Program

**Explicitly optimized for learning, not discounts** — the program's entire value to ClouDonna is real usage data and real feedback on a pre-revenue product, not early revenue, which at this stage would be premature and would risk the exact "describe planned as shipped" failure mode this whole document set warns against.

**Qualification criteria:**
- A real, current, named technology decision matching the beachhead use case above (not a hypothetical or already-decided one used retroactively).
- A named Enterprise Architect or Head of Data & AI willing to spend real time — this program asks for genuine engagement, not a five-minute demo click-through.
- Willingness to give structured, honest feedback, including negative feedback, on a product this document is explicit about being pre-production-ready.
- Explicit acknowledgment that the vendor catalog is illustrative, not live market data, at this stage — no design partner should be recruited under a false impression of what the product currently evaluates against (see `11-commercialization-gates.md`'s Gate 1 criteria).

**Number of initial design partners:** a small, deliberately bounded cohort — **3 to 5**, not more. Enough to see real pattern variety across different decision types and industries; few enough that each one gets genuine founder-level attention and the customer-learning framework (`07-customer-learning-system.md`) can actually be applied rigorously to every conversation rather than diluted across too many relationships at once.

**What they receive:** direct access to a working session with the product on their real decision; direct input into the roadmap (their feedback materially shapes Sprint 6.2/6.3 priorities); free access through the design-partner period; founder-level relationship and responsiveness; first right of reference/case-study participation once the product is further along, at their discretion.

**What ClouDonna receives:** real usage data on a real decision (structured per `07-customer-learning-system.md`); validation or invalidation of the beachhead hypothesis; the first real inputs to the knowledge graph and evidence corpus, abstracted per the anonymization discipline in `07`; a credible reference relationship for the next stage of GTM, once earned.

**Feedback cadence:** a structured session at the start (decision framing, per `07-customer-learning-system.md`'s ten questions), a check-in at the point of recommendation, and a follow-up after the customer has had time to act on or reject it — not a single one-off demo, and not so frequent it becomes a burden the design partner disengages from.

**Reference strategy:** no public reference, case study, or logo usage without explicit, separately-granted permission — the design-partner relationship's default is confidential, upgraded to public only by the customer's own choice, never assumed.

**Data/privacy boundaries:** no confidential customer data (their internal documents, their actual vendor pricing, their proprietary business context) is used to populate ClouDonna's own shared knowledge graph without explicit, informed permission — see `07-customer-learning-system.md` for the abstraction/anonymization design this commits to structurally, not just as a policy promise.

## What this document deliberately does not do

Try to sell "all enterprise decisions" on day one. The category ambition (`02-category-definition.md`) is broad; the go-to-market wedge is narrow on purpose — technology platform decisions, for architecture-function buyers, full stop, until that wedge is actually won.
