/**
 * The canonical dictionary shape. de.ts/fr.ts/es.ts are each typed as
 * `Dictionary` (see ../dictionary.ts) so TypeScript refuses to compile
 * if a locale is missing a key added here — that's the dictionary-
 * parity guarantee, enforced at compile time rather than by a
 * hand-maintained checklist.
 *
 * Deliberately NOT covered here (see the localization report's "KNOWN
 * TRANSLATION LIMITATIONS" section): the scoring engine's own narrative
 * content (TRAIT_REASON_TEXT, GOAL_OPPORTUNITY_TEXT, risk/assumption
 * text in data.ts) and DonnaLive.tsx's homepage demo — both are
 * separate, large bodies of dynamically-assembled English prose that
 * this pass did not translate; the UI around them (labels, buttons,
 * section headers) is fully localized.
 */
// Not `as const` — the point of this object is to define a *shape*
// every locale's dictionary must satisfy (see ../dictionary.ts's
// `Dictionary = typeof en`), not to lock every locale's string
// content to English's own literal values.
const en = {
  meta: { htmlLang: "en" },

  nav: {
    links: {
      discovery: "Discovery",
      donnaAi: "Donna AI",
      independence: "Independence",
      forVendors: "For Vendors",
      forPartners: "For Partners",
      contact: "Contact",
    },
    ctaDesktop: "Become a Founding Tester",
    ctaMobile: "Request Early Access",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  footer: {
    tagline: "Evidence over opinion. Decisions you can defend.",
    exploreHeading: "Explore",
    audiencesHeading: "Audiences",
    legalHeading: "Legal",
    linkFoundingTester: "Become a Founding Tester",
    copyright: "© {year} ClouDonna. All rights reserved.",
    badge: "Public Alpha",
  },

  languageSwitcher: {
    label: "Language",
    choose: "Choose language",
  },

  hero: {
    badge: "Independent Enterprise Decision Intelligence",
    h1: "Enterprise Decision Intelligence.",
    sub: "Make every enterprise decision with confidence.",
    ctaPrimary: "Become a Founding Tester",
    ctaSecondary: "Explore Donna",
    tagline: "Vendor-neutral · Evidence-based · Public Alpha",
  },

  problem: {
    badge: "The problem",
    h2First: "Enterprise technology decisions are made on trust,",
    h2Second: "not evidence.",
    sub: "Every major platform decision still runs on analyst decks, vendor demos and whoever spoke last in the room.",
    symptoms: [
      { label: "Slow", body: "Months of workshops and vendor calls to reach a decision that should take weeks." },
      { label: "Opaque", body: "Recommendations arrive without the reasoning behind them — a name, not an argument." },
      { label: "Biased", body: "Advice shaped by who sponsors the report, not by what fits your landscape." },
    ],
  },

  donnaSignature: {
    badge: "Watch Donna work",
    h2: "Not a form. A mind at work.",
    youLabel: "You",
    question: "We run SAP S/4HANA, Azure and Power BI across 3,000 users. What should our next data platform be?",
    reading: "Reading your landscape…",
    evidence: [
      "SAP-native integration — strong fit",
      "Governance & security — enterprise-grade",
      "Time to value — months, not a year",
      "Vendor lock-in — low",
    ],
    weighing: "Weighing trade-offs, forming a recommendation…",
    recommendationFormed: "Recommendation formed",
    donnaScoreLabel: "Donna Score",
    confidenceLabel: "Confidence",
    srRecommendation: "Recommendation formed: {name}, {confidence}% confidence.",
    srWeighing: "Weighing trade-offs, forming a recommendation.",
    srEvidence: "Gathering evidence.",
    srReading: "Donna is reading your landscape.",
    illustrativeNote: "Illustrative example, not a live query — try it yourself below, or",
    methodologyLink: "see the full methodology",
  },

  trustStrip: {
    boldPart: "ClouDonna evaluates every vendor the same way.",
    rest: "Same criteria, every time. No vendor can pay for a better score, or a better position.",
    linkText: "Read our independence statement →",
  },

  enterpriseIntelligence: {
    badge: "Enterprise Decision Intelligence",
    h2: "Built to be trusted, not just used",
    pillars: [
      { label: "Evidence-based", body: "Every recommendation cites its sources — reviews, benchmarks, market data. Not opinion." },
      { label: "Deterministic scoring", body: "The same input produces the same score, every time. AI narrates the reasoning; it never decides the outcome." },
      { label: "Auditable", body: "Full audit trail. Row-level security. A decision record nobody can quietly edit." },
    ],
  },

  ecosystem: {
    badge: "Use Cases",
    h2: "One platform. Five ways to decide.",
    sub: "Donna AI is live today. The rest is next — built on the same evidence.",
    plannedBadge: "Planned",
    tryNow: "Try it now →",
    getNotified: "Get notified →",
    products: {
      donnaAi: { tagline: "Decision architect", description: "Turns your requirements into a recommendation — with the evidence attached." },
      compare: { tagline: "Side-by-side evaluation", description: "Compare software across capability, architecture, pricing and security." },
      marketplace: { tagline: "Vendors & experts", description: "Vendors, implementation partners and experts — held to the same standard as every recommendation." },
      intelligence: { tagline: "Market & cost data", description: "Market data, benchmarks, expert reviews. Behind every number Donna shows you." },
      workspace: { tagline: "Collaborative tracking", description: "One shared place to track decisions, architecture and reports." },
    },
  },

  inquiryForm: {
    optionalHint: "Optional — helps us tailor the follow-up",
    submitting: "Submitting",
    thanksHeading: "Thanks — we’ve got it",
    genericError: "This inquiry could not be submitted. Please try again.",
    networkError: "This inquiry could not be submitted. Check your connection and try again.",
    fields: {
      fullName: "Full name",
      workEmail: "Work email",
      company: "Company",
      country: "Country",
      role: "Role",
      selectRole: "Select your role",
      phone: "Phone",
      message: "Message",
      messagePlaceholder: "Tell us what you're trying to do...",
      optional: "(optional)",
      website: "Website",
    },
    roles: ["IT / Enterprise Architecture", "Procurement", "Executive Leadership", "Consulting / Implementation Partner", "Other"],
    copyByType: {
      founding_tester: {
        eyebrow: "Founding Testers · Public Alpha",
        heading: "Become a Founding Tester",
        body: "ClouDonna is opening access to Donna AI's assessment in waves. Tell us a bit about your landscape and we'll reach out.",
        submitLabel: "Become a Founding Tester",
        successBody: "Application received. We'll review it and follow up if it's a fit for this wave.",
      },
      enterprise: {
        eyebrow: "Enterprise Conversation",
        heading: "Request an Enterprise Conversation",
        body: "There's no self-service pilot program yet — this reaches a founder directly, who'll follow up to scope what working with your organization would look like.",
        submitLabel: "Request a conversation",
        successBody: "Received. A founder will follow up directly — this doesn't go into a queue.",
      },
      partner: {
        eyebrow: "Partners",
        heading: "Partner with ClouDonna",
        body: "The partner directory and matching flow aren't live yet. Tell us about your practice and we'll follow up when partner profiles open.",
        submitLabel: "Apply as a partner",
        successBody: "Received. We'll follow up when partner profiles open.",
      },
      vendor: {
        eyebrow: "Vendors",
        heading: "Vendor / Product Information",
        body: "There's no self-service vendor submission flow yet. Tell us about your product and we'll follow up — this never affects any product's score or ranking.",
        submitLabel: "Send vendor information",
        successBody: "Received. Note: nothing submitted here affects any recommendation, score, or ranking.",
      },
      general: {
        eyebrow: "General Enquiry",
        heading: "Get in touch",
        body: "Anything that doesn't fit the other categories — this reaches a founder directly.",
        submitLabel: "Send message",
        successBody: "Received. We typically reply within a few business days.",
      },
    },
  },

  contact: {
    title: "Contact",
    header: "What brings you here?",
    sub: "One form, five reasons. Pick the one that fits and it reaches the right person.",
    entryPoints: {
      founding_tester: "Become a Founding Tester",
      enterprise: "Request an Enterprise Conversation",
      partner: "Partner with ClouDonna",
      vendor: "Vendor / Product Information",
      general: "General Enquiry",
    },
    chooseDifferent: "Choose a different reason",
  },

  common: {
    backToHome: "Back to home",
    readNeutralityRules: "Read the full",
    neutralityRulesLink: "neutrality rules",
  },

  donnaExperience: {
    introBadge: "Donna AI · Public Alpha",
    h1: "Your Enterprise Decision Assistant",
    sub: "Context, priorities, constraints. Donna compares real alternatives against them and hands you a recommendation — with the evidence attached.",
    startCta: "Start your assessment",
    aboutMinute: "About a minute · real evidence, no account needed",
  },

  donnaAiPage: {
    metaTitle: "Donna AI — Enterprise Decision Assistant",
    metaDescription: "Context, priorities, constraints. A guided assessment that produces an evidence-based enterprise technology recommendation. Public Alpha preview.",
  },

  adaptiveIntake: {
    openingHeading: "What are you trying to decide?",
    openingSub: "Describe your situation in your own words. Donna will pick out what she can and ask only about what's still missing.",
    statementSrLabel: "Describe your situation",
    statementPlaceholder: "We're a Swiss manufacturer running SAP S/4HANA and Snowflake. We want to modernize analytics before 2028.",
    skipLink: "Skip — ask me directly",
    continueBtn: "Continue",
    understoodHeading: "Understood.",
    understoodSub: "Did I get that right? Tap anything that's wrong to remove it.",
    youSaid: "You said",
    donnaInferred: "Donna inferred — confirm to keep",
    alsoMentioned: "Also mentioned",
    alsoMentionedNote: "Noted as part of your current landscape — not re-asked, though only one system per category drives scoring.",
    nothingExtracted: "Nothing specific enough to extract yet — no problem, Donna will just ask directly.",
    confirmBtn: "That's right, continue",
    readyHeading: "Donna has what she needs.",
    addMoreContext: "Add more context first",
    getRecommendation: "Get recommendation",
    everythingUsedHeading: "That's everything Donna can use.",
    everythingUsedSub: "Every question that changes the recommendation has an answer.",
    pickAsManyApply: "Pick as many as apply.",
    moreContextHint: "A little more context will sharpen this.",
    rawTextLabel: "{field}: {rawText} ({band} for scoring)",
    bandLabel: "{field}: {band}",
    fields: {
      goals: { legend: "Goals", question: "What matters most for this decision?" },
      erp: { legend: "ERP", question: "What ERP do you run today?" },
      cloud: { legend: "Cloud", question: "Which cloud are you on?" },
      dataWarehouse: { legend: "Data warehouse", question: "Any data warehouse in place?" },
      employees: { legend: "Employees", question: "How many employees?" },
      industry: { legend: "Industry", question: "What industry are you in?" },
      budget: { legend: "Budget", question: "What's your budget level?" },
      timeline: { legend: "Timeline", question: "What's your timeline?" },
      preferredVendor: { legend: "Preferred vendor", question: "Any preferred vendor?" },
      preferredCloud: { legend: "Preferred cloud", question: "Any preferred cloud?" },
      riskAppetite: { legend: "Risk appetite", question: "How would you describe your risk appetite?" },
      internalSkills: { legend: "Internal skills", question: "How strong are your internal skills for this?" },
      aiPlatform: { legend: "AI platform", question: "Any AI platform in place yet?" },
      country: { legend: "Country", question: "Where are you headquartered?" },
      revenue: { legend: "Revenue", question: "What's your revenue?" },
      itOrgSize: { legend: "IT org size", question: "How large is your IT organization?" },
      crm: { legend: "CRM", question: "And your CRM?" },
      analytics: { legend: "Analytics", question: "What do you use for analytics?" },
    },
  },

  questionEngine: {
    tierLabels: {
      1: "Decision objective",
      2: "Current landscape",
      3: "Hard constraints",
      4: "Strategic preference",
      5: "Risk / implementation reality",
      6: "Secondary context",
    },
    readinessLabels: {
      "not-enough-context": "Not enough context yet",
      "enough-to-compare": "Enough to compare platforms",
      "enough-to-recommend": "Enough for a recommendation",
      "high-confidence": "High-confidence recommendation",
    },
  },

  resultOverview: {
    previewBadge: "Preview recommendation · Public Alpha",
    recommendationLabel: "Recommendation",
    donnaScoreLabel: "Donna Score",
    confidenceLabel: "Confidence",
    closeHeading: "This is close.",
    closeBodyOne: "{leader} leads {trailer} by just 1 point. Treat this as two strong options, not a settled choice.",
    closeBodyMany: "{leader} leads {trailer} by only {gap} points. Treat this as two strong options, not a settled choice.",
    decisionHingesLabel: "Decision hinges on:",
    whyHeading: "Why this recommendation?",
    noEvidence: "Your inputs didn't strongly differentiate between platforms. Add more detail for a sharper recommendation.",
    tradeOffsHeading: "Trade-offs to weigh",
    bestAlternativeHeading: "Best alternative",
    onlyOneMatched: "Only one platform matched your stated criteria closely enough to compare.",
    pointsBehindOne: "1 point behind {name} on your stated priorities.",
    pointsBehindMany: "{gap} points behind {name} on your stated priorities.",
    evaluatedSameCriteria: "Evaluated against the same criteria as the recommendation above.",
    evidenceHeading: "Evidence: full score breakdown",
    currentSituationHeading: "Current situation",
    fullComparisonHeading: "Full comparison",
    recommendedBadge: "Recommended",
    alternativeBadge: "Alternative recommendation",
  },

  forPartners: {
    metaTitle: "For Partners",
    metaDescription: "How consultancies and implementation partners surface as qualified delivery options inside ClouDonna's evidence-based recommendations.",
    badge: "For Partners",
    h1: "Get discovered for the work you're actually good at",
    sub: "ClouDonna's Discovery process reaches an implementation approach before it reaches a partner — so when you surface, it's because the engagement already fits.",
    points: [
      { title: "Surface where you actually fit", body: "Partner options appear against specific implementation approaches — not a generic directory listing, but tied to the goal, constraints and technology already established for that engagement." },
      { title: "Delivery capability, evaluated on evidence", body: "The same evidence-based standard that applies to technology applies to delivery: what you're specialized in, and where you've demonstrated it, not just a self-reported blurb." },
      { title: "Qualified opportunities, not cold leads", body: "Because a partner match only happens after the goal, requirements and constraints are already defined, what reaches you is a scoped opportunity, not a generic inquiry." },
    ],
    statusHeading: "Where things stand today",
    statusBody: "The partner directory and matching flow are not live yet during the Public Alpha. Apply for early access to be notified when partner profiles open up.",
    applyCta: "Apply as a partner",
  },

  forVendors: {
    metaTitle: "For Vendors",
    metaDescription: "How software vendors participate in the ClouDonna catalog, and the neutrality boundaries that stay in place regardless of participation.",
    badge: "For Vendors",
    h1: "Be evaluated fairly, not sold to",
    sub: "Enterprise buyers come to ClouDonna specifically because vendors can't buy their way into a better recommendation. That's also true if you're the vendor.",
    points: [
      { title: "Get evaluated on the same criteria as everyone else", body: "Your platform is scored against the same ten Donna Score dimensions as every other entry in the catalog — no separate track for participants." },
      { title: "Participation doesn't change your score", body: "Applying to be listed, or providing clarifying information about your product, does not move your score or ranking. The scoring model has no field that a vendor relationship can influence." },
      { title: "What we're not offering", body: "This is not a paid placement program, not a lead-gen arrangement, and not a certification. If that's what you're looking for, ClouDonna isn't the right fit." },
    ],
    statusHeading: "Where things stand today",
    statusBody: "During the Public Alpha, the vendor catalog is curated by ClouDonna from public information — there is no self-service vendor submission flow yet. If you'd like to be notified when verified vendor profiles open up, apply for early access below and note your interest.",
    applyCta: "Apply as a vendor",
  },

  independence: {
    metaTitle: "Independence",
    metaDescription: "ClouDonna's neutrality rules: how recommendations are evaluated, what vendors cannot influence, and what independence means during the Public Alpha program.",
    badge: "Independence",
    h1: "ClouDonna is designed for vendor-neutral analysis",
    sub: "Independence isn't a slogan on this site — it's a set of structural rules that shape how Donna AI is built. Here is exactly what that means, and what it doesn't.",
    rules: [
      { title: "Every platform is scored against the same criteria", body: "The Donna Score model applies the same ten dimensions — architecture, governance, security, cost, time to value and more — to every platform in the catalog, using the same evidence standard." },
      { title: "No vendor can pay for a better score or placement", body: "There is no sponsored ranking, no paid placement, and no commercial relationship that changes a score. Today, no vendor pays ClouDonna anything." },
      { title: "Qualitative judgments, never fabricated numbers", body: "Platform capability is expressed with maturity bands (emerging, developing, established, leading), not invented market-share figures, benchmark claims, or live pricing." },
      { title: "AI narrates evidence, it never invents it", body: "Where AI is used to help explain a recommendation, it can only narrate facts the scoring engine already computed — it cannot change a score or override which platform is recommended." },
    ],
    alphaHeading: "What “Public Alpha” means for independence",
    alphaBody1: "The vendor intelligence catalog is currently curated by ClouDonna from public sources, not sourced from vendors directly, and is reviewed periodically rather than live. As verified vendor profiles and a public comparison catalog are built (see",
    alphaBody2: "), the same neutrality rules above will keep applying to them.",
    forVendorsLink: "For Vendors",
    communityHeading: "Community & research",
    communityBody: "ClouDonna is built to eventually incorporate outside expert review as part of how platforms are evaluated. That program doesn't exist yet — this page will be the place it's announced when it does.",
  },

  login: {
    h1: "Sign in to ClouDonna",
    sub: "Sign in to save decisions, build a history, and revisit past recommendations. Trying Donna itself never requires an account.",
    magicLinkSent: "Check your email for a sign-in link. It expires shortly, so use it soon.",
    workEmail: "Work email",
    sendMagicLink: "Send magic link",
    usePasswordInstead: "Use a password instead",
    password: "Password",
    signIn: "Sign in",
    useMagicLinkInstead: "Use a magic link instead",
    newToClouDonna: "New to ClouDonna?",
    createAccount: "Create an account",
  },

  signup: {
    h1: "Create your account",
    sub: "An account lets you save decisions, build a history, and revisit past recommendations inside an organization. Nothing about the anonymous Donna experience changes.",
    fullName: "Full name",
    workEmail: "Work email",
    password: "Password",
    passwordHint: "At least 8 characters.",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
  },

  legal: {
    alphaBadge: "Public Alpha",
    privacy: {
      metaTitle: "Privacy Policy",
      metaDescription: "How ClouDonna handles data during the Public Alpha program.",
      h1: "Privacy Policy",
      lastUpdated:
        "Last updated: 2026-08-09. This describes ClouDonna's actual current data handling during the Public Alpha — not a future state. It will be replaced by a full, legally reviewed policy before general availability; several sections below say exactly what's still missing.",
      sections: [
        { title: "What we collect — inquiries", body: "When you submit the contact form (at /contact, /early-access, or the homepage Founding Testers section), we store: your name, work email, company, role, country and phone number if you provide them, your message, which of the five inquiry categories you selected, the page you submitted from, and — if present in the URL — UTM parameters and referrer." },
        { title: "What we collect — product usage", body: "We log a small set of first-party events on our own contact and inquiry flow — a page was viewed, a form was started, a form was submitted, and which category. This is not third-party analytics: no Google Analytics, Plausible, PostHog, Clarity, or visitor-intelligence vendor is installed anywhere on ClouDonna. These events carry no name, no email, no IP address, and no way to identify who triggered them — just the event, the page, and the time." },
        { title: "Why we collect it", body: "Inquiry data: solely to respond to your inquiry. Usage events: to understand which parts of the site people actually use. Neither is sold, used for advertising, or shared with a third party." },
        { title: "Where it's stored", body: "In our Postgres database (via Supabase), protected by row-level security — only ClouDonna platform staff can read submitted inquiries. Exact hosting region is not yet confirmed publicly here; ask via the contact form if this matters to your evaluation." },
        { title: "Third parties", body: "None active today. No email-notification provider is configured in production — a new inquiry is currently only logged server-side, not emailed anywhere. If a provider (we've evaluated Resend) is configured, this section will name it and be updated before that happens, not after." },
        { title: "Data retention", body: "Not yet defined. This is an open item we're flagging honestly rather than inventing a number — a real retention policy will be published here before general availability." },
      ],
      rightsTitle: "Your rights",
      rightsBodyPrefix: "To ask what we hold about you, or to request deletion, use the",
      rightsBodyLink: "contact form",
      rightsBodySuffix: "— General Contact category.",
      legalEntityTitle: "Legal entity",
      legalEntityBodyPrefix: "The legal entity operating ClouDonna, its registered address, and applicable data-protection contact details are not yet published — see the",
      legalEntityBodyLink: "Imprint",
      legalEntityBodySuffix: "for what's confirmed so far.",
    },
    imprint: {
      metaTitle: "Imprint",
      metaDescription: "Legal publisher information for ClouDonna.",
      h1: "Imprint",
      notComplete: "This page is not yet complete for general availability — see below for exactly what's missing.",
      intro: "Full legal publisher details for ClouDonna (company name, registered address, commercial register entry and representatives) will be published here ahead of general availability, in line with applicable legal disclosure requirements. Nothing below is invented — the fields that aren't yet confirmed are listed as open, not filled with placeholder text.",
      missingHeading: "Production requirements not yet confirmed",
      missingFields: [
        "Legal entity name",
        "Operator / responsible person",
        "Registered postal address",
        "Contact email",
        "Contact phone",
        "Commercial register entry / company registration number",
        "VAT identification number",
      ],
      missingFooter: "None of these should be invented — they need founder/legal confirmation before this page can be considered complete.",
      contactHeading: "Contact",
      contactBodyPrefix: "Use the",
      contactBodyLink: "contact form",
      contactBodySuffix: "until a dedicated legal contact channel is published here.",
    },
    terms: {
      metaTitle: "Terms of Service",
      metaDescription: "Terms governing use of ClouDonna during the Public Alpha program.",
      h1: "Terms of Service",
      lastUpdated: "Last updated: this page is a placeholder for the Public Alpha program.",
      intro: "ClouDonna is provided as an early-stage, evolving product during the Public Alpha program. Full Terms of Service will be published here before general availability.",
      alphaHeading: "Alpha program",
      alphaBody: "Features, availability and functionality may change at any time without notice while ClouDonna is in Public Alpha.",
      acceptableUseHeading: "Acceptable use",
      acceptableUseBody: "Detailed acceptable-use terms will be published here ahead of general availability.",
      contactHeading: "Contact",
      contactBodyPrefix: "Use the",
      contactBodyLink: "contact form",
      contactBodySuffix: "until a dedicated legal contact channel is published here.",
    },
  },

  seo: {
    home: { title: "ClouDonna — Enterprise Decision Intelligence", description: "ClouDonna helps you make enterprise technology decisions you can defend — backed by evidence, not opinion." },
    contact: { title: "Contact", description: "Become a Founding Tester, request an Enterprise Conversation, or reach ClouDonna as a partner or vendor." },
  },
};

export default en;
