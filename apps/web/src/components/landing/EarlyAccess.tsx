"use client";

import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";

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
    heading: "Request early access",
    body: "ClouDonna is opening access to Donna AI's guided assessment in waves. This is a preview of the request flow — in this alpha build, submissions are not transmitted or stored anywhere.",
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
      className="relative scroll-mt-8 overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-200/30 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 shadow-sm">
            <Mail size={14} />
            Public Alpha
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
            {copy.heading}
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">{copy.body}</p>
        </div>

        <div
          className="mt-12 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_35px_100px_-35px_rgba(79,70,229,0.35)] backdrop-blur-xl"
          aria-live="polite"
        >
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={28} />
              </span>

              <h3 className="text-2xl font-semibold text-slate-950">
                Preview complete
              </h3>

              <p className="max-w-md text-sm leading-6 text-slate-600">
                Thanks for trying the Early Access flow. In this alpha
                build, submissions are not transmitted or stored anywhere —
                a live intake process will be enabled in a future release.
              </p>

              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 text-sm font-medium text-violet-700 hover:text-violet-800"
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
                  className="text-sm font-medium text-slate-800"
                >
                  Role <span className="text-violet-600">*</span>
                </label>
                <select
                  id={`${formId}-role`}
                  name="role"
                  required
                  defaultValue=""
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
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
                  className="text-sm font-medium text-slate-800"
                >
                  I&apos;m interested as a{" "}
                  <span className="text-violet-600">*</span>
                </label>
                <select
                  id={`${formId}-audience`}
                  name="audience"
                  required
                  defaultValue={audience ?? ""}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
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
                  className="text-sm font-medium text-slate-800"
                >
                  Message{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <textarea
                  id={`${formId}-message`}
                  name="message"
                  rows={4}
                  placeholder="Tell us about your landscape or what you'd like Donna to help with..."
                  className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="h-12 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200"
                >
                  {status === "submitting" ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      Request early access
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Preview only — no account or payment required, and
                  submissions are not transmitted or stored in this alpha
                  build.
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
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label} {required && <span className="text-violet-600">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
      />
    </div>
  );
}
