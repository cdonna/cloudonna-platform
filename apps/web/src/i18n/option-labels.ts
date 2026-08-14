import type { Locale } from "./locales";

/**
 * Display-layer overrides for the Adaptive Intake option chips —
 * deliberately NOT a change to data.ts's OPTIONS arrays, which stay
 * the single source of truth for `value` (what scoring/extraction
 * actually key on) and their English `label` (used by non-UI callers
 * like report text). Only English-language *generic* labels are
 * overridden here (goals, country names, industry names, size/budget/
 * timeline bands, risk/skill levels) — vendor and product names
 * (SAP S/4HANA, Power BI, Snowflake, Azure, Copilot, Salesforce, ...)
 * are deliberately absent from this table because they are never
 * translated (see the localization report's "TRANSLATION TRUST"
 * section); the English label already shown for them is correct in
 * every locale.
 *
 * Keyed by `${field}.${value}`, not bare `value` — several OPTIONS
 * lists reuse the same value string for genuinely different things
 * (`medium` is both a riskAppetite level and an itOrgSize band whose
 * label carries its own FTE range), so a flat value-keyed table would
 * let one silently clobber the other.
 */
type OptionLabelTable = Record<string, Partial<Record<Locale, string>>>;

export const OPTION_LABEL_OVERRIDES: OptionLabelTable = {
  // Goals
  "goals.modernization": { de: "Modernisierung", fr: "Modernisation", es: "Modernización", it: "Modernizzazione" },
  "goals.business-ai": { de: "Business AI", fr: "IA métier", es: "IA de negocio", it: "IA aziendale" },
  "goals.planning": { de: "Planung", fr: "Planification", es: "Planificación", it: "Pianificazione" },
  "goals.governance": { de: "Governance", fr: "Gouvernance", es: "Gobernanza", it: "Governance" },
  "goals.data-products": { de: "Datenprodukte", fr: "Produits de données", es: "Productos de datos", it: "Prodotti dati" },
  "goals.cost-reduction": { de: "Kostensenkung", fr: "Réduction des coûts", es: "Reducción de costos", it: "Riduzione dei costi" },
  "goals.compliance": { de: "Compliance", fr: "Conformité", es: "Cumplimiento normativo", it: "Conformità normativa" },
  "goals.innovation": { de: "Innovation", fr: "Innovation", es: "Innovación", it: "Innovazione" },

  // Country
  "country.switzerland": { de: "Schweiz", fr: "Suisse", es: "Suiza", it: "Svizzera" },
  "country.germany": { de: "Deutschland", fr: "Allemagne", es: "Alemania", it: "Germania" },
  "country.austria": { de: "Österreich", fr: "Autriche", es: "Austria", it: "Austria" },
  "country.uk": { de: "Vereinigtes Königreich", fr: "Royaume-Uni", es: "Reino Unido", it: "Regno Unito" },
  "country.france": { de: "Frankreich", fr: "France", es: "Francia", it: "Francia" },
  "country.united-states": { de: "Vereinigte Staaten", fr: "États-Unis", es: "Estados Unidos", it: "Stati Uniti" },
  "country.rest-of-europe": { de: "Übriges Europa", fr: "Reste de l'Europe", es: "Resto de Europa", it: "Resto d'Europa" },
  "country.rest-of-world": { de: "Übrige Welt", fr: "Reste du monde", es: "Resto del mundo", it: "Resto del mondo" },

  // Industry
  "industry.manufacturing": { de: "Fertigung", fr: "Industrie manufacturière", es: "Manufactura", it: "Manifattura" },
  "industry.financial-services": { de: "Finanzdienstleistungen", fr: "Services financiers", es: "Servicios financieros", it: "Servizi finanziari" },
  "industry.retail": { de: "Handel", fr: "Commerce de détail", es: "Comercio minorista", it: "Vendita al dettaglio" },
  "industry.healthcare": { de: "Gesundheitswesen", fr: "Santé", es: "Salud", it: "Sanità" },
  "industry.public-sector": { de: "Öffentlicher Sektor", fr: "Secteur public", es: "Sector público", it: "Settore pubblico" },
  "industry.technology": { de: "Technologie", fr: "Technologie", es: "Tecnología", it: "Tecnologia" },

  // Employees
  "employees.smb": { de: "Unter 500", fr: "Moins de 500", es: "Menos de 500", it: "Meno di 500" },
  "employees.mid-market": { de: "500–2.000", fr: "500–2 000", es: "500–2000", it: "500–2.000" },
  "employees.enterprise": { de: "2.000–10.000", fr: "2 000–10 000", es: "2000–10 000", it: "2.000–10.000" },
  "employees.global-enterprise": { de: "10.000+", fr: "10 000+", es: "10 000+", it: "10.000+" },

  // Budget
  "budget.tight": { de: "Knapp", fr: "Serré", es: "Ajustado", it: "Limitato" },
  "budget.moderate": { de: "Moderat", fr: "Modéré", es: "Moderado", it: "Moderato" },
  "budget.flexible": { de: "Flexibel", fr: "Flexible", es: "Flexible", it: "Flessibile" },

  // Timeline
  "timeline.aggressive": { de: "Ambitioniert (<6 Monate)", fr: "Ambitieux (<6 mois)", es: "Agresivo (<6 meses)", it: "Aggressiva (<6 mesi)" },
  "timeline.standard": { de: "Standard (6–12 Monate)", fr: "Standard (6–12 mois)", es: "Estándar (6–12 meses)", it: "Standard (6–12 mesi)" },
  "timeline.extended": { de: "Langfristig (12+ Monate)", fr: "Étendu (12+ mois)", es: "Extendido (12+ meses)", it: "Estesa (12+ mesi)" },

  // Risk appetite
  "riskAppetite.low": { de: "Niedrig", fr: "Faible", es: "Bajo", it: "Basso" },
  "riskAppetite.medium": { de: "Mittel", fr: "Moyen", es: "Medio", it: "Medio" },
  "riskAppetite.high": { de: "Hoch", fr: "Élevé", es: "Alto", it: "Alto" },

  // Internal skills
  "internalSkills.strong": { de: "Stark", fr: "Solide", es: "Sólido", it: "Solido" },
  "internalSkills.moderate": { de: "Moderat", fr: "Modéré", es: "Moderado", it: "Moderato" },
  "internalSkills.limited": { de: "Begrenzt", fr: "Limité", es: "Limitado", it: "Limitato" },

  // Preferred cloud / vendor "no preference" (vendor/cloud names themselves stay untranslated)
  "preferredCloud.no-preference": { de: "Keine Präferenz", fr: "Aucune préférence", es: "Sin preferencia", it: "Nessuna preferenza" },
  "preferredVendor.no-preference": { de: "Keine Präferenz", fr: "Aucune préférence", es: "Sin preferencia", it: "Nessuna preferenza" },

  // Revenue bands
  "revenue.under-100m": { de: "Unter CHF 100 Mio.", fr: "Moins de 100 M CHF", es: "Menos de CHF 100 M", it: "Meno di CHF 100 mln" },
  "revenue.100m-500m": { de: "CHF 100–500 Mio.", fr: "100–500 M CHF", es: "CHF 100–500 M", it: "CHF 100–500 mln" },
  "revenue.500m-2b": { de: "CHF 500 Mio.–2 Mrd.", fr: "500 M–2 Md CHF", es: "CHF 500 M–2 mM", it: "CHF 500 mln–2 mld" },
  "revenue.over-2b": { de: "CHF 2 Mrd.+", fr: "2 Md CHF+", es: "CHF 2 mM+", it: "CHF 2 mld+" },

  // IT org size bands
  "itOrgSize.small": { de: "Klein (<20 VZÄ)", fr: "Petite (<20 ETP)", es: "Pequeña (<20 ETC)", it: "Piccola (<20 FTE)" },
  "itOrgSize.medium": { de: "Mittel (20–100 VZÄ)", fr: "Moyenne (20–100 ETP)", es: "Mediana (20–100 ETC)", it: "Media (20–100 FTE)" },
  "itOrgSize.large": { de: "Groß (100–500 VZÄ)", fr: "Grande (100–500 ETP)", es: "Grande (100–500 ETC)", it: "Grande (100–500 FTE)" },
  "itOrgSize.very-large": { de: "Sehr groß (500+ VZÄ)", fr: "Très grande (500+ ETP)", es: "Muy grande (500+ ETC)", it: "Molto grande (500+ FTE)" },

  // "Other / None" — repeated verbatim across every landscape field
  // (erp/crm/analytics/dataWarehouse) that carries it; the words mean
  // exactly the same thing regardless of which system category asked.
  "erp.other-none": { de: "Andere / Keine", fr: "Autre / Aucun", es: "Otro / Ninguno", it: "Altro / Nessuno" },
  "crm.other-none": { de: "Andere / Keine", fr: "Autre / Aucun", es: "Otro / Ninguno", it: "Altro / Nessuno" },
  "analytics.other-none": { de: "Andere / Keine", fr: "Autre / Aucun", es: "Otro / Ninguno", it: "Altro / Nessuno" },
  "dataWarehouse.other-none": { de: "Andere / Keine", fr: "Autre / Aucun", es: "Otro / Ninguno", it: "Altro / Nessuno" },
  "aiPlatform.other": { de: "Andere", fr: "Autre", es: "Otro", it: "Altro" },
  "aiPlatform.none-yet": { de: "Noch keine", fr: "Aucune pour l'instant", es: "Ninguna todavía", it: "Ancora nessuna" },
};

/** Falls back to the English label already carried by the option
 * itself whenever no override exists for this field+value+locale —
 * always the case for product/vendor names (SAP S/4HANA, Power BI,
 * Azure, ...), which are correct, untranslated, in every locale.
 * Never fabricates a translation. */
export function localizedOptionLabel(field: string, value: string, englishLabel: string, locale: Locale): string {
  if (locale === "en") return englishLabel;
  return OPTION_LABEL_OVERRIDES[`${field}.${value}`]?.[locale] ?? englishLabel;
}
