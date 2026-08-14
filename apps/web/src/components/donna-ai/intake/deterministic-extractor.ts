import {
  AI_PLATFORM_OPTIONS,
  ANALYTICS_OPTIONS,
  CLOUD_OPTIONS,
  CRM_OPTIONS,
  DATA_WAREHOUSE_OPTIONS,
  ERP_OPTIONS,
} from "../data";
import type {
  AiPlatform,
  AnalyticsTool,
  BudgetLevel,
  CloudProvider,
  Country,
  CrmSystem,
  DataWarehouseSystem,
  EmployeeBand,
  ErpSystem,
  GoalTag,
  Industry,
  InternalSkills,
  PreferredCloud,
  PreferredVendor,
  RiskAppetite,
  TimelineLevel,
} from "../types";
import type {
  AdditionalSystem,
  ExtractedField,
  ExtractionCandidates,
  ExtractionResult,
  ExtractionSource,
  LandscapeCategory,
} from "./extraction-types";

function optionLabels(options: Array<{ value: string; label: string }>): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}

const ERP_LABELS = optionLabels(ERP_OPTIONS);
const CRM_LABELS = optionLabels(CRM_OPTIONS);
const ANALYTICS_LABELS = optionLabels(ANALYTICS_OPTIONS);
const DATA_WAREHOUSE_LABELS = optionLabels(DATA_WAREHOUSE_OPTIONS);
const CLOUD_LABELS = optionLabels(CLOUD_OPTIONS);
const AI_PLATFORM_LABELS = optionLabels(AI_PLATFORM_OPTIONS);

/**
 * The real, always-available extraction path — pure, synchronous,
 * zero network calls. This is not a fallback bolted on in front of an
 * AI path; it is the shipped implementation (see the Founder report's
 * "AI FALLBACK" section for why: closed-vocabulary fields like ERP,
 * cloud, and country are exactly matchable against the same option
 * lists the manual wizard already used, so an LLM call would add
 * latency and non-determinism without adding accuracy for the fields
 * that matter most to scoring). Every alias list below is intentionally
 * conservative — a missed match leaves a field unknown for the adaptive
 * question engine to ask about directly, which is always safer than a
 * wrong guess presented as fact.
 */

const HIGH_CONFIDENCE = 0.95;
const MEDIUM_CONFIDENCE = 0.72;
const LOW_CONFIDENCE = 0.55;

/** Below this, a match is still worth surfacing but must be shown as
 * "Donna inferred" and confirmed, never presented as read fact. */
export const CONFIRMATION_THRESHOLD = 0.85;

/**
 * Source is derived from confidence, not passed in per rule — a
 * near-literal match ("SAP S/4HANA" appearing verbatim) is genuinely
 * what the user said; a paraphrase or heuristic derivation ("a
 * stronger enterprise data platform" -> modernization) is genuinely
 * Donna's inference, never the user's own words. Tying the two
 * together means there is exactly one place this distinction can drift
 * out of sync with the confidence it's based on.
 */
function makeField<T>(value: T, confidence: number): ExtractedField<T> {
  const source: ExtractionSource = confidence >= HIGH_CONFIDENCE ? "user_statement" : "inferred";
  return { value, confidence, source, requiresConfirmation: confidence < CONFIRMATION_THRESHOLD };
}

interface AliasRule<T> {
  value: T;
  patterns: RegExp[];
  confidence: number;
}

/** First matching rule wins, in array order — more specific patterns
 * (e.g. "s/4hana") are listed before ones they could be confused with
 * (bare "sap"), so a specific mention is never shadowed by a vaguer one. */
function matchFirst<T>(text: string, rules: AliasRule<T>[]): ExtractedField<T> | undefined {
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return makeField(rule.value, rule.confidence);
    }
  }
  return undefined;
}

/** Every rule that matches, not just the first — used for the
 * landscape-system categories (erp/crm/analytics/dataWarehouse/cloud/
 * aiPlatform), where a real statement can legitimately name more than
 * one system ("SAP BW, Power BI and Snowflake"). The caller keeps the
 * first match as the single scored candidate (unchanged behavior) and
 * treats the rest as additional, unscored context — see
 * extractLandscapeSystems below. */
function matchAll<T>(text: string, rules: AliasRule<T>[]): ExtractedField<T>[] {
  const matches: ExtractedField<T>[] = [];
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      matches.push(makeField(rule.value, rule.confidence));
    }
  }
  return matches;
}

