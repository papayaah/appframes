# Offline-first persistence + background sync (IndexedDB → Postgres)

> For implementation-level details of cross-device project sync (API contracts, conflicts, deletions, “claim local projects”), see `specs/cross-device-project-sync.md`.

## Status / do we still need this doc?

- **Local state persistence is already implemented** (IndexedDB via `idb` + debounced saves).
- This doc is only needed if we still want **remote sync (IndexedDB → Postgres)** on the roadmap.
  - If we’re not doing remote sync anytime soon, we can delete this file and keep the local persistence behavior as code-only (or move it into a smaller dedicated “Local persistence” note).

## Goals

- **Offline-first UX**: all edits are instant and work with no network.
- **Buttery interactions**: no React re-renders on every pointer move; keep the existing “preview in rAF, commit on end” technique.
- **Quiet background sync**: network persistence happens asynchronously and never blocks the UI.
- **Simple to develop locally**: local dev can use **Brew Postgres** (no Docker required) or optionally Docker Postgres.
- **Server-side accounts**: enable Google sign-in and per-user projects (later).

## Non-goals (for v1)

- Multi-user realtime collaboration
- CRDT/OT conflict-free editing
- Binary media storage in Postgres (we’ll treat media separately)

## Current state (already implemented)

- **Local persistence** is in the browser via **IndexedDB** using `idb`:
  - `lib/PersistenceDB.ts` stores `projects`, `appState`, `mediaFiles`
  - `hooks/usePersistence.ts` provides debounced “save status” behavior
- **Media files** are referenced via **OPFS** path (`fileHandle`) and thumbnails are stored as base64 for fast display.

This remains the **authoritative working copy** for the user’s editing session.

## Proposed architecture

### Two-tier persistence model

1) **Local working copy (authoritative for UX)**
- What the canvas uses during editing.
- Writes occur on “commit” events (mouseup/end gesture, explicit save, debounced state changes).

2) **Remote mirror (authoritative for accounts + cross-device)**
- Stored in **Postgres**.
- Updated via background sync (pull/push).
- Used for:
  - signed-in user project list across devices
  - recovery if browser storage is cleared
  - sharing/export in future

### Libraries (server)

- **ORM**: `drizzle-orm`
- **Migrations**: `drizzle-kit`
- **Postgres driver**: `postgres` (porsager) *or* `pg` (either works; default plan is `postgres` for simplicity)
- **Auth**: **Better Auth** (`better-auth`)
- **OAuth UI/hooks**: your local package **`@reactkits.dev/better-auth-connect`** (headless, works with Mantine)

## Data model (server-side)

### Minimal tables (v1 sync)

- `users`
  - `id` (string/uuid)
  - `email`, `name`, `image`
  - `createdAt`, `updatedAt`

- `projects`
  - `id` (uuid) — same as local `Project.id`
  - `userId` (fk → users.id)
  - `name`
  - `data` (jsonb) — the full project payload (screensByCanvasSize, selections, zoom, etc.)
  - `revision` (bigint) — increments on each accepted write
  - `updatedAt`, `createdAt`

**Why jsonb first?**
- Fast to ship and iterate while the client model is still evolving.
- We can later normalize to `screens`, `frames`, `textElements` if needed.

### Media

Keep current **OPFS/IndexedDB** for local assets.

If we want cross-device media later:
- store originals in object storage (S3/R2)
- store references in Postgres (URL + metadata)

## API layer (Next.js App Router)

We’ll add Route Handlers under `app/api/*`:

- `GET/POST /api/auth/[...all]` (Better Auth handler via `toNextJsHandler(auth)`)
- Optional: `GET/DELETE /api/auth/{provider}/accounts` routes if we use `better-auth-connect`’s UI components that need to query connection status
- `GET /api/projects` — list user projects (id, name, updatedAt)
- `GET /api/projects/:id` — fetch full project
- `PUT /api/projects/:id` — upsert project with optimistic concurrency
- `POST /api/sync` (optional convenience endpoint) — batch push/pull

### Auth requirements

All project endpoints require a signed-in session:
- server reads user id from **Better Auth session**
- queries scoped by `userId`

## Sync algorithm (offline-first)

### Key idea: sync never blocks local edits

- Local saves continue to write to IndexedDB immediately.
- Sync runs:
  - after local commits (debounced)
  - when connectivity returns (`online` event)
  - when tab becomes visible (optional)

### Client state needed for sync

Store in IndexedDB (can live inside `appState` or a new store):
- `lastSyncedRevisionByProjectId: Record<string, number>`
- `syncQueue: Array<{ projectId, localUpdatedAt, payloadHash?, enqueuedAt }>`

### Push (client → server)

On enqueue (after a local commit):
1) Add projectId to `syncQueue` (dedupe by projectId).
2) Background worker processes the queue:
   - reads latest project JSON from IndexedDB
   - sends `PUT /api/projects/:id` with:
     - `data` (json)
     - `baseRevision` = `lastSyncedRevisionByProjectId[projectId] || 0`

Server behavior:
- If `baseRevision` matches current server `revision`:
  - accept write, increment `revision`, update `updatedAt`, return new `revision`
- If it doesn’t match:
  - return `409 Conflict` with server `data` + server `revision`

Client behavior on `409`:
- v1 policy: **last-write-wins** (client overwrites server) *or* “prefer server” (configurable).
- v2: prompt user to choose which copy to keep or attempt a merge.

### Pull (server → client)

On app load (when signed in):
- list projects from server, then for each project:
  - compare server `updatedAt`/`revision` to local `lastSyncedRevision`
  - if server is newer and local has no pending queue entry:
    - replace local project payload with server payload

If local has pending unsynced edits:
- keep local, attempt push; resolve conflicts if server changed meanwhile.

## Performance constraints (important)

- **Do not** `setState` on every mousemove for drag/resize/rotate.
- Continue using:
  - rAF-based DOM preview during gestures
  - single React state commit on gesture end
- Sync should run in the background and should not force canvas re-renders:
  - sync uses IndexedDB reads and fetch calls
  - UI can show a lightweight “Saving / Synced / Error” status (like `usePersistence`)

## Local dev workflows

### Local dev using Brew Postgres (recommended)

- Use `.env.local`:
  - `DATABASE_URL=postgresql://appframes@localhost:5432/appframes`
- Run migrations with `drizzle-kit`.
- Run `next dev` normally.

### Production deploy (server)

- Postgres runs in Docker Compose (optional `--profile db`), and is **not exposed** to the host by default.
- Secrets (`POSTGRES_PASSWORD`, etc.) live in `/srv/{app_name}/.env` (not in git).

## Implementation plan (high level)

1) Add Drizzle schema + migration tooling (`drizzle.config.ts`, `lib/db.ts`, `lib/schema.ts`)
2) Add Better Auth + database-backed sessions + `app/api/auth/[...all]` handler
3) Add `@reactkits.dev/better-auth-connect` (optional) for OAuth connect UI/hooks (works with Mantine presets)
4) Add projects API routes (CRUD + revision check)
5) Add client sync queue + background worker (IndexedDB-backed)
6) Add UI status (synced/syncing/error) + manual “Sync now”

