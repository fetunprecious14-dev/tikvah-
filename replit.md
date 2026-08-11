# Tikvah

Tikvah ("hope" in Hebrew) is a private emotional support platform: users write to the Tikvah team in confidence, a real person reads and replies, and every conversation stays strictly between that one user and the team — no public profiles, feeds, or user-to-user contact.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (build + start; reads `PORT`)
- `pnpm --filter @workspace/tikvah run dev` — run the frontend (Vite; reads `PORT`, `BASE_PATH`, optional `API_PORT` for the dev proxy)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from `lib/api-spec/openapi.yaml` (do this after editing the spec)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run promote-admin <email>` — promote an existing account to admin (there's no public admin signup)
- `pnpm --filter @workspace/scripts run seed-resources` — (re)seed the resource library with curated content

Required env (see `.env.example`):
- `DATABASE_URL` — Postgres connection string. The database is the Supabase project `fetunprecious14-dev's Project` (ref `fybptbghwmochcptgnrl`, `eu-central-1`); grab the string from the dashboard's **Connect** button. Use the **shared pooler in transaction mode (port 6543)** on Vercel and the direct connection (or session pooler) locally — see "Deploying to Vercel" for why.
- `PORT` — required by both the API server and the frontend dev server (not used on Vercel)
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`) — API server only, used to verify the bearer token Supabase Auth issues the frontend. Same Supabase project as `DATABASE_URL`. See "Auth" below.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`) — frontend build only, same values under the `VITE_` prefix Vite requires to expose them to browser code. All four of these are safe to commit/expose — see "Auth".