/**
 * Non-English word/phrase boundaries below deliberately do NOT use
 * `\b` — JS's `\b` is defined purely in terms of ASCII `\w`
 * ([A-Za-z0-9_]), so it silently fails to match at a boundary directly
 * before/after an accented character (e.g. `\bconformité\b` never
 * matches, because `é` isn't a "word" character to `\b`, so the
 * transition from `é` to a following space isn't seen as a boundary
 * at all). `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` with the `u` flag is
 * the Unicode-correct equivalent and is used consistently for every
 * German/French/Spanish addition in this file, including ones that
 * happen not to need it, so this isn't something to re-derive per word.
 */
const COUNTRY_RULES: AliasRule<Country>[] = [
  {
    value: "switzerland",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bswitzerland\b/,
      /\bswiss\b/,
      /(?<![\p{L}\p{N}])schweiz(er(in)?)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])suisse(s)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])suiz[oa]s?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])svizzer[oa]?(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "germany",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bgermany\b/,
      /\bgerman\b/,
      /(?<![\p{L}\p{N}])deutschland(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])deutsch(e[nrs]?)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])allemagne(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])alemani[ae](?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])alemán(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])germania(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])tedesc[oa](?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "austria",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\baustria(n)?\b/,
      /(?<![\p{L}\p{N}])österreich(isch(e[nrs]?)?)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])autriche(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])austriac[oa](?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "uk",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bunited kingdom\b/,
      /\bu\.?k\.?\b/,
      /\bbritish\b/,
      /\bbritain\b/,
      /(?<![\p{L}\p{N}])vereinigtes königreich(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])royaume-uni(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])reino unido(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])regno unito(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "france",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bfrance\b/,
      /\bfrench\b/,
      /(?<![\p{L}\p{N}])frankreich(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])français(e)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])francia(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])frances[ei]?(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "united-states",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bunited states\b/,
      /\bu\.?s\.?a?\.?\b/,
      /\bamerican\b/,
      /(?<![\p{L}\p{N}])vereinigte staaten(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])états-unis(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])estados unidos(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])stati uniti(?![\p{L}\p{N}])/u,
    ],
  },
];

const INDUSTRY_RULES: AliasRule<Industry>[] = [
  {
    value: "manufacturing",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bmanufactur\w*/,
      /(?<![\p{L}\p{N}])industrieunternehmen(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])fertigung(sunternehmen)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])hersteller(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])industriel(le)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])fabrication(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])fabricant(e|s)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])manufactur[ae](?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])fabricante(s)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])manifattur\w*(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])produttore(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])industriale(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])azienda industriale(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "financial-services",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bbank(ing)?\b/,
      /\bfinancial services\b/,
      /\binsuranc\w*/,
      /\bfintech\b/,
      /(?<![\p{L}\p{N}])finanzdienstleist\w*(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])versicherung\w*(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])services financiers(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])assurance(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])servicios financieros(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])seguro(s)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])servizi finanziari(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])assicurazion\w*(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])banca(ri[oa])?(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "retail",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bretail(er)?\b/,
      /\be-?commerce\b/,
      /(?<![\p{L}\p{N}])einzelhandel(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])commerce de détail(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])comercio minorista(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])venta al por menor(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])vendita al dettaglio(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])commercio al dettaglio(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "healthcare",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bhealthcare\b/,
      /\bhospital\w*/,
      /\bpharma\w*/,
      /(?<![\p{L}\p{N}])gesundheitswesen(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])krankenhaus(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])santé(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])hôpital(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])salud(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])hospital(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])sanità(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])ospedal\w*(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "public-sector",
    confidence: HIGH_CONFIDENCE,
    patterns: [
      /\bpublic sector\b/,
      /\bgovernment\b/,
      /\bmunicipal\w*/,
      /(?<![\p{L}\p{N}])öffentlich(er|en|e) sektor(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])behörde(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])secteur public(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])sector público(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])settore pubblico(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])pubblica amministrazione(?![\p{L}\p{N}])/u,
    ],
  },
  {
    value: "technology",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\bsoftware company\b/,
      /\btech(nology)? company\b/,
      /\bsaas\b/,
      /(?<![\p{L}\p{N}])softwareunternehmen(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])technologieunternehmen(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])entreprise technologique(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])empresa de tecnología(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])azienda tecnologica(?![\p{L}\p{N}])/u,
    ],
  },
];

