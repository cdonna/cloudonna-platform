"use client";

/**
 * The one inquiry form implementation on the entire public site — the
 * homepage Founding Testers section, /contact, and /early-access all
 * render this component with a different `inquiryType`, and all three
 * post to the same /api/inquiries backend. Replaces the previous
 * EarlyAccess component's simulated submission (a setTimeout, nothing
 * transmitted or stored — see its own prior disclosed copy) with a
 * real, persisted one. See docs/operations/01-business-operations.md.
 */
import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InquiryType } from "@/lib/inquiries/schema";

const copyByType: Record<InquiryType, { eyebrow: string; heading: string; body: string; submitLabel: string }> = {
  founding_tester: {
    eyebrow: "Founding Testers · Public Alpha",
    heading: "Become a Founding Tester",
    body: "ClouDonna is opening access to Donna AI's assessment in waves. Tell us a bit about your landscape and we'll reach out.",
    submitLabel: "Become a Founding Tester",
  },
  enterprise_pilot: {
    eyebrow: "Enterprise Pilot",
    heading: "Request an Enterprise Pilot",
    body: "There's no self-service pilot program yet — this reaches a founder directly, who'll follow up to scope what a pilot with your organization would look like.",
    submitLabel: "Request a pilot",
  },
  customer: {
    eyebrow: "Talk to the Founders",
    heading: "Talk to the founders",
    body: "Questions about Donna AI, the scoring model, or whether ClouDonna fits what you're evaluating — this goes straight to a founder, not a queue.",
    submitLabel: "Talk to us",
  },
  partner: {
    eyebrow: "Partners",
    heading: "Partner with ClouDonna",
    body: "The partner directory and matching flow aren't live yet. Tell us about your practice and we'll follow up when partner profiles open.",
    submitLabel: "Apply as a partner",
  },
  vendor: {
    eyebrow: "Vendors",
    heading: "Vendor information",
    body: "There's no self-service vendor submission flow yet. Tell us about your product and we'll follow up when verified vendor profiles open.",
    submitLabel: "Apply as a vendor",
  },
  general: {
    eyebrow: "General Contact",
    heading: "Get in touch",
    body: "Anything that doesn't fit the other categories — this reaches a founder directly.",
    submitLabel: "Send message",
  },
};

const roles = [
  "IT / Enterprise Architecture",
  "Procurement",
  "Executive Leadership",
  "Consulting / Implementation Partner",
  "Other",
];

export function InquiryForm({ inquiryType, sectionId }: { inquiryType: InquiryType; sectionId?: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();
  const copy = copyByType[inquiryType];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const trim = (key: string) => (form.get(key) as string | null)?.trim() || undefined;
    // Read directly from window rather than next/navigation's
    // useSearchParams()/usePathname() hooks — those require a Suspense
    // boundary for static generation, which this component (rendered
    // in a statically-generated homepage) doesn't have. A plain client-
    // side read inside this event handler needs no such boundary: it
    // only ever runs after hydration, in response to a user action.
    const currentUrl = new URL(window.location.href);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType,
          name: trim("name"),
          businessEmail: trim("email"),
          company: trim("company"),
          role: trim("role"),
          country: trim("country"),
          phone: trim("phone"),
          message: trim("message"),
          sourcePage: currentUrl.pathname,
          utmSource: currentUrl.searchParams.get("utm_source") ?? undefined,
          utmCampaign: currentUrl.searchParams.get("utm_campaign") ?? undefined,
          referrer: document.referrer || undefined,
        }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.error ?? "This inquiry could not be submitted. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("This inquiry could not be submitted. Check your connection and try again.");
    }
  }

  return (
    <section id={sectionId} className="relative scroll-mt-8 overflow-hidden bg-void px-6 py-28">
      <div className="pointer-events-none absolute inset-0 motion-safe:animate-aurora-drift">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-aurora-primary/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
            <Sparkles size={14} />
            {copy.eyebrow}
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{copy.heading}</h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-nova-ink-muted">{copy.body}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-titanium bg-carbon shadow-nova-glow" aria-live="polite">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-nova-success/30 bg-nova-success/10 text-nova-success">
                <CheckCircle2 size={28} />
              </span>

              <h3 className="text-2xl font-semibold text-nova-ink">Thanks — we&apos;ve got it</h3>

              <p className="max-w-md text-sm leading-6 text-nova-ink-muted">
                Your message has been received. We typically reply within a few business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5 p-7 sm:grid-cols-2 sm:p-10">
              <Field id={`${formId}-name`} name="name" label="Full name" required autoComplete="name" />
              <Field id={`${formId}-email`} name="email" label="Work email" type="email" required autoComplete="email" />
              <Field id={`${formId}-company`} name="company" label="Company" autoComplete="organization" />
              <Field id={`${formId}-country`} name="country" label="Country" autoComplete="country-name" />

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${formId}-role`} className="text-sm font-medium text-nova-ink">
                  Role
                </label>
                <select
                  id={`${formId}-role`}
                  name="role"
                  defaultValue=""
                  className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                >
                  <option value="">Select your role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <Field id={`${formId}-phone`} name="phone" label="Phone" type="tel" optional autoComplete="tel" />

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor={`${formId}-message`} className="text-sm font-medium text-nova-ink">
                  Message <span className="font-normal text-nova-ink-faint">(optional)</span>
                </label>
                <textarea
                  id={`${formId}-message`}
                  name="message"
                  rows={4}
                  placeholder="Tell us what you're trying to do..."
                  className="resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                />
              </div>

              {status === "error" && errorMessage && (
                <p role="alert" className="text-sm text-red-400 sm:col-span-2">
                  {errorMessage}
                </p>
              )}

              <div className="sm:col-span-2">
                <Button type="submit" disabled={status === "submitting"} className="h-12 w-full bg-nova-accent text-white shadow-nova-glow hover:bg-nova-accent-strong">
                  {status === "submitting" ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      {copy.submitLabel}
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required = false,
  optional = false,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-nova-ink">
        {label} {required && <span className="text-nova-accent-strong">*</span>}
        {optional && <span className="font-normal text-nova-ink-faint">(optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
      />
    </div>
  );
}
