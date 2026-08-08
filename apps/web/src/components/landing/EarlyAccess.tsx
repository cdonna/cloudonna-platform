"use client";

import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const roles = [
  "IT / Enterprise Architecture",
  "Procurement",
  "Executive Leadership",
  "Consulting / Implementation Partner",
  "Other",
];

export type Audience = "customer" | "vendor" | "partner" | "community";

const audienceOptions: { value: Audience | ""; label: string }[] = [
  { value: "customer", label: "Enterprise customer — evaluating technology" },
  { value: "vendor", label: "Software vendor — want to be evaluated" },
  { value: "partner", label: "Consultancy / implementation partner" },
  { value: "community", label: "Community / research" },
];

const audienceCopy: Record<Audience, { heading: string; body: string }> = {
  customer: {
    heading: "Become a Founding Tester",
    body: "ClouDonna is opening access to Donna AI's assessment in waves. This is a preview of the request flow — submissions aren't transmitted or stored anywhere in this alpha build.",
  },
  vendor: {
    heading: "Apply as a vendor",
    body: "There is no self-service vendor submission flow yet. Apply here to be notified when verified vendor profiles open up — this is a preview of the request flow and submissions are not transmitted or stored in this alpha build.",
  },
  partner: {
    heading: "Apply as a partner",
    body: "The partner directory and matching flow are not live yet. Apply here to be notified when partner profiles open up — this is a preview of the request flow and submissions are not transmitted or stored in this alpha build.",
  },
  community: {
    heading: "Join the community waitlist",
    body: "The community and research program hasn't launched yet. Let us know you're interested — this is a preview of the request flow and submissions are not transmitted or stored in this alpha build.",
  },
};

export default function EarlyAccess({
  audience,
}: {
  audience?: Audience;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const formId = useId();
  const copy = audience ? audienceCopy[audience] : audienceCopy.customer;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "submitting") {
      return;
    }

    setStatus("submitting");

    window.setTimeout(() => {
      setStatus("success");
    }, 700);
  }

  return (
    <section
      id="early-access"
      className="relative scroll-mt-8 overflow-hidden bg-void px-6 py-28"
    >
      <div className="pointer-events-none absolute inset-0 motion-safe:animate-aurora-drift">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-aurora-primary/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
            <Sparkles size={14} />
            Founding Testers · Public Alpha
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{copy.heading}</h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-nova-ink-muted">{copy.body}</p>
        </div>

        <div
          className="mt-12 overflow-hidden rounded-[2rem] border border-titanium bg-carbon shadow-nova-glow"
          aria-live="polite"
        >
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-nova-success/30 bg-nova-success/10 text-nova-success">
                <CheckCircle2 size={28} />
              </span>

              <h3 className="text-2xl font-semibold text-nova-ink">Preview complete</h3>

              <p className="max-w-md text-sm leading-6 text-nova-ink-muted">
                Thanks for trying the Founding Tester flow. In this alpha build, submissions are not transmitted or stored anywhere — a
                live intake process will be enabled in a future release.
              </p>

              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 text-sm font-medium text-nova-accent-strong hover:text-nova-ink"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-5 p-7 sm:grid-cols-2 sm:p-10"
              noValidate={false}
            >
              <Field
                id={`${formId}-name`}
                label="Full name"
                required
                autoComplete="name"
              />

              <Field
                id={`${formId}-email`}
                label="Work email"
                type="email"
                required
                autoComplete="email"
              />

              <Field
                id={`${formId}-company`}
                label="Company"
                required
                autoComplete="organization"
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${formId}-role`}
                  className="text-sm font-medium text-nova-ink"
                >
                  Role <span className="text-nova-accent-strong">*</span>
                </label>
                <select
                  id={`${formId}-role`}
                  name="role"
                  required
                  defaultValue=""
                  className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${formId}-audience`}
                  className="text-sm font-medium text-nova-ink"
                >
                  I&apos;m interested as a{" "}
                  <span className="text-nova-accent-strong">*</span>
                </label>
                <select
                  id={`${formId}-audience`}
                  name="audience"
                  required
                  defaultValue={audience ?? ""}
                  className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                >
                  <option value="" disabled>
                    Select what best describes you
                  </option>
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${formId}-message`}
                  className="text-sm font-medium text-nova-ink"
                >
                  Message{" "}
                  <span className="font-normal text-nova-ink-faint">
                    (optional)
                  </span>
                </label>
                <textarea
                  id={`${formId}-message`}
                  name="message"
                  rows={4}
                  placeholder="Tell us about your landscape or what you'd like Donna to help with..."
                  className="resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="h-12 w-full bg-nova-accent text-white shadow-nova-glow hover:bg-nova-accent-strong"
                >
                  {status === "submitting" ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      Become a Founding Tester
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>

                <p className="mt-3 text-center text-xs text-nova-ink-faint">
                  Preview only. No account, no payment. Nothing here is transmitted or stored.
                </p>
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
  label,
  type = "text",
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-nova-ink">
        {label} {required && <span className="text-nova-accent-strong">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
      />
    </div>
  );
}
