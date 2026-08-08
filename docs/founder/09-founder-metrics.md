# Founder Metrics — Rejecting Vanity, Keeping Signal

Full category-by-category dashboard design: `docs/company/12-founder-dashboard.md`. This document is deliberately smaller — the handful of numbers a founder should actually check personally, and an explicit list of numbers that feel like progress but aren't.

## Rejected, explicitly, and why each one lies

- **Signups / waitlist size.** Costs nothing to inflate, means nothing about whether the product solves a real problem, and actively invites optimizing for the wrong thing (top-of-funnel breadth) in a company whose entire strategy is a narrow, deep wedge.
- **Website traffic / page views.** Not connected to anything this company is actually trying to prove.
- **Raw decision count, without quality context.** A hundred near-identical decisions from one design partner teach less than five varied ones — counted alone, this number rewards volume over the actual signal (`docs/company/15-critical-review-v2.md`'s sampling-bias warning).
- **"AI messages generated" or any usage-of-the-model metric.** Measures reliance on rented infrastructure, not accumulation of anything proprietary — the opposite of what this company should be proud of growing.
- **Raw vendor/fact count in the knowledge graph, without verification status attached.** A thousand `inferred`, unreviewed facts is not progress — it's exactly the "backlog that looks like coverage" failure mode named in `docs/company/18-flywheel-v2.md`.
- **A composite "Decision Intelligence Index."** Rejected on the same grounds as `docs/company/12-founder-dashboard.md` already established — false precision, not a real number.
- **Funding raised.** A resource, not a result. Worth tracking for operations; never presented internally as evidence of progress toward the mission.
- **Press mentions, follower counts, generic NPS with no segment attached.** None of these distinguish a company earning real trust with real buyers from a company that's good at getting attention — a distinction this entire document set treats as the whole game.

## The vital few

1. **Repeat usage** — customers returning for a second, real decision, not just their first. The single strongest available signal that the product is becoming a habit rather than a one-time evaluation, and the metric most directly tied to whether the flywheel (`docs/company/18-flywheel-v2.md`) has actually started turning.
2. **Verified evidence ratio** — the fraction of facts backing real, active recommendations that are `verified` rather than `inferred`/`vendor_provided`. The single number that most honestly tracks the gap between "illustrative" and "real" this entire document set keeps naming.
3. **Outcome-linked decisions** — the count of decisions with a real, reviewed outcome attached. The most direct available proxy for the compounding moat (`docs/founder/04-moat-playbook.md`) actually accumulating, not just being designed for.
4. **Design partner → paid conversion** — not raw pilot count, the conversion itself. A high pilot count with zero conversion is a sign the product isn't earning trust; this ratio is the honest tell.
5. **Trust incidents** — target zero, tracked with the same seriousness a security team tracks a breach count, because a single incident here (a neutrality lapse, a tenant-isolation failure) resets the flywheel completely (`docs/founder/04-moat-playbook.md`), not just dents it.
6. **Time-to-defensible-decision** — does using ClouDonna actually make the evaluation faster and more rigorous than the customer's prior process, measured against their own account of that prior process (`docs/company/07-customer-learning-system.md`'s structured capture). This is the closest available proxy to the actual customer promise (`06-product-philosophy.md`) being kept.

## The discipline this list is meant to enforce

Six numbers, checkable without a dashboard tool, memorizable the same way `01-founder-principles.md`'s seven principles are meant to be. If a future proposal to add a seventh metric doesn't clearly beat one of these six for signal density, the answer is no — a metrics list that grows without discipline becomes exactly the vanity-metric trap this document exists to prevent, just spread across more numbers instead of one bad one.
