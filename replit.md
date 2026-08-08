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
- `DATABASE_URL` — Postgres connection string
- `PORT` — required by both the API server and the frontend dev server (not used on Vercel)
- `COOKIE_SECRET` — signs the session cookie; falls back to an insecure dev value if unset (throws in production)

Optional env:
- `APP_URL` — frontend base URL, used to build links inside emails. Defaults to the Vercel deployment's own URL (`VERCEL_PROJECT_PRODUCTION_URL`, falling back to `VERCEL_URL` on previews) when running on Vercel, and to `http://localhost:5173` otherwise — so it only needs setting for a custom domain or a non-Vercel host.
- `ADMIN_ALERT_EMAIL` — where urgent-flag alert emails are sent (alerts are logged, not sent, if unset)
- `ADMIN_ALERT_PHONE` — where urgent-flag alert SMS texts are sent, E.164 format e.g. `+15551234567` (logged, not sent, if unset)
- `RESEND_API_KEY`, `EMAIL_FROM` — email provider; without a key, emails are logged to stdout instead of sent
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — SMS provider; without these, SMS is logged to stdout instead of sent
- `REDIS_URL` (API server, optional) — backs the rate limiter with Redis so limits hold across multiple instances; falls back to a per-process in-memory store if unset (fine for a single instance)
- `API_PORT` (frontend only, dev) — enables a Vite dev-server proxy so `/api` calls stay same-origin as the frontend, which is what makes session cookies work without cross-origin cookie config in dev
- `CORS_ORIGIN` (API server, optional) — pins CORS to a specific origin in production; defaults to reflecting the request origin (paired with `credentials: true`, so this is fine as long as auth is cookie/session based)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, cookie-based sessions (no JWT, no third-party auth library — see Architecture decisions)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v3 API surface (see Gotchas — the workspace's `zod` package resolves to v3 for the default import), `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`) → react-query hooks (`lib/api-client-react`) + Zod schemas (`lib/api-zod`)
- Frontend: React 19, Vite, wouter, TanStack Query, react-hook-form + zodResolver, Tailwind + shadcn/ui
- Email: `lib/integrations/email`, a thin wrapper over Resend's HTTP API (plain `fetch`, no SDK dependency)
- SMS: `lib/integrations/sms`, the same pattern over Twilio's REST API (plain `fetch` + Basic Auth, no SDK)
- Rate limiting: `ioredis`-backed when `REDIS_URL` is set, in-memory otherwise (see `artifacts/api-server/src/lib/rateLimit.ts`)
- Build: esbuild (CJS bundle) for the API server

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract. Edit this, then run the codegen script.
- `lib/db/src/schema/*.ts` — Drizzle schema, one file per table (users, sessions, emailVerificationTokens, passwordResetTokens, conversations, messages, notifications, resources + resourceEvents).
- `artifacts/api-server/src/routes/*.ts` — Express routes: `auth` (incl. password reset), `conversations` (user-facing), `notifications`, `resources`, `admin` (all `/admin/*` routes including resource CRUD, admin-only).
- `artifacts/api-server/src/lib/` — `passwords.ts` (scrypt hashing), `session.ts` (cookie sessions + `requireAuth`/`requireAdmin` middleware), `safety.ts` (server-authoritative crisis-language detector), `conversations.ts` (shared message-append/notify/alert logic, now emails *and* texts the urgent alert), `config.ts`, `rateLimit.ts` (pluggable Redis/in-memory store), `validate.ts`.
- `artifacts/tikvah/src/pages/` — one file per route; `admin/` holds the admin-only pages (`resources.tsx` is the resource-library CRUD UI). `src/pages/auth/` holds forgot/reset-password alongside login/register/verify. `src/lib/auth.tsx` has `AuthProvider`/`RequireAuth`/`RequireAdmin`. `src/components/shell.tsx` has the shared header/footer/button/page-intro chrome.
- `artifacts/tikvah/src/lib/safety.ts` — client-side copy of the crisis-language detector, used only for the instant pre-submit UX (the server re-checks everything independently — see Architecture decisions).
- `scripts/src/promoteAdmin.ts`, `scripts/src/seedResources.ts` — operational scripts, see Run & Operate.

## Architecture decisions

- **This is a from-scratch rebuild of what was originally a zero-knowledge, anonymous, client-only journal.** The product brief calls for real accounts and a human admin reading and replying to submissions, which is fundamentally incompatible with true end-to-end encryption (nobody but the user could ever decrypt a submission). Data is now stored server-side, encrypted at rest, admin-readable. The visual design system (colors, type, page rhythm) was kept — it already matched the brief's "calm, warm, sage/cream" direction.
- **Auth is hand-rolled, not a library.** Password hashing uses Node's built-in `crypto.scrypt` (no native deps). Sessions are a DB-backed random token, only its SHA-256 hash stored, referenced by a signed httpOnly cookie (`cookie-parser`, already a dependency). No JWTs — a JWT would let a session outlive server-side revocation, which matters more here than usual given the sensitivity of the content.
- **Safety/crisis detection runs on both sides, but the server is authoritative.** The client shows an immediate compassionate crisis message + hotlines before the network round-trip (good UX, and works even if the request fails), but flagging a conversation urgent and sending the admin alert email only happens from the server-side check in `appendMessage()` — a user could disable JS and the safety net would still hold.
- **Email is provider-agnostic and fails soft.** `lib/integrations/email` calls Resend's HTTP API directly with `fetch` (no SDK). Without `RESEND_API_KEY` set, it logs the email instead of throwing, so registration/replies/alerts all keep working end-to-end before a provider is wired up.
- **API contract is OpenAPI-first.** `lib/api-spec/openapi.yaml` is the one place that defines request/response shapes; both the Zod validation schemas and the frontend's react-query hooks are generated from it. Don't hand-edit `lib/api-zod/src/generated/**` or `lib/api-client-react/src/generated/**`.
- **Dev-mode cross-origin cookies are solved with a Vite proxy, not permissive CORS.** Set `API_PORT` when running the frontend dev server so `/api/*` requests are proxied to the API server and stay same-origin — this is what makes the session cookie work in local dev without loosening CORS in a way that would carry into production.
- **Every third-party integration fails soft, the same way.** Email (Resend) and SMS (Twilio) both call the provider's HTTP API directly (no SDK) and log instead of throwing when unconfigured; the rate limiter is a shared `RateLimitStore` interface with an in-memory implementation used by default and a Redis one swapped in when `REDIS_URL` is set. None of these need credentials/infra to be present for the app to work end-to-end — they degrade to "logged, not delivered" or "single-instance, not shared" until configured.
- **A password reset invalidates every existing session for that account** (`DELETE FROM sessions WHERE user_id = ...`), not just the one that requested it — treated as a security-sensitive action given the content on this platform, not just a convenience feature.
- **Password reset never reveals whether an email is registered.** `POST /auth/request-password-reset` always returns 204, whether or not the account exists — only the presence/absence of an email in the user's inbox can tell them anything.

## Product

- **Accounts:** name + email + password, no phone number, no public username/profile. Email verification is encouraged (banner + resend flow) but not a hard login gate. Forgot/reset password is available from the login page.
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

**One** Vercel Project serves the whole app — the static frontend and the API on
a single domain. Create it pointed at this repo with:

- Project Settings → General → Root Directory: `artifacts/tikvah`
- Framework Preset: Vite
- **"Include source files outside of the Root Directory in the Build Step"** turned on — required so pnpm can resolve the `@workspace/*` workspace packages, the shared `tsconfig.base.json`, and `artifacts/api-server` itself.
- Environment variables: `DATABASE_URL` and `COOKIE_SECRET` are the only required ones. Everything else is optional (`RESEND_API_KEY`/`EMAIL_FROM`, `ADMIN_ALERT_EMAIL`/`ADMIN_ALERT_PHONE`, `TWILIO_*`, `REDIS_URL`, `APP_URL`, `DATABASE_POOL_MAX`) — the app deploys and works without them, with email/SMS logged instead of sent and rate limiting kept in-process. See the env list above.

How the single project fits together, all of it from `artifacts/tikvah/vercel.json`:

- **Build Command** does three things in order: builds the API server (`pnpm --filter @workspace/api-server run build`), builds the frontend (`pnpm run build`), then copies the API bundle into `dist/server/` (`pnpm run package:api` → `package-api.mjs`).
- **`outputDirectory: dist/public`** — what gets served statically. Vite's default `dist` isn't where this project's `vite.config.ts` puts the build, hence the explicit setting. Note `dist/server/` sits *outside* the published directory, so the API bundle is never downloadable as a static asset.
- **`/api/*` is a single serverless Function**, `api/[...slug].js` — a catch-all that re-exports the Express app **already bundled to plain JS** (`dist/server/app.mjs`) and lets Express do its own routing. Bundling ourselves is deliberate: letting Vercel's own TypeScript pass compile `src/app.ts` fails with `TS2349 This expression is not callable` on `pino-http`'s import, because Vercel's Function compiler doesn't reliably honor this workspace's `tsconfig` `extends` chain / esModuleInterop-equivalent settings. If you ever see that error again, it means something is importing raw `.ts` from `/api` instead of the bundled `.mjs` — fix the import, don't add `esModuleInterop` and hope. `functions.includeFiles: "dist/server/**"` makes sure pino's worker files (loaded at runtime by path, not by a static import, so nothing traces them) ship with the Function.
- **The SPA fallback rewrite excludes `/api/`** (`/((?!api/).*) → /index.html`) so client-side routes like `/dashboard` survive a hard refresh without the fallback swallowing API requests.
- **No proxying, no CORS.** Frontend and API share one origin, so session cookies work with no cross-site-cookie configuration — the same property the local dev Vite proxy (`API_PORT`) gives you.

`artifacts/api-server/vercel.json` and `artifacts/api-server/api/[...slug].js` are still there and still work if you ever want the API as its own separate Project (set Root Directory to `artifacts/api-server` and `APP_URL` to the frontend's URL); nothing in the single-project setup depends on them.

**Serverless-safe DB connections:** `lib/db` caps its `pg.Pool` at `max: 1` per instance whenever it detects it's running on Vercel or Lambda (`VERCEL=1` / `AWS_LAMBDA_FUNCTION_NAME`), vs. `max: 10` for a traditional long-running server — override either default with `DATABASE_POOL_MAX`. It also sets a short `idleTimeoutMillis`/`connectionTimeoutMillis` and a `pool.on('error', ...)` handler so a dropped idle connection logs instead of crashing the process. This blunts, but doesn't eliminate, the classic serverless+Postgres connection-exhaustion problem — under real concurrent traffic you can still stack up one connection per warm instance, so if your Postgres provider (Neon, Supabase, etc.) offers a pooled/PgBouncer connection string, use that for `DATABASE_URL`; the two mitigations compound.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
