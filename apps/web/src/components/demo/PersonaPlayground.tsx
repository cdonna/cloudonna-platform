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
      <div role="tablist" aria-label={dict.common.choosePersona} className="flex flex-wrap justify-center gap-2">
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
              className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-control ${
                active
                  ? "border-transparent bg-gradient-to-r from-nova-accent to-sunset-coral text-white"
                  : "border-titanium bg-carbon text-nova-ink-muted hover:border-titanium-strong hover:text-nova-ink"
              }`}
            >
              {persona.role}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
        {activePersona.questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => setSelectedQuestion(question)}
            className={`rounded-2xl border px-4 py-2.5 text-left text-sm transition duration-control ${
              selectedQuestion === question
                ? "border-nova-accent/50 bg-nova-accent/10 text-nova-ink"
                : "border-titanium bg-carbon-2 text-nova-ink-muted hover:border-titanium-strong hover:text-nova-ink"
            }`}
          >
            {question}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <DonnaLive key={selectedQuestion ?? activePersonaId} initialQuestion={selectedQuestion ?? ""} />
      </div>
    </div>
  );
}
