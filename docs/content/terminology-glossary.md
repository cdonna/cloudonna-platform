# ClouDonna Terminology Glossary

**Status:** Canonical. Any new public-facing copy (site, docs, decks) should match this file rather than inventing a parallel phrasing. Written as part of the Website Perfection, SEO & Brand Privacy Release Gate after finding the same concept worded three different ways across the five locale dictionaries (`apps/web/src/i18n/dictionaries/*.ts`).

## How to read this file

For each term: whether it is **kept in English** across every locale (a product/category name) or **translated**, and if translated, the canonical word per locale. Consistency beats literal translation — a term translated differently on two pages is worse than a term left in English everywhere.

## Product & category names — kept in English everywhere

These are proper nouns or category labels. Translating them inconsistently (or at all) is what produces Denglish/Frenglish-style drift. Every locale uses the identical string.

| Term | Notes |
|---|---|
| ClouDonna | Company/product name. Never declined, never translated. |
| Donna AI | Product name. |
| Decision Intelligence | Primary category label (also used as "Enterprise Decision Intelligence"). |
| Decision Memory | Capability name. |
| Decision Engine | System component name (shown on the homepage's Platform Architecture section). |
| Scenario Engine | System component name. |
| Research Agent | System component name — newly shipped; was missing from public architecture claims entirely until this release (see §T of the release report). |
| Business Case Engine | System component name — newly shipped. |
| Evidence Graph | System component name (status: planned — a provenance table exists, the full graph is v0.1 design). |
| Enterprise Ontology | System component name (status: architectural direction). |
| Agent Control Plane | System component name (status: architectural direction). |
| Scenario Lab | Page/product name (`/scenario-lab`). |
| Cost & Value Lab | Page/product name (`/cost-value-lab`). |
| Trust Center | Page/section name. Grammatical gender/case still applies around it in inflected languages — see "Trust Center" entry below. |
| Decision Sprint | Commercial package name. |
| Decision Challenger | The adversarial-review capability's name, when referenced publicly. Not yet a public-facing page at the time of this release; keep this exact English name if/when it is introduced, consistent with Decision Engine/Scenario Engine. |
| Public Alpha | The one, consistent product-maturity label. Do not introduce "Beta," "Preview," or "Early Access" as a synonym for product stage — "Early Access" and "Founding Tester" exist but name a *signup program*, not the product's maturity. |

**Grammatical note on "Trust Center":** in German, this takes neuter grammatical gender (*das* Trust Center) because the head noun "Center" is neuter — "Das vollständige Trust Center lesen," never "Den vollständigen Trust Center lesen" (a case/gender error found and fixed in this release).

## Core evidence taxonomy — the six types

The six-type taxonomy (`apps/web/src/components/showcase/EvidenceTag.tsx`) is the one piece of terminology every other claim-accuracy and trust claim on the site depends on. It must be worded identically everywhere it appears.

| EN (canonical) | DE | FR | ES | IT |
|---|---|---|---|---|
| Official Source | Offizielle Quelle | Source officielle | Fuente oficial | Fonte ufficiale |
| Customer Input | Kundenangabe | Donnée client | Dato del cliente | Dato del cliente |
| Observed Data | Beobachtete Daten / etwas Beobachtetes | Donnée observée / quelque chose d'observé | Dato observado / algo observado | Dato osservato / qualcosa di osservato |
| Calculated | Berechnet / etwas Berechnetes | Calculé / quelque chose de calculé | Calculado / algo calculado | Calcolato / qualcosa di calcolato |
| AI Interpretation | KI-Interpretation | Interprétation de l'IA | Interpretación de la IA | Interpretazione dell'IA |
| Assumption | Annahme | Hypothèse | Supuesto | Assunzione / ipotesi |

**Found and fixed in this release:** "AI Interpretation" had drifted to "AI narrative" / "KI-Erzählung" / "récit d'IA" / "relato de IA" / "racconto dell'IA" in the list that names all six evidence types side by side, across every single locale including English — the EN copy itself was the root cause, not a translation error. Separately, the verb describing *what AI does with evidence* had drifted to "narrates"/"erzählt"/"relate"/"relata"/"racconta" in three different places on the site (the governance triad, the independence rules, and the Trust Center's "How AI is used" section), inconsistently with the one correct instance already in German ("erläutert"). Standardized everywhere to **explains / erläutert / explique / explica / spiega** — a neutral, factual verb, not a storytelling one, which matters specifically because this sentence is a trust claim about what AI is and is not allowed to do.

The one place "narrative" legitimately stays is the *definition* of AI Interpretation itself ("AI interpretation... a narrative over facts already computed") — there it is describing what the output structurally is, not naming the category or the action.

## Decision domain concepts

| EN | DE | FR | ES | IT | Decision |
|---|---|---|---|---|---|
| Decision | Entscheidung | Décision | Decisión | Decisione | Translated |
| Enterprise Decision | Enterprise-Entscheidung | Décision d'entreprise | Decisión empresarial | Decisione aziendale | Translated |
| Decision Workspace | Decision Workspace | Decision Workspace | Decision Workspace | Decision Workspace | Kept in English — it is the name of a specific UI surface shown in the homepage journey, not a generic phrase. |
| Constraint | Randbedingung / Constraint | Contrainte | Restricción | Vincolo | Translated |
| Recommendation | Empfehlung | Recommandation | Recomendación | Raccomandazione | Translated |
| Confidence | Konfidenz / Vertrauen (context-dependent) | Confiance | Confianza | Affidabilità / confidenza (context-dependent) | Translated — see note below |
| Scenario | Szenario | Scénario | Escenario | Scenario | Translated (IT keeps the Latin-identical spelling) |
| Sensitivity | Sensitivität | Sensibilité | Sensibilidad | Sensibilità | Translated |
| Robustness | Robustheit | Robustesse | Robustez | Robustezza | Translated |
| Vendor | Anbieter | Éditeur / fournisseur (context-dependent) | Proveedor | Fornitore | Translated — FR uses "éditeur" for a software vendor specifically (matches existing nav: "Pour les éditeurs") and "fournisseur" only for a generic supplier; keep that distinction, don't flatten to one word. |
| Provider | Anbieter (same as Vendor in most UI copy) / Provider (system/AI provider) | Fournisseur (AI/system) | Proveedor (AI/system) | Provider / fornitore (context-dependent) | Translated except when naming the AI *model* provider architecture, where "Provider" stays as the technical term (`IntelligenceProvider`, `ResearchProvider`) — that is internal/engineering terminology, not public copy, so it does not need a localized public form. |
| Platform | Plattform | Plateforme | Plataforma | Piattaforma | Translated |
| Business Case | Business Case | Business Case | Business Case (caso de negocio is also understood, but "Business Case" is the dominant B2B term in LatAm/Spain tech contexts too) | Business Case | Kept in English — standard, unambiguous B2B finance term in every target market. |
| TCO / ROI / NPV / Payback | TCO / ROI / NPV / Payback(-Zeit) | TCO / ROI / VAN (valeur actuelle nette) / délai de retour | TCO / ROI / VAN (valor actual neto) / período de recuperación | TCO / ROI / VAN (valore attuale netto) / periodo di recupero | **Mixed, deliberately.** TCO and ROI are universally recognized acronyms in every target market — kept in English/as acronyms everywhere. NPV is NOT universally recognized outside English finance teams; FR/ES/IT should spell out the local acronym (VAN) on first use per page, same as any other finance term, rather than forcing the English "NPV" on a non-English reader. Payback is translated as a plain phrase. |
| Risk | Risiko | Risque | Riesgo | Rischio | Translated |
| Architecture | Architektur | Architecture | Arquitectura | Architettura | Translated |
| Governance | Governance | Gouvernance | Gobernanza / Governance (context-dependent) | Governance | **Kept in English in DE and IT** (already the dominant enterprise-German and enterprise-Italian usage — e.g. "Governance-Hinweis"), translated in FR ("Gouvernance" is the standard, unremarkable French term) and in ES where "Gobernanza" is equally standard; "Governance" as a loanword also appears acceptably in ES tech contexts — do not treat an occasional loanword use as an error, but prefer "Gobernanza" in new copy. |
| Challenge / Decision Challenger | Challenge / Decision Challenger | Challenge / Decision Challenger | Challenge / Decision Challenger | Challenge / Decision Challenger | Kept in English — the feature's proper name, consistent with Decision Engine/Scenario Engine naming. The generic English word "challenge" (as in "challenge this recommendation") should still be translated in body copy (*herausfordern/infrage stellen*, *remettre en question*, *cuestionar*, *metti alla prova*) — only the capitalized feature name stays English. |

**Note on "Confidence":** German and Italian copy uses two different words for what is the same underlying concept in different contexts — a statistical/engine confidence score ("Konfidenz"/"confidenza," a number) versus the general feeling of trust the product is building ("Vertrauen"/"affidabilità," not a number). This is not an error; it is the correct distinction. Do not force one German or Italian word to cover both meanings.

## "By design" / "by construction"

A recurring, previously inconsistent phrase describing a structural guarantee (tenant isolation, etc.) rather than a policy promise. Found in three different renderings in German (two correct, one broken Denglish) and Italian (two different translations in the same file) before this release. Standardized:

| Locale | Canonical phrase |
|---|---|
| EN | by design |
| DE | per Konstruktion |
| FR | par construction |
| ES | por diseño |
| IT | per progettazione |

Do not introduce a fourth variant for any of these languages. "Policy" as the contrasting word (*"not just by policy"*) is also standardized: DE *Richtlinie*, FR *politique*, ES *política*, IT *norma* (not the English loanword "policy," which was found and fixed in three places in the Italian copy).

## Maintaining this file

When a new capability ships (the way Research Agent and Business Case Engine shipped without the public site's architecture claims being updated — see the release report's claim-accuracy findings), add its name here in the same pass that writes its first public-facing sentence, not after.
