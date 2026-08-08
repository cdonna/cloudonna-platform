"use server";

/**
 * Every auth mutation in this domain (sign in, sign up, sign out) is a
 * Server Action, not a client-side Supabase call — the form submits
 * here, this file talks to Supabase using the per-request server
 * client, and the resulting session cookie is set by that same request/
 * response cycle. No auth token or credential ever needs to round-trip
 * through client-side JavaScript beyond what the browser's own form
 * submission already does. See docs/sprint-6/17-auth-implementation.md.
 */
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
  /** A non-error, informational message (e.g. "check your email to
   * confirm your account"). Mutually exclusive with `error` — never both
   * set on the same result. */
  info?: string | null;
}

const GENERIC_AUTH_ERROR = "We couldn't sign you in with those details. Please try again.";

/** Shown for BOTH a brand-new sign-up pending email confirmation AND an
 * attempted sign-up against an email that already has an account —
 * deliberately identical wording so the response can never be used to
 * test whether a given email is registered. See
 * docs/architecture/sprint-6.1-freeze.md, "Known limitations" (fixed). */
const CHECK_EMAIL_MESSAGE = "If that email can be used to create an account, we've sent a confirmation link. Check your inbox, then sign in.";

function readEmail(formData: FormData): string | null {
  const email = formData.get("email");
  return typeof email === "string" && email.trim().length > 0 ? email.trim() : null;
}

export async function signInWithPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = formData.get("password");

  if (!email || typeof password !== "string" || password.length === 0) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Never surface the SDK's own error message — it can distinguish
  // "wrong password" from "no such account," which is exactly the kind
  // of account-enumeration signal an auth form must not leak.
  if (error) {
    return { error: GENERIC_AUTH_ERROR };
  }

  redirect("/app");
}

export async function signInWithMagicLink(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  if (!email) {
    return { error: "Enter your email." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${resolveSiteUrl()}/auth/callback` },
  });

  if (error) {
    return { error: GENERIC_AUTH_ERROR };
  }

  return { error: null };
}

export async function signUp(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = formData.get("password");
  const fullName = formData.get("fullName");

  if (!email || typeof password !== "string" || password.length < 8) {
    return { error: "Enter your email and a password of at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: typeof fullName === "string" ? fullName.trim() : undefined },
      emailRedirectTo: `${resolveSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    // "This email already has an account" is an account-enumeration
    // signal (unlike "password too weak," which reveals nothing about
    // any existing account) — collapsed to the exact same message a
    // successful, pending-confirmation sign-up returns below, so the
    // response can never distinguish the two cases.
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { error: null, info: CHECK_EMAIL_MESSAGE };
    }
    // Every other sign-up error (e.g. weak password, invalid email) is
    // safe to surface as-is — it reveals nothing about any existing
    // account, only about the values this caller just submitted.
    return { error: error.message.length < 200 ? error.message : GENERIC_AUTH_ERROR };
  }

  // A session is only present here if the Supabase project has email
  // confirmation disabled. When confirmation is required, signUp()
  // succeeds with no error and no session — redirecting to /app
  // unconditionally would immediately bounce the user back to /login
  // (the layout's own auth guard), a broken first-run experience. See
  // docs/architecture/sprint-6.1-freeze.md, "Known limitations" (fixed).
  if (!data.session) {
    return { error: null, info: CHECK_EMAIL_MESSAGE };
  }

  redirect("/app");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Server Actions have no request URL to derive an absolute redirect
 * from — NEXT_PUBLIC_SITE_URL is the one new, optional env var this
 * requires; falls back to localhost for local development. */
function resolveSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}
