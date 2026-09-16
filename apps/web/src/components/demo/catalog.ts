import type { DemoVideo } from "./types";

/**
 * English-only for now, same precedent as vendor-intelligence/catalog.ts
 * and DonnaLive's demo copy (see en.ts's own header comment): a
 * structured content catalog, not UI chrome, so it isn't threaded
 * through the five-locale dictionary. Add a videoUrl/poster/duration/
 * captionsUrl to any entry when a real asset ships — no component
 * changes required, no redesign.
 */
export const DEMO_VIDEOS: DemoVideo[] = [
  {
    id: "overview",
    title: "Product overview",
    description: "What ClouDonna is and who it's for, in under two minutes.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "overview",
    persona: null,
  },
  {
    id: "walkthrough",
    title: "Donna decision walkthrough",
    description: "Watch Donna turn a real decision into a structured, evidence-backed recommendation.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "walkthrough",
    persona: null,
  },
  {
    id: "executive-result",
    title: "Executive decision record",
    description: "What the finished output looks like: recommendation, evidence, trade-offs, next steps.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "result",
    persona: "ceo",
  },
  {
    id: "decision-memory",
    title: "Decision memory",
    description: "How a saved decision stays reusable: revisit it, see what changed, decide again.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "memory",
    persona: null,
  },
  {
    id: "before-after",
    title: "Before and after",
    description: "The same decision, made the old way and made with ClouDonna, side by side.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "walkthrough",
    persona: null,
  },
  {
    id: "home-of-architects",
    title: "Home of Architects",
    description: "How architects turn a platform decision into something a CFO can read in one page.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "architects",
    persona: "architect",
  },
  {
    id: "data-economy",
    title: "Data Economy",
    description: "How enterprises trace data from source to trusted product to real business value.",
    poster: null,
    videoUrl: null,
    duration: null,
    language: "en",
    captionsUrl: null,
    category: "data-economy",
    persona: "data-officer",
  },
];