const ERP_RULES: AliasRule<ErpSystem>[] = [
  { value: "sap-s4hana", confidence: HIGH_CONFIDENCE, patterns: [/\bs\/?4\s?hana\b/] },
  { value: "sap-ecc", confidence: HIGH_CONFIDENCE, patterns: [/\bsap ecc\b/, /\becc6?\b/] },
  { value: "dynamics", confidence: HIGH_CONFIDENCE, patterns: [/\bdynamics 365\b/, /\bmicrosoft dynamics\b/] },
  { value: "oracle", confidence: MEDIUM_CONFIDENCE, patterns: [/\boracle (erp|ebs|fusion)\b/] },
];

const CRM_RULES: AliasRule<CrmSystem>[] = [
  { value: "salesforce", confidence: HIGH_CONFIDENCE, patterns: [/\bsalesforce\b/] },
  { value: "dynamics-crm", confidence: HIGH_CONFIDENCE, patterns: [/\bdynamics crm\b/, /\bdynamics 365 sales\b/] },
  { value: "sap-crm", confidence: HIGH_CONFIDENCE, patterns: [/\bsap crm\b/, /\bsap c4c\b/, /\bsap customer experience\b/] },
];

const ANALYTICS_RULES: AliasRule<AnalyticsTool>[] = [
  { value: "power-bi", confidence: HIGH_CONFIDENCE, patterns: [/\bpower ?bi\b/] },
  { value: "sac", confidence: HIGH_CONFIDENCE, patterns: [/\bsap analytics cloud\b/, /\bsac\b/] },
  { value: "tableau", confidence: HIGH_CONFIDENCE, patterns: [/\btableau\b/] },
  { value: "looker", confidence: HIGH_CONFIDENCE, patterns: [/\blooker\b/] },
];

const DATA_WAREHOUSE_RULES: AliasRule<DataWarehouseSystem>[] = [
  { value: "sap-bw", confidence: HIGH_CONFIDENCE, patterns: [/\bsap bw\b/, /\bbw\/?4hana\b/] },
  { value: "snowflake", confidence: HIGH_CONFIDENCE, patterns: [/\bsnowflake\b/] },
  { value: "databricks", confidence: HIGH_CONFIDENCE, patterns: [/\bdatabricks\b/] },
  { value: "bigquery", confidence: HIGH_CONFIDENCE, patterns: [/\bbig ?query\b/] },
];

const CLOUD_RULES: AliasRule<CloudProvider>[] = [
  { value: "multi-cloud", confidence: HIGH_CONFIDENCE, patterns: [/\bmulti-?cloud\b/] },
  {
    value: "on-premise",
    confidence: HIGH_CONFIDENCE,
    patterns: [/\bon-?prem(ise)?\b/, /\bvor ort\b/, /\blokal betrieben\b/, /\bsur site\b/, /(?<![\p{L}\p{N}])en (las )?instalaciones(?![\p{L}\p{N}])/u, /\bin sede\b/, /\bon-?premise\b/],
  },
  { value: "azure", confidence: HIGH_CONFIDENCE, patterns: [/\bazure\b/] },
  { value: "aws", confidence: HIGH_CONFIDENCE, patterns: [/\baws\b/, /\bamazon web services\b/] },
  { value: "gcp", confidence: HIGH_CONFIDENCE, patterns: [/\bgcp\b/, /\bgoogle cloud\b/] },
];

const AI_PLATFORM_RULES: AliasRule<AiPlatform>[] = [
  { value: "copilot", confidence: HIGH_CONFIDENCE, patterns: [/\bcopilot\b/] },
  { value: "azure-ai", confidence: HIGH_CONFIDENCE, patterns: [/\bazure (ai|openai)\b/] },
  { value: "vertex-ai", confidence: HIGH_CONFIDENCE, patterns: [/\bvertex ai\b/] },
];

