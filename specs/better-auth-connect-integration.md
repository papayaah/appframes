# Integrating Better Auth + `@reactkits.dev/better-auth-connect` (offline-first + sync-ready)

## Goal

Use your local package `@reactkits.dev/better-auth-connect` (Better Auth wrapper) as the **first** auth/integration layer:

- Login / connect providers through Better Auth routes in `app/api/auth/*`
- Keep the app **offline-first** (IndexedDB is the working copy)
- Enable **server-side identity** (`session.user.id`) so we can safely associate Postgres rows with a user when we add sync

This spec focuses on wiring **Better Auth + better-auth-connect**. Sync endpoints can come next (see `specs/offline-first-persistence.md`).

## What this package is (important)

From your package docs:

- `@reactkits.dev/better-auth-connect` is **client-side only**
- It **does not** access Postgres directly
- It calls **your Next.js API routes** (`/api/auth/...`) and uses **IndexedDB caching** for account data

## Repository assumptions (appframes)

- Next.js App Router (current)
- TypeScript (current)
- Mantine UI (current)
- Local persistence already uses IndexedDB (current)

## Integration strategy (recommended order)

- **Phase 1 (now)**: Better Auth routes + better-auth-connect UI/hooks in the app
- **Phase 2**: Add Drizzle + Postgres (Brew locally, Docker in prod)
- **Phase 3**: Add “projects sync” endpoints using `session.user.id` as ownership

## Phase 1 — add the package to this repo

### Option A (recommended for local dev): install from your local monorepo path

Add a file dependency in `appframes/package.json`:

- `"@reactkits.dev/better-auth-connect": "file:../buzzer/packages/better-auth-connect"`

Notes:
- This expects your package has a built `dist/` (it exports `dist/*`).
- If you want hot-reload across repos, we can later move to a workspace/pnpm/turbo setup.

### Option B: publish the package and depend on a version

- `"@reactkits.dev/better-auth-connect": "^0.1.0"`

Best if you want `appframes` to be deployable without the `buzzer/` repo present.

## Phase 2 — add Better Auth + database layer (Drizzle)

Even if we only “log in”, Better Auth needs a database-backed adapter for users/sessions/accounts.

### Drizzle + Postgres

Use:
- `drizzle-orm`
- `drizzle-kit` for migrations
- `postgres` (postgres-js) driver

### Unified schema (recommended)

Put **Better Auth tables** and **AppFrames app tables** in the same Postgres database:
- Better Auth tables: `user`, `account`, `session`, `verification` (per your guide)
- AppFrames tables: at least `projects` (later sync)

Reason:
- foreign keys from `projects.userId → user.id`
- simplest queries and ownership enforcement

## Phase 2.5 — required Next.js API route(s)

### Required route: Better Auth handler

Create:
- `app/api/auth/[...all]/route.ts`

This is straight from your package’s templates:

- Uses `toNextJsHandler(auth)` to generate all Better Auth endpoints (sign-in, callback, session, etc.)

### Optional routes: provider account list / disconnect

Only required if you want UI components to show connection status and/or disconnect buttons:

- `app/api/auth/google/accounts/route.ts`
- `app/api/auth/reddit/accounts/route.ts`
- `app/api/auth/x/accounts/route.ts`
- `app/api/auth/devto/accounts/route.ts`

These are provided as templates in your package’s `backend-routes/nextjs/*-accounts.ts`.

## Phase 3 — wire UI in AppFrames (Mantine)

### Use the Mantine preset

Your package supports a Mantine preset, so the app can keep consistent UI:

- wrap the relevant page/section with `IntegrationProvider`
- render `IntegrationCard` for providers (Google, etc.)

### Identity surface area we need from auth

For Postgres ownership and sync we only need:
- `session.user.id` (stable user id)
- optionally `session.user.email` for display

Everything else can remain client-side and offline-first.

## How this ties into offline-first persistence + Postgres sync

### Not logged in

- Projects persist locally in IndexedDB (already implemented)
- No Postgres rows are created because there is no trusted `userId`

### Logged in

- Better Auth session provides `session.user.id` on the server
- Any future sync endpoints can write:
  - `projects.userId = session.user.id`

### “Claim local projects” on first login (recommended)

When user logs in for the first time:
- enumerate local projects in IndexedDB
- enqueue a background sync push that creates server rows owned by `session.user.id`

## Environment variables (conceptual)

We’ll keep secrets out of git:

- `DATABASE_URL` (local Brew Postgres or server Postgres)
- Better Auth base URL variables (per Better Auth docs / your existing patterns)
- OAuth provider credentials (Google client id/secret etc.)

## Security notes

- Postgres does **not** need to be published to the host; the app can talk to it over the Compose network.
- Even with no published port, keep a DB password:
  - it’s still reachable from other containers on the same network

## Deliverables checklist (when implementing)

- Add dependency on `@reactkits.dev/better-auth-connect` (file: or published)
- Add Better Auth config: `lib/auth.ts`
- Add Drizzle db + schema: `db/index.ts`, `db/schema.ts`, `drizzle.config.ts`
- Add route handler: `app/api/auth/[...all]/route.ts`
- Add optional provider account routes (if we use `IntegrationCard`)
- Add an Integrations UI surface in the app (Mantine preset)

