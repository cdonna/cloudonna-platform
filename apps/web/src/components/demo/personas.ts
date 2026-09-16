/**
 * English-only content catalog, same precedent as demo/catalog.ts and
 * vendor-intelligence/catalog.ts. Each question is meant to be dropped
 * straight into the homepage Donna demo (see DonnaLive's
 * `initialQuestion` prop) so picking one is immediately interactive,
 * not a static list.
 */
export interface Persona {
  id: string;
  role: string;
  questions: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: "cio",
    role: "CIO",
    questions: [
      "Which data platform should we standardize on?",
      "Should we modernize or replace our current architecture?",
      "Single cloud or multi cloud?",
      "Should we build or buy this capability?",
      "Central platform or federated model?",
    ],
  },
  {
    id: "cfo",
    role: "CFO",
    questions: [
      "Is this technology investment worth it?",
      "Which initiative creates the strongest business value?",
      "What is the risk of delaying this transformation?",
      "Which vendor option creates the best strategic flexibility?",
      "Where are the hidden cost and lock in risks?",
    ],
  },
  {
    id: "ceo",
    role: "CEO",
    questions: [
      "Which strategic technology decision matters most right now?",
      "Where should we invest first?",
      "What could block this transformation?",
      "What are the major strategic trade offs here?",
      "What changes if our assumptions change?",
    ],
  },
  {
    id: "ai-officer",
    role: "Chief Digital and AI Officer",
    questions: [
      "Which AI use cases should we prioritize?",
      "Which AI platform strategy fits our company?",
      "Central AI platform or federated AI?",
      "Should we build, buy or partner for this?",
      "What prevents us from scaling AI from pilots to enterprise?",
    ],
  },
  {
    id: "data-officer",
    role: "Chief Data Officer",
    questions: [
      "What should our data platform strategy be?",
      "Which data products should we prioritize?",
      "Data mesh or a centralized platform?",
      "Where should we invest in data quality first?",
      "Where could our data create real value?",
    ],
  },
  {
    id: "architect",
    role: "Enterprise Architect",
    questions: [
      "What are the real trade offs between these platforms?",
      "Should we rationalize our current platform landscape?",
      "What's the right cloud architecture for this?",
      "Where is our technical debt costing us most?",
      "What's the right modernization sequence here?",
    ],
  },
];