const BUDGET_RULES: AliasRule<BudgetLevel>[] = [
  {
    value: "tight",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\btight budget\b/,
      /\blimited budget\b/,
      /\bcost-?conscious\b/,
      /\bcost constrain\w*/,
      /\bknapp(es|em)? budget\b/,
      /\bbegrenzt(es|em)? budget\b/,
      /\bbudget serré\b/,
      /\bbudget limité\b/,
      /\bpresupuesto ajustado\b/,
      /\bpresupuesto limitado\b/,
      /\bbudget limitato\b/,
      /\bbudget ristretto\b/,
    ],
  },
  {
    value: "flexible",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [/\bflexible budget\b/, /\bwell-?funded\b/, /\bno budget constraint\b/, /\bflexibl(es|em)? budget\b/, /\bbudget flexible\b/, /\bpresupuesto flexible\b/, /\bbudget flessibile\b/],
  },
  {
    value: "moderate",
    confidence: LOW_CONFIDENCE,
    patterns: [/\bmoderate budget\b/, /\breasonable budget\b/, /\bmoderat(es|em)? budget\b/, /\bbudget modéré\b/, /\bpresupuesto moderado\b/, /\bbudget moderato\b/],
  },
];

const RISK_APPETITE_RULES: AliasRule<RiskAppetite>[] = [
  {
    value: "low",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\brisk-?avers\w*/,
      /\bconservative\b/,
      /\blow risk\b/,
      /\brisikoavers\w*/,
      /\bkonservativ\w*/,
      /\bavers[ée]? au risque\b/,
      /\baverso al riesgo\b/,
      /\bconservador(a)?\b/,
      /\bavvers[oi] al rischio\b/,
      /\bconservativ[oa]\b/,
    ],
  },
  {
    value: "high",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\brisk-?toleran\w*/,
      /\bmove fast\b/,
      /\bhigh risk appetite\b/,
      /\brisikofreudig\w*/,
      /\brisikotoleran\w*/,
      /\btolérant[e]? au risque\b/,
      /\btolerante al riesgo\b/,
      /\btollerante al rischio\b/,
      /\bpropenso al rischio\b/,
    ],
  },
];

const INTERNAL_SKILLS_RULES: AliasRule<InternalSkills>[] = [
  {
    value: "limited",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\bsmall it team\b/,
      /\blimited it (team|staff|capacity)\b/,
      /\bno dedicated it\b/,
      /\bkleines it-?team\b/,
      /\bbegrenzte it-?kapazität\b/,
      /\bpetite équipe it\b/,
      /\bequipo de ti pequeño\b/,
      /\bpiccolo team it\b/,
      /\bcapacità it limitata\b/,
    ],
  },
  {
    value: "strong",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\blarge it (team|department)\b/,
      /\bstrong internal team\b/,
      /\bin-?house expertise\b/,
      /\bgroßes it-?team\b/,
      /\bstarkes internes team\b/,
      /\bgrande équipe it\b/,
      /\bequipo de ti grande\b/,
      /\bgrande team it\b/,
      /\bteam interno solido\b/,
    ],
  },
  // "experienced with SAP and Microsoft, but has limited Databricks
  // expertise" — real, mixed signal: strong on incumbent vendors, weak
  // on one specific candidate. Neither "strong" nor "limited" alone is
  // honest here; "moderate" is the fair middle ground, and the raw
  // sentence itself is never lost (see company.note in apply-candidates.ts).
  // The German pattern below is verified against the exact Founder
  // Language Test statement (see founder-case.test.ts's German
  // counterpart): "...kennt SAP und Microsoft sehr gut, hat aber nur
  // wenig Databricks-Erfahrung." French/Spanish/Italian equivalents are
  // best-effort — only the German phrasing was verbatim-tested per the
  // brief.
  {
    value: "moderate",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\bexperienced with .+ but (has |have )?limited .+ expertise\b/,
      /\bkennt .+ (sehr )?gut,? (hat|haben) aber (nur )?wenig .+erfahrung\b/,
      /\bconnaît (bien |très bien )?.+ mais (a|ont) (qu'|seulement )?(une |un )?(expérience limitée|peu d'expérience)/,
      /\bconoce (bien |muy bien )?.+ pero (tiene|tienen) (una )?experiencia limitada\b/,
      /\bconosce (bene |molto bene )?.+ ma ha (solo )?(una )?(esperienza limitata|poca esperienza)/,
    ],
  },
];

const PREFERRED_VENDOR_RULES: AliasRule<PreferredVendor>[] = [
  {
    value: "sap",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\bkeep sap\b/,
      /\bstay(ing)? with sap\b/,
      /\bsap as our erp\b/,
      /\bsap-first\b/,
      /\bsap soll .*erp bleiben\b/,
      /\bsap (bleibt|soll bleiben)\b/,
      /\bsap doit rester\b/,
      /\bsap debe seguir siendo\b/,
      /\bsap deve rimanere\b/,
      /\bsap rimane\b/,
    ],
  },
  { value: "microsoft", confidence: MEDIUM_CONFIDENCE, patterns: [/\bmicrosoft-?first\b/, /\bmicrosoft shop\b/] },
];

