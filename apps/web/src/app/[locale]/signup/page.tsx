"use client";

import { use, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/LocaleProvider";
import { signUp, type AuthActionState } from "../../auth/actions";

const INITIAL_STATE: AuthActionState = { error: null };

export default function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { dict } = useLocale();
  const [state, action, pending] = useActionState(signUp, INITIAL_STATE);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-void px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={36} height={36} className="brand-mark h-9 w-9 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>
        <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition hover:text-nova-accent-strong">
          <ArrowLeft size={15} />
          {dict.common.backToHome}
        </Link>
      </div>

      <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-titanium bg-carbon/80 p-8 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.35)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">{dict.signup.h1}</h1>
        <p className="mt-2 text-sm leading-6 text-nova-ink-faint">{dict.signup.sub}</p>

        <form action={action} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-name" className="text-sm font-medium text-nova-ink">
              {dict.signup.fullName}
            </label>
            <input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-email" className="text-sm font-medium text-nova-ink">
              {dict.signup.workEmail}
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-password" className="text-sm font-medium text-nova-ink">
              {dict.signup.password}
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
            />
            <p className="text-xs text-nova-ink-faint">{dict.signup.passwordHint}</p>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-400">
              {state.error}
            </p>
          )}
          {state.info && (
            <p role="status" className="text-sm text-nova-success">
              {state.info}
            </p>
          )}

          <Button type="submit" disabled={pending} className="h-11 bg-nova-accent text-white">
            {pending && <LoaderCircle size={16} className="animate-spin" />}
            {dict.signup.createAccount}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-nova-ink-faint">
          {dict.signup.alreadyHaveAccount}{" "}
          <Link href={`/${locale}/login`} className="font-medium text-nova-accent-strong underline-offset-4 hover:underline">
            {dict.signup.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
