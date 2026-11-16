"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/LocaleProvider";
import { signInWithMagicLink, signInWithPassword, type AuthActionState } from "../../../auth/actions";

const INITIAL_STATE: AuthActionState = { error: null };

export function LoginForm({ locale }: { locale: string }) {
  const { dict } = useLocale();
  const [usePassword, setUsePassword] = useState(false);
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(signInWithMagicLink, INITIAL_STATE);
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, INITIAL_STATE);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-paper px-6 py-16">
      <div className="overflow-hidden rounded-[1.75rem] border border-rule bg-paper-2/80 p-8 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.35)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{dict.login.h1}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-3">{dict.login.sub}</p>

        {!usePassword ? (
          magicLinkSent ? (
            <div role="status" aria-live="polite" className="mt-8 rounded-2xl border border-nova-success/30 bg-nova-success/10 p-5 text-sm text-nova-success">
              {dict.login.magicLinkSent}
            </div>
          ) : (
            <form action={magicLinkAction} className="mt-8 flex flex-col gap-4" onSubmit={() => setMagicLinkSent(true)}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-ink">
                  {dict.login.workEmail}
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl border border-rule bg-paper-2 px-3 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
                />
              </div>

              {magicLinkState.error && (
                <p role="alert" className="text-sm text-red-400">
                  {magicLinkState.error}
                </p>
              )}

              <Button type="submit" disabled={magicLinkPending} className="h-11 bg-solid text-solid-on">
                {magicLinkPending ? <LoaderCircle size={16} className="animate-spin" /> : <Mail size={16} />}
                {dict.login.sendMagicLink}
              </Button>

              <button
                type="button"
                onClick={() => setUsePassword(true)}
                className="text-center text-sm font-medium text-ink-3 underline-offset-4 hover:text-accent hover:underline"
              >
                {dict.login.usePasswordInstead}
              </button>
            </form>
          )
        ) : (
          <form action={passwordAction} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email-pw" className="text-sm font-medium text-ink">
                {dict.login.workEmail}
              </label>
              <input
                id="login-email-pw"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11 rounded-xl border border-rule bg-paper-2 px-3 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-ink">
                {dict.login.password}
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border border-rule bg-paper-2 px-3 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
              />
            </div>

            {passwordState.error && (
              <p role="alert" className="text-sm text-red-400">
                {passwordState.error}
              </p>
            )}

            <Button type="submit" disabled={passwordPending} className="h-11 bg-solid text-solid-on">
              {passwordPending && <LoaderCircle size={16} className="animate-spin" />}
              {dict.login.signIn}
            </Button>

            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className="text-center text-sm font-medium text-ink-3 underline-offset-4 hover:text-accent hover:underline"
            >
              {dict.login.useMagicLinkInstead}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-3">
          {dict.login.newToClouDonna}{" "}
          <Link href={`/${locale}/signup`} className="font-medium text-accent underline-offset-4 hover:underline">
            {dict.login.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