const PREFERRED_CLOUD_RULES: AliasRule<PreferredCloud>[] = [
  { value: "azure", confidence: MEDIUM_CONFIDENCE, patterns: [/\bprefer azure\b/, /\bazure-first strategy\b/] },
  { value: "aws", confidence: MEDIUM_CONFIDENCE, patterns: [/\bprefer aws\b/, /\baws-first strategy\b/] },
  { value: "gcp", confidence: MEDIUM_CONFIDENCE, patterns: [/\bprefer (gcp|google cloud)\b/] },
];

interface GoalRule {
  value: GoalTag;
  patterns: RegExp[];
  confidence: number;
}

const GOAL_RULES: GoalRule[] = [
  {
    value: "modernization",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [/\bmoderniz\w*/, /\bupgrad\w* our\b/, /\bstronger .*(platform|foundation)\b/, /\bmodernisier\w*/, /\bmoderniser\w*/, /\bmodernizar\w*/, /\bmodernizzar\w*/],
  },
  {
    value: "business-ai",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [/\bbusiness ai\b/, /\bai-driven\b/, /\bai driven\b/, /\bki-getrieben\b/, /\bia (d'entreprise|métier)\b/, /\bia de negocio\b/, /\bia aziendale\b/],
  },
  { value: "planning", confidence: MEDIUM_CONFIDENCE, patterns: [/\bplanning\b/, /\bforecast\w*/, /\bplanung\b/, /\bplanification\b/, /\bplanificación\b/, /\bpianificazione\b/] },
  {
    value: "governance",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [/\bgovernance\b/, /\bgovern(ed)? data\b/, /(?<![\p{L}\p{N}])gouvernance(?![\p{L}\p{N}])/u, /(?<![\p{L}\p{N}])gobernanza(?![\p{L}\p{N}])/u],
  },
  { value: "data-products", confidence: MEDIUM_CONFIDENCE, patterns: [/\bdata product\w*/, /\bdatenprodukt\w*/, /\bproduits? de données\b/, /\bproductos? de datos\b/, /\bprodott[oi] dati\b/] },
  {
    value: "cost-reduction",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\bcost reduction\b/,
      /\breduce cost\w*/,
      /\bsave cost\w*/,
      /\bcut cost\w*/,
      /\bkostensenkung\b/,
      /\bkosten (reduzieren|senken)\b/,
      /\bréduction des coûts\b/,
      /\bréduire les coûts\b/,
      /\breducción de costos\b/,
      /\breducir costos\b/,
      /\briduzione dei costi\b/,
      /\bridurre i costi\b/,
    ],
  },
  {
    value: "compliance",
    confidence: MEDIUM_CONFIDENCE,
    patterns: [
      /\bcompliance\b/,
      /\bregulatory\b/,
      /\bgdpr\b/,
      /\bfinma\b/,
      /(?<![\p{L}\p{N}])konformität(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])conformité(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])cumplimiento( normativo)?(?![\p{L}\p{N}])/u,
      /(?<![\p{L}\p{N}])conformità( normativa)?(?![\p{L}\p{N}])/u,
    ],
  },
  { value: "innovation", confidence: MEDIUM_CONFIDENCE, patterns: [/\binnovat\w*/, /\binnovation\b/, /\binnovación\b/, /\binnovazione\b/] },
];

