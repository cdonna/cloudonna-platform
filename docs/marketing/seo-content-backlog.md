# SEO Content Backlog

**Status:** Backlog, not a build queue. Nothing here should be built as a thin page — every entry below needs a genuine, substantive answer before it is published, consistent with the product's own evidence standard (a content page that asserts a vendor comparison without evidence is the exact failure mode ClouDonna exists to prevent in its own product).

## Why this list and not a longer one

The brief that prompted this list named eight candidate topics. All eight are kept below because each one maps to a real, answerable question with a real, defensible point of view ClouDonna can take using what the product already knows (the Donna Score dimensions, the vendor catalog, the Business Case Engine's formulas) — not because eight is a round number. No topic was added purely to pad out a content calendar; a ninth topic should only be added here when it clears the same bar.

## Backlog

### 1. SAP BDC vs Databricks vs Microsoft Fabric
**Search intent:** a CIO/EA comparing three specific, named platforms for a data/AI platform decision.
**What makes this substantive, not thin:** the existing vendor catalog already has structured, honest data on all three (architecture characteristics, maturity bands, cost tiers, integration strengths) — this page is a real application of that data, not a rewrite of vendor marketing pages. Must explicitly address the ecosystem-concentration trade-off for each (SAP-native lock-in vs. Databricks' open-format portability vs. Microsoft-ecosystem bundling) rather than picking a winner.
**Primary semantic theme:** Enterprise Data Platform Decision Framework, Enterprise Architecture Decision.

### 2. Snowflake vs Databricks
**Search intent:** one of the highest-volume real comparison searches in this category.
**What makes this substantive:** the catalog's own distinction between the two (BI/analytics-first simplicity vs. AI/ML-first engineering depth) is a genuine, defensible point of difference backed by the maturity-band data already curated — this is not a coin flip to dress up as content.
**Primary semantic theme:** Vendor Comparison, Data Platform Strategy.

### 3. Enterprise Data Platform Decision Framework
**Search intent:** someone looking for *how to decide*, not a specific vendor comparison — a framework-level query.
**What makes this substantive:** this is, almost directly, a description of the Decision Engine's own ten dimensions and the Business Case Engine's cost/benefit model — the most natural piece of content on this list, because it is describing the product rather than writing new analysis to support it.
**Primary semantic theme:** Technology Decision Platform, Enterprise Architecture Decision.

### 4. Enterprise AI Platform Decision Framework
**Search intent:** the AI-specific sibling of #3 — a CIO/AI lead deciding between AI platform strategies, not a specific model choice.
**What makes this substantive:** can draw directly on the AI Use Case Portfolio page's own quadrant model (quick win / strategic bet / foundation investment / low-value-high-complexity) rather than inventing a new framework for this page alone.
**Primary semantic theme:** Enterprise AI Strategy.

### 5. How to Build a Technology Business Case
**Search intent:** a finance/IT partner actually trying to build one, now that the Business Case Engine is live.
**What makes this substantive:** this can be written directly from the Business Case Engine's real cost/benefit category taxonomy (implementation, migration, subscription/license, consumption, infrastructure, operations, support, internal FTE, external services, training, data egress, change management — and the nine benefit categories) — a genuine, specific methodology, not generic business-case advice available on a hundred other sites.
**Primary semantic theme:** Technology Business Case, Technology Investment Decision.
**Dependency:** should not be written until the Business Case Engine's public-facing description (architecture-stack.ts, this release) has shipped — writing this page before that would itself be the "roadmap marketed as live" problem this release gate exists to prevent.

### 6. TCO vs ROI vs NPV for Enterprise Technology Investments
**Search intent:** a genuine, common confusion among non-finance technology buyers evaluating a business case.
**What makes this substantive:** the Business Case Engine's own formulas (deterministic TCO, ROI with the documented null-when-zero-investment rule, NPV via standard discounting, payback via linear interpolation within the crossing year) give this page real, specific content instead of textbook definitions.
**Primary semantic theme:** Technology Business Case.

### 7. How CIOs Should Evaluate Technology Platforms
**Search intent:** broader than a specific framework — a CIO persona query.
**What makes this substantive:** this is the one entry most at risk of being generic "thought leadership" filler. Only build it once it can be anchored in something specific ClouDonna actually does differently (e.g., the explicit separation of deterministic score from AI-assisted interpretation, or the Challenger Agent's structural inability to produce a financial figure) rather than restating conventional CIO-evaluation advice available everywhere.
**Primary semantic theme:** Enterprise Architecture Decision, Decision Governance.

### 8. What Is Enterprise Decision Intelligence?
**Search intent:** category-definition query — the most important page on this list for brand entity discoverability (brief §27), since it is the page most likely to get ClouDonna associated with the category name in search results and in any future analyst/press context.
**What makes this substantive:** should describe the four-capability model (Decision Intelligence, Evidence Intelligence, Scenario Intelligence, Decision Memory) exactly as defined in `docs/content/terminology-glossary.md` and the new `/company` page — not a separate, drifting definition.
**Primary semantic theme:** the category itself; every other semantic theme in this backlog is a specialization of this one.

## Sequencing note

#8 should ship before or alongside #3/#4 — defining the category before explaining two of its four capabilities in isolation keeps a reader's mental model straight, and gives #3/#4 a clean, consistent anchor to link back to.

## Explicitly not in this backlog

Vendor-specific "best alternatives to [paid competitor]" pages, generic "AI in the enterprise" trend pieces with no ClouDonna-specific point of view, and anything requiring a named customer logo or case-study quote the company does not yet have (see `legal.imprint`'s own honesty standard — this backlog holds itself to the same rule the legal pages already do).
