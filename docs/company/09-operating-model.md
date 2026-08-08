# Operating Model — While Extremely Small

## Roles, as functions, not headcount

At current size (a founder plus AI-assisted engineering capacity, no hires yet evidenced anywhere in this document set), every role below is a *function that must be performed*, not a person who must be hired. Most are currently performed by one person wearing several hats, which is named explicitly rather than obscured behind an org-chart-shaped document that implies a team that doesn't exist yet.

| Function | Currently performed by | AI-assistable? |
|---|---|---|
| Founder / CEO | Founder | No — see below |
| Product & Platform Architecture | Founder, with AI-assisted drafting/review | Substantially — see below |
| Engineering | AI-assisted (this codebase's entire implementation history), founder-reviewed | Substantially |
| Design | Partially AI-assisted (the design-system audit and roadmap in `docs/design/`), founder-directed | Substantially for audit/system work, less for genuine creative direction |
| Research / Intelligence | Not yet a distinct function — folded into Product & Platform Architecture today | Will become AI-assistable once real evidence-ingestion work exists (Sprint 6.4) |
| GTM | Founder, not yet formally started (`06-go-to-market.md` is a plan, not an executed motion) | Low — GTM is relationship-building, which is the least AI-assistable function on this list |
| Knowledge | Not yet a distinct function — the knowledge graph doesn't exist yet to curate | Will become substantially AI-assistable for extraction/classification, never for final verification (per `docs/sprint-6/14-product-knowledge-layer.md`'s own constraint) |
| Security / Governance | Founder, AI-assisted for review passes (this document set's own predecessor sessions performed exactly this function) | Substantially for review and gap-finding, never for final sign-off |

## What can currently be AI-assisted, concretely

Drafting architecture documents against an explicit brief; implementing scoped, reviewed code changes; running quality gates and reporting results honestly; performing structured security/architecture review passes and surfacing findings; drafting strategy documents from source material, as this very document set demonstrates. All of this is real, already-proven capability in this codebase's own history — not a hypothetical claim.

## What requires human authority, without exception

- **Approving a sprint as complete and ready to commit, merge, push, or deploy** — the existing operating model already states this explicitly (`docs/roadmap/02-engineering-operating-model.md`, "Approval gates are per-stage, not per-task... not a rubber stamp on a plan"), and nothing about AI assistance changes who is accountable for that approval.
- **Any commercial decision** — pricing, a customer commitment, a partnership term, a marketplace policy.
- **Any decision that touches the neutrality principle** — no AI-assisted process approves its own compliance with "commercial features must never influence recommendations"; that judgment call is reserved.
- **Any decision listed in `14-founder-decisions.md`** — by construction, everything on that register is there because it is not resolvable by an assistant, however capable.
- **Legal, compliance, and company-formation decisions** — naming, trademark, incorporation structure, data-processing agreements — none of which this document set claims to resolve (see `13`/`14` for what's explicitly deferred to external verification).

## Do not anthropomorphize AI roles as accountable executives

Restated plainly because it is easy to slip into org-chart language ("the AI is our Head of Research") that implies an accountability this document does not grant and should not imply to anyone reading it — a customer, an investor, or a future hire. Claude Code, or any AI system used in building this company, is an engineering and architecture *assistant* — capable, fast, and (per `08-founding-culture.md`) held to the same "disclose what's not done" discipline as everything else in this codebase. It has no decision rights of its own, is not a role on an org chart, and does not carry responsibility — the human founder does, for every output, always. This is not a hedge; it is the same "human governance" principle the product itself is built around (`docs/manifesto/cloudonna-manifesto-v1.md`), applied reflexively to how the company that builds the product operates.

## Decision rights, stated explicitly

| Decision type | Who decides |
|---|---|
| What gets built next, at the roadmap-stage level | Founder, informed by AI-assisted architecture review |
| Whether a specific implementation is correct/complete | Founder, informed by AI-run quality gates and review — never self-certified by the same process that built it, without independent review |
| Whether to commit, merge, push, deploy | Founder, always, explicitly — never inferred from "the gates passed" |
| Pricing, commercial terms, customer commitments | Founder |
| Anything touching vendor neutrality or tenant trust | Founder, with a bias toward the more conservative reading when in doubt |
| Company naming, legal structure, fundraising terms | Founder, with external legal/professional input this document set does not and cannot substitute for |

## Why this model, at this size, rather than hiring ahead of need

The operating model's own existing discipline — narrow, sequenced, one verified stage at a time — argues against hiring ahead of a proven need, for the same reason it argues against building Sprint 6.4 before Sprint 6.1 is even approved. The first hires this model implies, once warranted by real traction: someone owning GTM/customer relationships directly (the least AI-assistable function, and the one most clearly still entirely unstarted), and, once the knowledge graph work begins in earnest, someone owning knowledge curation and verification — precisely because that function's core value (a human reviewer's judgment) is the one thing `docs/sprint-6/14-product-knowledge-layer.md`'s own database constraint refuses to let AI self-certify.