Optional env:
- `INITIAL_ADMIN_EMAIL` — bootstraps the first administrator without a terminal command. The account matching this email is promoted to admin the moment its Tikvah profile is created (or, for one already created before this was set, the next time that account authenticates) — gated on Supabase Auth having confirmed the address, so ownership of the email is still proven first. See `getOrCreateProfile` in `lib/supabaseAuth.ts`.
- `APP_URL` — base URL used to build links inside *product* email (reply notifications, urgent alerts) — not signup/reset email, which Supabase Auth sends and builds its own links for (configured via its Redirect URLs allowlist, see "Auth"). Defaults to the Vercel deployment's own URL (`VERCEL_PROJECT_PRODUCTION_URL`, falling back to `VERCEL_URL` on previews) when running on Vercel, and to `http://localhost:5173` otherwise — so it only needs setting for a custom domain or a non-Vercel host.
- `ADMIN_ALERT_EMAIL` — where urgent-flag alert emails are sent (alerts are logged, not sent, if unset)
- `ADMIN_ALERT_PHONE` — where urgent-flag alert SMS texts are sent, E.164 format e.g. `+15551234567` (logged, not sent, if unset)
- `RESEND_API_KEY`, `EMAIL_FROM` — email provider for reply notifications and urgent alerts only (signup/reset email is Supabase Auth's, not this); without a key, emails are logged to stdout instead of sent
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — SMS provider; without these, SMS is logged to stdout instead of sent
- `REDIS_URL` (API server, optional) — backs the rate limiter with Redis so limits hold across multiple instances; falls back to a per-process in-memory store if unset (fine for a single instance)
- `API_PORT` (frontend only, dev) — enables a Vite dev-server proxy so `/api` calls stay same-origin as the frontend. No longer required for auth to work (bearer tokens aren't origin-bound the way cookies are) — this is now purely a convenience to skip CORS in local dev.
- `CORS_ORIGIN` (API server, optional) — pins CORS to a specific origin in production; defaults to reflecting the request origin. No `credentials: true` needed — auth is a bearer token, not a cookie.
- `LOG_LEVEL` (API server, optional) — pino level (`trace`/`debug`/`info`/`warn`/`error`/`fatal`); defaults to `info`
- `BASE_PATH` (frontend build, optional) — sub-path the app is served from; defaults to `/`, which is what Vercel needs. `mockup-sandbox` is the exception: it *requires* both `PORT` and `BASE_PATH` and throws at config load without them, so a bare `pnpm run build` at the root fails on that package. It isn't part of the Vercel build (`vercel.json` builds only `api-server` and `tikvah`), so this doesn't affect deploys — set both vars if you need to build it locally.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5. Auth is Supabase Auth (`@supabase/supabase-js`) — see Architecture decisions
- DB: PostgreSQL + Drizzle ORM (Supabase-hosted; `profiles` table extends Supabase Auth's own `auth.users`)
- Validation: Zod v3 API surface (see Gotchas — the workspace's `zod` package resolves to v3 for the default import), `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`) → react-query hooks (`lib/api-client-react`) + Zod schemas (`lib/api-zod`)
- Frontend: React 19, Vite, wouter, TanStack Query, react-hook-form + zodResolver, Tailwind + shadcn/ui
- Email: `lib/integrations/email`, a thin wrapper over Resend's HTTP API (plain `fetch`, no SDK dependency)
- SMS: `lib/integrations/sms`, the same pattern over Twilio's REST API (plain `fetch` + Basic Auth, no SDK)
- Rate limiting: `ioredis`-backed when `REDIS_URL` is set, in-memory otherwise (see `artifacts/api-server/src/lib/rateLimit.ts`)
- Build: esbuild (CJS bundle) for the API server

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract. Edit this, then run the codegen script.
- `lib/db/src/schema/*.ts` — Drizzle schema, one file per table (profiles, conversations, messages, notifications, resources + resourceEvents). Every table is declared `.enableRLS()` — see "Deploying to Vercel" for why that matters on Supabase. `profiles.ts` also declares a read-only stub for Supabase's `auth.users` (id + email only) so `profiles.id` can carry a real FK to it — see the comments there and `drizzle.config.ts`'s `schemaFilter` before touching either.
- `artifacts/api-server/src/routes/*.ts` — Express routes: `auth` (just the app profile now — see "Auth"), `conversations` (user-facing), `notifications`, `resources`, `admin` (all `/admin/*` routes including resource CRUD, admin-only).
- `artifacts/api-server/src/lib/` — `supabaseAuth.ts` (verifies the bearer token against Supabase Auth + `requireAuth`/`requireAdmin` middleware + lazy profile creation), `safety.ts` (server-authoritative crisis-language detector), `conversations.ts` (shared message-append/notify/alert logic, now emails *and* texts the urgent alert), `config.ts`, `rateLimit.ts` (pluggable Redis/in-memory store), `validate.ts`.
- `artifacts/tikvah/src/pages/` — one file per route; `admin/` holds the admin-only pages (`resources.tsx` is the resource-library CRUD UI). `src/pages/auth/` holds login/register/forgot/reset/verify — all now backed by Supabase Auth directly (`src/lib/supabaseClient.ts`), not by the API server. `src/lib/auth.tsx` has `AuthProvider`/`RequireAuth`/`RequireAdmin`. `src/components/shell.tsx` has the shared header/footer/button/page-intro chrome.
- `artifacts/tikvah/src/lib/safety.ts` — client-side copy of the crisis-language detector, used only for the instant pre-submit UX (the server re-checks everything independently — see Architecture decisions).
- `scripts/src/promoteAdmin.ts`, `scripts/src/seedResources.ts` — operational scripts, see Run & Operate.

## Architecture decisions

- **This is a from-scratch rebuild of what was originally a zero-knowledge, anonymous, client-only journal.** The product brief calls for real accounts and a human admin reading and replying to submissions, which is fundamentally incompatible with true end-to-end encryption (nobody but the user could ever decrypt a submission). Data is now stored server-side, encrypted at rest, admin-readable. The visual design system (colors, type, page rhythm) was kept — it already matched the brief's "calm, warm, sage/cream" direction.
- **Auth is Supabase Auth, not hand-rolled.** This app used to run its own password hashing (`crypto.scrypt`), session table, and email-token tables for verification/reset. All of that is gone — Supabase Auth now owns signup, login, logout, email confirmation, password reset, and session/token lifecycle entirely. See "Auth" below for how the pieces fit together.
- **Safety/crisis detection runs on both sides, but the server is authoritative.** The client shows an immediate compassionate crisis message + hotlines before the network round-trip (good UX, and works even if the request fails), but flagging a conversation urgent and sending the admin alert email only happens from the server-side check in `appendMessage()` — a user could disable JS and the safety net would still hold.
- **Email is provider-agnostic and fails soft — for the emails this app still sends.** `lib/integrations/email` calls Resend's HTTP API directly with `fetch` (no SDK), for reply notifications and urgent alerts only; signup confirmation and password-reset emails are Supabase Auth's own. Without `RESEND_API_KEY` set, replies/alerts log instead of throwing, so those flows keep working end-to-end before a provider is wired up.
- **API contract is OpenAPI-first.** `lib/api-spec/openapi.yaml` is the one place that defines request/response shapes; both the Zod validation schemas and the frontend's react-query hooks are generated from it. Don't hand-edit `lib/api-zod/src/generated/**` or `lib/api-client-react/src/generated/**`.
- **Every third-party integration fails soft, the same way.** Email (Resend) and SMS (Twilio) both call the provider's HTTP API directly (no SDK) and log instead of throwing when unconfigured; the rate limiter is a shared `RateLimitStore` interface with an in-memory implementation used by default and a Redis one swapped in when `REDIS_URL` is set. None of these need credentials/infra to be present for the app to work end-to-end — they degrade to "logged, not delivered" or "single-instance, not shared" until configured.

## Auth

Supabase Auth owns signup, login, logout, email confirmation, password reset, and session persistence end to end. The API server and its `profiles` table only hold what Supabase doesn't: Tikvah-specific fields (name, role) and the app data (conversations, messages, etc.) those fields gate access to.

**The pieces:**
- **`profiles`** (`lib/db/src/schema/profiles.ts`) — one row per Supabase Auth user, `id` a real FK to `auth.users(id) on delete cascade`. Holds `name`, `role`, `created_at` — deliberately *not* email/password, which stay in `auth.users`. `role` lives here (or could live in `app_metadata`) rather than in `user_metadata`, which the user's own client can request changes to — never treat `user_metadata` as authorization-bearing.
- **Profile creation is lazy and idempotent**, not a database trigger — `getOrCreateProfile()` in `artifacts/api-server/src/lib/supabaseAuth.ts` runs on every authenticated request, creating the row on first sight (from `user_metadata.name`) if it doesn't exist yet. The frontend also calls `POST /api/auth/profile` right after registration when it can (see below), but doesn't have to for the app to end up correct — this is what makes "Supabase didn't return a session immediately after signup" a non-issue rather than a bug to route around.
- **Backend verification is a real call to Supabase, not a local JWT decode.** `requireAuth` reads `Authorization: Bearer <token>`, then calls `supabase.auth.getUser(token)` — a network round trip to GoTrue for every authenticated request. This is deliberate: it means a revoked/signed-out token is rejected immediately rather than only once it expires, at the cost of that round trip. `req.user` is then a normalized `{ id, email, name, role, createdAt, emailVerified }` (see `types/express.d.ts`), built from the Supabase user (id, email, `email_confirmed_at`) plus the profile row (name, role, createdAt) — routes don't need to know the two-source split.
- **Frontend:** `src/lib/supabaseClient.ts` creates the browser client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`. `src/lib/auth.tsx`'s `AuthProvider` registers `setAuthTokenGetter` once at module load (not per-render) — it reads `supabase.auth.getSession()` fresh on every API call, which is a cheap local read that supabase-js keeps refreshed in the background, so registering it once stays correct across sign-in/out without re-registering. `AuthProvider` also tracks Supabase's session via `onAuthStateChange`, using the `INITIAL_SESSION` event to know when the first check is done (see the comments there before changing the loading-state logic).
- **Registration** calls `supabase.auth.signUp()` with `options.data.name` (display metadata) and `emailRedirectTo`. If a session comes back immediately (email confirmation off/auto-confirmed), the frontend calls `POST /api/auth/profile` right away and seeds the `getCurrentUser` query cache directly with the result — otherwise it shows a "check your email" screen and stashes the email in `sessionStorage` (`PENDING_VERIFICATION_EMAIL_KEY` in `register.tsx`) purely so `verify-email.tsx` can offer a "resend" button, since there's no session yet to ask Supabase who the pending user is.
- **Email confirmation and password reset are both landing-page flows, not token-passing ones.** Clicking either emailed link redirects to `/verify-email` or `/reset-password` with Supabase's client already having established a session via `detectSessionInUrl` (the default) before the page's own code runs — neither page parses a token itself. They just watch `useAuth()`'s `session`/`user` state (and check the URL for an `error`/`error_description` Supabase appends on an expired/invalid link — see `lib/authRedirectError.ts`). `reset-password.tsx` calls `supabase.auth.updateUser({ password })` once that recovery session exists; no follow-up login step is needed since the recovery session is already a real one.
- **Sign-out defaults to every device.** `supabase.auth.signOut()`'s default `scope` is `'global'` (every session for that user, everywhere) — a change from the old design, where a session was always per-device. `shell.tsx` passes `{ scope: 'local' }` explicitly to keep that behavior.

**Manual setup this refactor could not do from here** (no filesystem/API access to the Supabase Auth dashboard beyond the MCP tools' scope):
- **Redirect URLs allowlist.** Supabase Auth rejects `emailRedirectTo`/`redirectTo` values not on the project's allowlist (Dashboard → Authentication → URL Configuration). Add the deployed frontend origin plus `/verify-email` and `/reset-password` (and `http://localhost:5173` and its equivalents for local dev) before either flow will work in production.
- **Password policy.** The registration/reset forms enforce a 10-character minimum client-side (`lib/authValidation.ts`) — that's UX only. The actual floor is whatever Supabase Auth's own password policy allows (Dashboard → Authentication → Policies), which defaults to something shorter. Set it to match if a client-side-only minimum isn't good enough.
- **"Confirm email" and login.** If that project setting is on, `signInWithPassword` rejects an account until its email is confirmed — a stricter default than the original design's "encouraged, not gated" verification. If the original UX is wanted (login works, `user.emailVerified` just drives a nag banner — the banner logic in `dashboard.tsx` is unchanged and still works either way), turn that requirement off in the dashboard.
- **Email enumeration protection.** Whether `signUp`/`resetPasswordForEmail` responses reveal whether an email is already registered depends on this project setting too — check it if that matters for this deployment.

**The two pre-refactor accounts don't carry forward.** `public.users` had 2 rows (password hashes, scrypt) when this migration ran; they were dropped rather than migrated, since a one-way hash in a different scheme can't produce a working Supabase Auth login either way — confirmed with the account holder before dropping. Both need to register again through Supabase Auth (same email is fine); the promote-admin script still works from a blank slate (see Run & Operate).

## Product

- **Accounts:** name + email + password, no phone number, no public username/profile, via Supabase Auth (see "Auth"). Email verification shows a banner + resend flow either way; whether it's also a login gate depends on the project's "Confirm email" setting. Forgot/reset password is available from the login page.
- **Dashboard:** welcome message, rotating encouraging quote, and a large "What's on your mind today?" textarea that starts a new conversation. Drafts are saved to `localStorage` per-user (not sent to the server until submitted).
- **Conversations:** each submission starts a thread; users can reply within a thread, see all past threads chronologically, and search them. Every message is private between that user and the Tikvah team — nothing is visible to other users.
- **Crisis handling:** a regex-based heuristic (imperfect by design — flagged as such in the UI) checks every user-authored message for suicidal intent, self-harm, homicide, domestic abuse, panic attack, psychosis, child abuse, or sexual assault language. A match shows crisis resources (988, IASP directory) immediately client-side, marks the conversation `urgent` server-side (sorted first in the admin inbox regardless of filter), and emails/texts the admin if `ADMIN_ALERT_EMAIL`/`ADMIN_ALERT_PHONE` are configured.
- **Notifications:** in-app only for now (a bell with unread count in the header) — created when an admin replies. Resource/maintenance notification types exist in the schema for future use but nothing currently creates them.
- **Resource library:** seeded, browsable/filterable/searchable by topic (anxiety, grief, purpose, relationships, depression, stress, faith, healing, self-worth) and type (article, book, video, podcast, verse, exercise, prompt, tip). Admins can add/edit/delete resources from `/admin/resources`; `seedResources.ts` remains a convenient way to bulk-load or reset the catalog.
- **Admin:** inbox with status filters (awaiting reply / responded / urgent / archived), search by name/email, tagging, per-conversation reply + status/tag editing; resource library management; and an analytics page (total/active users, new registrations, conversation counts by status, average response time, resource views).

## Gotchas

- **`zod`'s default import resolves to v3, not v4**, even though the installed version is 3.25.x (which bundles both under `zod` and `zod/v4`). `lib/db/src/schema/*.ts` explicitly imports `zod/v4` per its own convention; the Orval-generated code under `lib/api-zod`/`lib/api-client-react` uses the plain `zod` import and is pinned to v3 syntax via `override.zod.version: 3` in `lib/api-spec/orval.config.ts`. If you add new hand-written Zod code, pick one consciously — don't assume `import { z } from 'zod'` gives you v4 methods like `z.email()`.
- **Two different `User`/`Conversation`/etc. TypeScript types exist** — one from `@workspace/api-zod` (dates typed as `Date`, since that package's Zod schemas coerce them) and one from `@workspace/api-client-react` (dates typed as `string`, matching what the hooks actually return over the wire). Frontend code that consumes hook results should use the `@workspace/api-client-react` types; only use `@workspace/api-zod` for `zodResolver()` form validation.
- **On mutation success, seed the query cache directly** (`queryClient.setQueryData(getGetCurrentUserQueryKey(), user)`) rather than just `invalidateQueries` before navigating to an auth-gated route. `invalidateQueries` triggers a background refetch that doesn't resolve synchronously, and `RequireAuth`'s redirect effect can fire on the still-stale "signed out" state and bounce back to `/login` before the refetch lands. Register/Login navigate to `/dashboard` via a `useEffect` keyed on the auth context's `user`, not immediately inside the mutation callback, for the same reason.
- **`lib/integrations/email` and `lib/integrations/sms`'s dev fallbacks only log to stdout** — there's no way to inspect a "sent" verification/reply/reset/alert message in the UI. When testing locally without provider credentials, tail the API server's logs (links/tokens appear inline in the log line, e.g. `grep -o 'reset-password?token=[^ ]*'`).
- **The rate limiter's Redis and in-memory stores use different windowing algorithms** — in-memory is a true sliding window, Redis is a fixed window (`INCR` + `PEXPIRE` on first hit). Both enforce the same `max` per `windowMs`, but the fixed window can allow a short burst right at a window boundary. Acceptable for abuse-blunting; don't rely on it for anything stricter.
- **The Redis rate-limit store fails open**, not closed — if Redis is unreachable, requests are allowed through rather than blocked (logged as an error). This favors availability over strict enforcement; revisit if that's the wrong default for a given deployment.

## Deploying to Vercel

One Vercel Project serves the whole app from the repository root. Import the
GitHub repository, leave **Root Directory** empty, add `DATABASE_URL` and
`COOKIE_SECRET`, and deploy. Do not override the Build Command or Output
Directory in the dashboard; the root `vercel.json` supplies both.

The root configuration builds the bundled Express API and the Vite frontend.
`api/[...slug].js` serves `/api/*`, while `artifacts/tikvah/dist/public` is the
static website. Frontend and API share one origin, so no backend URL, proxy,
CORS setup, outside-root toggle, or second Vercel Project is needed.

Two settings in `vercel.json` are load-bearing and look redundant until they aren't. Both were found by reproducing the build locally with `npx vercel build` (which runs the real builder — worth doing before blaming env vars for a failed deploy):

- **`"framework": null`.** Vercel sees Express in the workspace and can preset the Project's framework to Express, which makes it look for a Node server entrypoint (`app`/`index`/`server`.{js,cjs,mjs,ts,cts,mts}) *inside the output directory* and fail the build with "No entrypoint found in output directory" — even though the build itself succeeded. This app isn't a Node-server deployment; it's static files plus one Function. Pinning the framework here overrides the dashboard preset, so the deploy doesn't depend on a dashboard setting nobody can see from the repo.
- **The explicit `/api/:path*` rewrite.** Left to infer routing from the filename, Vercel does not treat `[...slug]` as a catch-all — it generates `^/api/([^/]+)$` (one segment) followed by a blanket `^/api(/.*)?$ → 404`. Single-segment routes like `/api/healthz` work, so the deploy looks healthy, while every nested route (`/api/auth/login`, `/api/conversations/{id}/messages`) 404s. The explicit rewrite emits a multi-segment route and must stay **before** the SPA rewrite. It injects `?path=…`, which is safe because nothing in the API reads `path` as a query parameter.

Everything except `DATABASE_URL` and `COOKIE_SECRET` is optional. Without the
email/SMS variables, messages are logged instead of sent; without `REDIS_URL`,
rate limiting uses the in-process fallback.

**The database is Supabase** (project ref `fybptbghwmochcptgnrl`, `eu-central-1`).
Two things about it decide what `DATABASE_URL` has to be on Vercel:

- **Vercel's runtime is IPv4-only; Supabase's direct connection (`db.<ref>.supabase.co:5432`) is IPv6-only** without the paid IPv4 add-on. The direct string works locally but *cannot* reach the database from a Vercel Function — the symptom is connection timeouts (often `ENETUNREACH`), not an auth error.
- The **shared pooler (Supavisor) is IPv4 on every plan**, and its **transaction mode (port 6543)** is the mode meant for serverless functions opening many short-lived connections. That's the string to put in Vercel.

So: `postgresql://postgres.fybptbghwmochcptgnrl:<password>@aws-<N>-eu-central-1.pooler.supabase.com:6543/postgres`. Copy it from the dashboard rather than assembling it by hand — the username is `postgres.<project-ref>` (not plain `postgres`, which is only correct for the direct connection) and the `aws-<N>-` prefix varies per project. Transaction mode doesn't support *named* prepared statements; that's fine here because `pg` doesn't use them by default, but it's the reason not to swap in a driver that does.

**Row Level Security is on, deliberately with no policies.** Supabase exposes every `public` table over PostgREST to anyone holding the publishable/anon key, which is a client-side value — left open, that would hand out `users.password_hash`, `sessions.token_hash`, and every private conversation. This app never uses supabase-js or PostgREST; it connects straight to Postgres as the table owner, and owners bypass RLS, so RLS-with-no-policies blocks the REST API without affecting the app at all (`anon`/`authenticated` are also `REVOKE`d). The tables carry `.enableRLS()` in `lib/db/src/schema/*.ts` for a reason: without it, `drizzle-kit push` sees "RLS on in the DB, not in the schema" and generates `DISABLE ROW LEVEL SECURITY`, silently reopening everything. Keep it on any new table. Supabase's linter reports these as `rls_enabled_no_policy` at INFO level — that's the intended state here, not something to fix by adding policies.

**Serverless-safe DB connections:** `lib/db` caps its `pg.Pool` at `max: 1` per instance whenever it detects it's running on Vercel or Lambda (`VERCEL=1` / `AWS_LAMBDA_FUNCTION_NAME`), vs. `max: 10` for a traditional long-running server — override either default with `DATABASE_POOL_MAX`. It also sets a short `idleTimeoutMillis`/`connectionTimeoutMillis` and a `pool.on('error', ...)` handler so a dropped idle connection logs instead of crashing the process. This blunts, but doesn't eliminate, the classic serverless+Postgres connection-exhaustion problem — under real concurrent traffic you can still stack up one connection per warm instance, so if your Postgres provider (Neon, Supabase, etc.) offers a pooled/PgBouncer connection string, use that for `DATABASE_URL`; the two mitigations compound.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