const TIMELINE_URGENT_PATTERNS = [
  /\basap\b/,
  /\burgent(ly)?\b/,
  /\bimmediately\b/,
  /\bdringend\b/,
  /\burgent(e|emment)?\b/,
  /\burgente(mente)?\b/,
  /\bsofort\b/,
  /\binmediatamente\b/,
  /\bimmediatamente\b/,
];
const TIMELINE_EXTENDED_PATTERNS = [
  /\blong-?term\b/,
  /\bmulti-?year\b/,
  /\bover the next (few|several) years\b/,
  /\blangfristig\b/,
  /\bmehrjährig\b/,
  /\bà long terme\b/,
  /\bpluriannuel(le)?\b/,
  /\ba largo plazo\b/,
  /\bplurianual\b/,
  /\ba lungo termine\b/,
  /\bpluriennale\b/,
];
const TIMELINE_YEAR_PATTERN = /\b(?:before|by|bis|vor|avant|d'ici|antes de|para|entro|prima del)\s+(20\d{2})\b/;
// "within the next 18 months" / "within 6 months" — at least as common
// in real enterprise phrasing as an explicit target year, and the
// brief's own defect example uses exactly this form. German pattern
// verified against the exact Founder Language Test statement's
// "innerhalb der nächsten 18 Monate."
const TIMELINE_MONTHS_PATTERNS = [
  /\bwithin(?: the next)? (\d+)\s*months?\b/,
  /\binnerhalb(?: der nächsten| von)? (\d+)\s*monate[n]?\b/,
  /\bdans les (\d+) prochains mois\b/,
  /\bd'ici (\d+) mois\b/,
  /\ben los próximos (\d+) meses\b/,
  /\bdentro de (\d+) meses\b/,
  /\bentro i prossimi (\d+) mesi\b/,
  /\bnei prossimi (\d+) mesi\b/,
];
/** Reference point for "before/by <year>" reasoning — a fixed constant
 * rather than `new Date()`, so extraction stays pure and deterministic
 * (same statement always yields the same timeline band, in tests and
 * in production alike, regardless of when either runs). Update
 * annually; a stale reference only ever shifts confidence at the
 * aggressive/standard boundary by a few months, never the field it
 * fills or whether it's flagged for confirmation. */
const TIMELINE_REFERENCE_YEAR = 2026;

/** Deliberately not shared with the month-phrasing path below — "before
 * 2027" and "within 18 months" carry different real precision (a bare
 * year is coarser than an explicit month count), so a year 1 out is
 * treated as "aggressive" while an explicit 18-month statement is
 * "extended." Unifying the two onto one month-count scale would have
 * silently reclassified "before 2027" (12 months out) from aggressive
 * to standard — a real behavior change this function must not make. */
function bandFromYearsOut(yearsOut: number): TimelineLevel {
  if (yearsOut <= 1) return "aggressive";
  if (yearsOut <= 2) return "standard";
  return "extended";
}

function bandFromMonthsOut(monthsOut: number): TimelineLevel {
  if (monthsOut <= 6) return "aggressive";
  if (monthsOut <= 12) return "standard";
  return "extended";
}

function extractTimeline(text: string): ExtractedField<TimelineLevel> | undefined {
  if (TIMELINE_URGENT_PATTERNS.some((pattern) => pattern.test(text))) {
    return makeField<TimelineLevel>("aggressive", MEDIUM_CONFIDENCE);
  }
  if (TIMELINE_EXTENDED_PATTERNS.some((pattern) => pattern.test(text))) {
    return makeField<TimelineLevel>("extended", MEDIUM_CONFIDENCE);
  }
  for (const pattern of TIMELINE_MONTHS_PATTERNS) {
    const monthsMatch = text.match(pattern);
    if (monthsMatch) {
      return makeField<TimelineLevel>(bandFromMonthsOut(Number(monthsMatch[1])), MEDIUM_CONFIDENCE);
    }
  }
  const yearMatch = text.match(TIMELINE_YEAR_PATTERN);
  if (yearMatch) {
    const targetYear = Number(yearMatch[1]);
    return makeField<TimelineLevel>(bandFromYearsOut(targetYear - TIMELINE_REFERENCE_YEAR), MEDIUM_CONFIDENCE);
  }
  return undefined;
}

/** "around 4,000 employees" / "3,000 users" / "rund 4.000 Mitarbeitenden"
 * — an approximation (users isn't literally headcount), so capped at
 * LOW_CONFIDENCE and always flagged for confirmation, never presented
 * as read fact. The optional qualifier group is captured too, so the
 * exact phrase the user typed ("around 4,000" / "rund 4.000") survives
 * alongside the normalized band Donna scores with — see rawText on
 * ExtractedField and apply-candidates.ts. The digit group accepts both
 * `,` and `.` as a thousands separator (English "4,000" vs. German
 * "4.000") — see the matching `.replace(/[.,]/g, "")` below; this
 * codebase has no fractional-employee-count case for `.` to ambiguously
 * mean "decimal point" instead. */
const EMPLOYEE_COUNT_PATTERN =
  /\b(?:(around|approximately|about|roughly|~|rund|etwa|ca\.?|ungefähr|environ|alrededor de|aproximadamente|circa)\s*)?([\d.,]{2,7})\s*(?:employees|staff|users|people|mitarbeitende[nr]?|mitarbeiter[n]?|beschäftigte[nr]?|employés|salariés|collaborateurs|empleados|trabajadores|dipendenti|collaboratori)\b/;

function extractEmployees(text: string, originalCaseStatement: string): ExtractedField<EmployeeBand> | undefined {
  const match = text.match(EMPLOYEE_COUNT_PATTERN);
  if (!match || match.index === undefined) return undefined;
  const count = Number(match[2].replace(/[.,]/g, ""));
  if (!Number.isFinite(count) || count <= 0) return undefined;

  let value: EmployeeBand;
  if (count < 500) value = "smb";
  else if (count < 2000) value = "mid-market";
  else if (count < 10000) value = "enterprise";
  else value = "global-enterprise";

  // Re-slice from the original-case statement (not the lowercased
  // working copy) so the raw text shown back to the user matches their
  // own capitalization, not a lowercased echo.
  const rawText = originalCaseStatement.slice(match.index, match.index + match[0].length).trim();

  return { ...makeField(value, LOW_CONFIDENCE), rawText };
}

function extractGoals(text: string): Array<ExtractedField<GoalTag>> {
  const matched: Array<ExtractedField<GoalTag>> = [];
  for (const rule of GOAL_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      matched.push(makeField(rule.value, rule.confidence));
    }
  }
  return matched;
}

