# Company Vision

**Status: strategy document. Not a product spec. Nothing in this document is implemented by virtue of being written here.**

## Why ClouDonna exists

Enterprise technology decisions — which platform, which vendor, which architecture — are made today through a mix of vendor demos, analyst reports few can afford, consultants with their own commercial incentives, and Slack threads that evaporate the moment the decision is made. The evidence behind a $2M platform decision is rarely written down anywhere durable, rarely explainable to the person who inherits it eighteen months later, and almost never checked against what actually happened after implementation. ClouDonna exists because that gap — between the size of these decisions and the rigor applied to making and remembering them — is a real, expensive, and currently unaddressed problem, not a hypothetical one.

## Mission

Make every enterprise decision with confidence.

## Vision

Become the world's most trusted Enterprise Decision Intelligence Platform.

## 10-year ambition

The operating system for enterprise decisions — the system an enterprise architect, CIO, or transformation leader opens *before* a platform decision the way a trader opens a Bloomberg Terminal before a trade: not because it makes the decision for them, but because it is the trusted place where the evidence, the history, and the outcomes of every decision like this one already live.

## Category

Enterprise Decision Intelligence — defined in full in `02-category-definition.md`. Not "AI for enterprise software," not "a comparison portal," not "a chatbot." A new category sitting above foundation models, owning the decision layer they are rented into.

## Customer promise

Every recommendation ClouDonna gives is evidenced, explainable, reproducible, and vendor-neutral — checkable by a skeptical enterprise architect in the room, not asserted on faith. What ClouDonna remembers about a decision, it remembers correctly, permanently, and without editing history after the fact.

## North Star

> **LLMs are replaceable. Decision Intelligence is not.**

Every model ClouDonna calls today or will call in the future is a rented capability with a rented capability's ceiling. What compounds — the decision framework, the deterministic scoring model, the evidence graph, the decision history, the outcomes, the trust built on top of all of it — does not expire when a provider deprecates a model or a competitor ships a marginally better one. This is not a slogan chosen for the pitch deck; it is the actual architectural constraint every roadmap stage in this codebase has been built against since Sprint 3 (see `docs/manifesto/cloudonna-manifesto-v1.md`).

## What ClouDonna must never become

- **Not a generic chatbot.** A chatbot has no memory, no deterministic authority, and no accountability for what it said last week. ClouDonna's product experience is deliberately not a chat interface for exactly this reason (`docs/design/09-donna-experience.md`).
- **Not an LLM wrapper.** If the entire product could be replicated by a competitor pointing a slightly-better prompt at GPT-6, there is no company here. The deterministic scoring engine — not the AI narrative layer — is the product's actual authority (Sprint 3, unchanged since).
- **Not a paid-ranking comparison portal.** The day a vendor can pay for a better rank is the day every prior recommendation ClouDonna ever gave becomes retroactively suspect. This is treated as existential, not as a policy (`docs/manifesto/cloudonna-manifesto-v1.md` §6).
- **Not a vendor-controlled marketplace.** ClouDonna sits on the buyer's side of the table. A marketplace, if it ever exists, is a separate, walled-off commercial layer that never touches the recommendation (`docs/roadmap/07-sprint-7-marketplace.md`) — not the core business.
- **Not an autonomous decision-maker.** A human approves every consequential action, forever. This is a governance commitment, not a current technical limitation to be "solved" later.

## Why Enterprise Decision Intelligence matters, and why now

Two forces make this the right moment, not an arbitrary one: (1) LLMs have made it cheap to *narrate* a recommendation, which has flooded the market with confident-sounding AI advice with no accountability behind it — creating exactly the trust vacuum a deterministic, evidenced, auditable alternative can fill; (2) enterprises are making platform decisions (data, AI, cloud) faster and more frequently than their governance processes were designed for, widening the gap between decision velocity and decision rigor that this company is built to close.

## Product today, platform tomorrow, company ambition — explicitly not the same thing

| Horizon | What it actually is |
|---|---|
| **Product today** | A stateless, deterministic scoring engine (Sprint 3) plus an AI narrative layer (Sprint 5), live in production at `cdonna.com`, scoring against a hand-curated, explicitly-labeled **illustrative** 10-platform catalog — "Not sourced from live market data, analyst subscriptions, or vendor certification" (the product's own on-screen disclosure, `ResultPanel.tsx`). No auth, no persistence, no customer has ever saved a decision, because that capability is not yet live (`03-sprint-6-1-auth-and-save.md`, still unapproved). |
| **Platform tomorrow** | The five-system architecture (`03-product-strategy.md`) fully wired: real customer decisions persisted, versioned, replayed, evidenced against a real (not illustrative) knowledge graph, with outcomes fed back honestly. This is roadmap, not built. |
| **Company ambition** | The trusted operating system category leader for enterprise decisions broadly — technology decisions first, other consequential enterprise decisions later, once the category is actually owned in the first wedge. |

Conflating any two of these rows in an investor conversation, a customer conversation, or an internal roadmap discussion is the single fastest way to erode the trust this company's entire thesis depends on. See `11-commercialization-gates.md` for the objective criteria gating movement between these rows.
