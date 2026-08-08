# Sprint 6 — 02. Authentication

## Decision: Supabase Auth, email/password + magic link, `@supabase/ssr` sessions, SSO as a documented seam

Not chosen in a vacuum — the entire schema already in `main` (`packages/database`, `supabase/migrations/20260806120200_tenancy.sql`) is written assuming `auth.uid()` exists: `is_org_member()`/`is_org_admin()` are `SECURITY DEFINER` SQL functions keyed on it, and every RLS policy in the tenancy, decision-engine, and audit tables calls one of them. Choosing a different identity provider would mean re-deriving an equivalent primitive for no benefit — Supabase Auth is not the safe default here, it's the only choice that doesn't throw away a schema that already passed review.

## Methods

- **Magic link** — the primary method surfaced in the UI. Lower support burden than password reset, and reliable for the B2B/work-email audience this product targets.
- **Email/password** — available as a fallback, not hidden.
- **Enterprise SSO (SAML/OIDC)** — a **seam, not a build**. Supabase Auth supports SSO on paid tiers. Nothing in this plan blocks adding it later; nothing in this plan builds it now.

## Session handling in Next.js

`@supabase/ssr` (current standard for App Router — not yet a dependency, added in Phase 6.1):

- **Server client** — per-request, cookie-based, created in Server Components/Route Handlers. Every RLS-protected query runs as the real authenticated user through this client, never through a bypass.
- **Browser client** — used only for the login/signup UI itself.
- **Middleware** — refreshes the session cookie on every request, required by `@supabase/ssr`'s rotation model.
- No JWT is ever parsed by hand. Token lifecycle is entirely Supabase's client libraries' responsibility.

## Authentication flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as Middleware
    participant SA as Supabase Auth
    participant RH as Route Handler
    participant DB as Postgres (RLS)

    B->>SA: magic link or password sign-in
    SA-->>B: session cookie
    B->>MW: request to a protected route
    MW->>SA: refresh session if needed
    MW-->>RH: forward with valid cookie
    RH->>SA: resolve auth.uid() from cookie
    RH->>DB: query; RLS evaluates is_org_member(auth.uid())
    DB-->>RH: only rows the user is entitled to
```

## The one required schema change: syncing `auth.users` to `public.users`

`public.users` exists today as a standalone profile table — its own migration comment states the sync trigger "does not exist yet, by design." Sprint 6 adds it:

```sql
create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
```

Critically, `public.users.id` is made **equal to** `auth.users.id` — not a separately generated UUID. That single equality is what makes every existing RLS policy's `auth.uid()` check correct against the schema already in `main`, with zero policy rewrites required.

## Future Azure AD / Okta compatibility

Both are OIDC/SAML identity providers Supabase Auth's SSO feature (or a broker like WorkOS sitting in front of it) can federate against without a schema change — `auth.users` already generalizes over identity provider. What Sprint 6 does *not* build: per-organization "which IdP does this email use" login routing, SCIM provisioning, or admin-configured SSO settings. Those require a new `organizations.sso_config` column and a login-flow branch that has no product justification yet — documented here as the known next step, not started.

## What this document does not decide

- Whether password sign-in is disabled entirely in favor of magic-link-only, or offered as a fallback by default — a support-load/UX call flagged for founder input in `12-roadmap.md`.