/**
 * The one entry point. Takes the user's free-text statement, returns
 * every field it could confidently or tentatively derive — nothing
 * fabricated for fields with no textual support (see the module
 * comment and the Founder report's "TRUST / CONFIDENCE MODEL" section).
 */
export function extractFromStatement(statement: string): ExtractionResult {
  const text = statement.toLowerCase();

  const candidates: ExtractionCandidates = {};
  const set = <K extends keyof ExtractionCandidates>(key: K, field: ExtractionCandidates[K] | undefined) => {
    if (field) candidates[key] = field;
  };

  const additionalSystems: AdditionalSystem[] = [];
  // The first match stays the single scored `candidates[category]`
  // value, exactly as matchFirst would have picked — every match after
  // it is real landscape context that a single-value slot has no room
  // for, captured instead of discarded. See LandscapeCategory's comment
  // in extraction-types.ts. TypeScript can't verify that `rules` and
  // `category` describe the same underlying union across this generic
  // dispatch — the same accepted tradeoff AdaptiveIntake.tsx's own
  // buildFieldAction already makes for the equivalent problem there.
  function setLandscapeSystem(category: LandscapeCategory, rules: AliasRule<string>[], labels: Partial<Record<string, string>>) {
    const matches = matchAll(text, rules);
    if (matches.length === 0) return;
    set(category, matches[0] as unknown as ExtractionCandidates[typeof category]);
    for (const extra of matches.slice(1)) {
      additionalSystems.push({ category, value: extra.value, label: labels[extra.value] ?? extra.value });
    }
  }

  set("country", matchFirst(text, COUNTRY_RULES));
  set("industry", matchFirst(text, INDUSTRY_RULES));
  setLandscapeSystem("erp", ERP_RULES, ERP_LABELS);
  setLandscapeSystem("crm", CRM_RULES, CRM_LABELS);
  setLandscapeSystem("analytics", ANALYTICS_RULES, ANALYTICS_LABELS);
  setLandscapeSystem("dataWarehouse", DATA_WAREHOUSE_RULES, DATA_WAREHOUSE_LABELS);
  setLandscapeSystem("cloud", CLOUD_RULES, CLOUD_LABELS);
  setLandscapeSystem("aiPlatform", AI_PLATFORM_RULES, AI_PLATFORM_LABELS);
  set("budget", matchFirst(text, BUDGET_RULES));
  set("riskAppetite", matchFirst(text, RISK_APPETITE_RULES));
  set("internalSkills", matchFirst(text, INTERNAL_SKILLS_RULES));
  set("preferredVendor", matchFirst(text, PREFERRED_VENDOR_RULES));
  set("preferredCloud", matchFirst(text, PREFERRED_CLOUD_RULES));
  set("employees", extractEmployees(text, statement));
  set("timeline", extractTimeline(text));

  return { statement, candidates, goals: extractGoals(text), additionalSystems };
}
