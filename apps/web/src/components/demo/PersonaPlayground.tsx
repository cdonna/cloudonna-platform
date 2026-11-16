"use client";

/**
 * Picking a persona then a question remounts DonnaLive with that
 * question pre-filled (via its `initialQuestion` prop and a matching
 * `key`, so React treats it as a fresh instance) — clicking straight
 * into a realistic scenario, not a static list of cards. DonnaLive's
 * own state stays local and un-persisted, so remounting it here is
 * safe and touches nothing in the real Donna AI session/history
 * machinery.
 */
import { useState } from "react";
import DonnaLive from "@/components/donna/DonnaLive";
import { useLocale } from "@/i18n/LocaleProvider";
import { PERSONAS } from "./personas";

export function PersonaPlayground() {
  const { dict } = useLocale();
  const [activePersonaId, setActivePersonaId] = useState(PERSONAS[0].id);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const activePersona = PERSONAS.find((persona) => persona.id === activePersonaId) ?? PERSONAS[0];

  return (
    <div>
      <div role="tablist" aria-label={dict.common.choosePersona} className="flex flex-wrap gap-2">
        {PERSONAS.map((persona) => {
          const active = persona.id === activePersonaId;
          return (
            <button
              key={persona.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActivePersonaId(persona.id);
                setSelectedQuestion(null);
              }}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors duration-control focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${
                active
                  ? "border-transparent bg-solid font-medium text-solid-on"
                  : "border-rule bg-paper-2 text-ink-2 hover:border-rule-2 hover:text-ink"
              }`}
            >
              {persona.role}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {activePersona.questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => setSelectedQuestion(question)}
            className={`min-h-11 rounded-md border px-4 py-2.5 text-left text-sm transition-colors duration-control focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${
              selectedQuestion === question
                ? "border-accent/40 bg-accent-wash text-ink"
                : "border-rule bg-paper-2 text-ink-2 hover:border-rule-2 hover:text-ink"
            }`}
          >
            {question}
          </button>
        ))}
      </div>

      <div className="mt-12">
        <DonnaLive key={selectedQuestion ?? activePersonaId} initialQuestion={selectedQuestion ?? ""} />
      </div>
    </div>
  );
}
