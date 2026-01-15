# Cross-device project sync (IndexedDB working copy → Postgres mirror)

## Why this spec exists

`specs/offline-first-persistence.md` defines the overall **offline-first** architecture and a high-level sync approach. This spec goes deeper on the **cross-device** part: UX, server schema, API contracts, conflict/deletion behavior, and the “claim local projects on first login” flow.

This spec assumes auth is already wired via Better Auth and `session.user.id` is available server-side (see `specs/better-auth-connect-integration.md`).

## Goals

- **Optional sign-in**: users can start using AppFrames immediately without signing in.
- **Local-first editing**: IndexedDB remains the **authoritative working copy** for canvas editing.
- **Cross-device continuity** (signed-in only): projects can be listed/loaded on any device for the same account.
- **Non-blocking sync**: network sync never blocks editing; it runs in the background.
- **Simple v1 conflict strategy**: ship something robust without CRDT/OT.

## Non-goals (v1)

- Realtime collaboration / multi-user editing
- CRDT/OT conflict-free merges
- Cross-device sync of *binary* media (OPFS files)

## User experience

### Entry points

- **Anonymous users**:
  - Can create/edit projects freely.
  - Data persists **only in that browser** (IndexedDB).
  - UI shows a lightweight state like: “Saved locally”.
- **Signed-in users**:
  - See “Syncing / Synced / Sync error” status.
  - Can load projects created on another device (from the server list).

### Sign-in and “claim local projects”

When a user signs in for the first time on a device:

- The app enumerates local projects in IndexedDB.
- The app offers one of these v1 behaviors (pick one):
  - **Auto-claim** (recommended): silently enqueue background push for all local projects.
  - **Prompt**: “Sync your local projects to your account?” with confirm/cancel.

If the account already has server projects, the local list is merged with the server list (details below).

### Sign-out

- Signing out **does not delete** local projects by default.
- The UI returns to “Saved locally” mode.
- Sync queue pauses (no session).

## Data model (Postgres via Drizzle)

### Ownership

- All rows are owned by `userId = session.user.id`.
- Server must enforce that a signed-in user can only access their own projects.

### Table: `projects`

Store the full project payload as `jsonb` in v1 to iterate quickly.

- `id` (uuid) — same as local `Project.id`
- `userId` (text/uuid) — FK to Better Auth `user.id`
- `name` (text)
- `data` (jsonb) — full project payload
- `revision` (bigint) — increments on each accepted write
- `deletedAt` (timestamp, nullable) — tombstone for deletion (sync-friendly)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

Recommended indexes/constraints:

- Unique: `(userId, id)`
- Index: `(userId, updatedAt desc)`
- Index: `(userId, deletedAt)` (for filtering)

### Better Auth tables

Do **not** invent a separate `users` table. Use Better Auth’s canonical `user` table (and related `account`, `session`, etc.) and reference `user.id` from `projects.userId`.

## API contracts (Next.js Route Handlers)

All endpoints below require a valid Better Auth session.

### `GET /api/projects`

Returns a lightweight list to populate “My projects”:

- Response: `Array<{ id, name, revision, updatedAt, deletedAt? }>`

Notes:

- Exclude `data` for list performance.
- Include deleted/tombstoned items only if the client requests them (optional query param like `?includeDeleted=1`).

### `GET /api/projects/:id`

- Response: `{ id, name, data, revision, updatedAt, deletedAt? }`
- Must 404 if the project does not exist *for that user*.

### `PUT /api/projects/:id` (upsert with optimistic concurrency)

Request body:

- `name: string`
- `data: unknown` (project payload)
- `baseRevision: number` (client’s last synced server revision for this project, or `0`)
- `clientUpdatedAt?: string` (optional ISO string for debugging/telemetry)

Success response:

- `200`: `{ id, revision, updatedAt }`

Conflict response:

- `409`: `{ server: { id, name, data, revision, updatedAt, deletedAt? } }`

Server rules:

- If `baseRevision === currentRevision` (or project is new and `baseRevision === 0`), accept the write:
  - set `data`, `name`, `updatedAt = now`, increment `revision`
  - clear `deletedAt` if previously deleted and this PUT is treated as “restore” (optional; see deletion rules)
- Else return `409` with the current server copy.

### `DELETE /api/projects/:id` (tombstone)

Request body (optional but recommended):

- `baseRevision: number`

Behavior:

- Mark `deletedAt = now`, increment `revision`, update `updatedAt`.
- If `baseRevision` mismatches, return `409` with server copy.

## Conflict handling (v1)

v1 chooses a deterministic policy so sync can be automatic:

- **Default v1 policy**: client-wins last-write-wins *only when the user is actively editing on this device*.
  - If a `PUT` gets `409`, the client immediately re-sends with `baseRevision = server.revision` (overwriting server).
  - This is simple but can overwrite edits from another device.

Alternative v1 policy (safer for multi-device):

- **Server-wins** for background sync:
  - If `409`, the client replaces local copy with server copy *unless* there are unsynced local edits, in which case it surfaces a “Resolve conflict” UI.

Pick one policy per project type and document it in code. If undecided, ship **server-wins in background** + “Resolve” prompt.

## Client-side sync state (IndexedDB)

Store sync metadata in IndexedDB (either within `appState` or a dedicated store):

- `lastSyncedRevisionByProjectId: Record<string, number>`
- `syncQueue: Array<{ projectId: string; enqueuedAt: number }>` (deduped by projectId)
- `syncErrorsByProjectId?: Record<string, { message: string; at: number }>`

### When to enqueue

After any local project save “commit” (not per pointer move):

- enqueue `projectId`
- schedule a background processor (debounced)

### When to sync

- on enqueue (debounced)
- on `online` event
- on tab visible (optional)
- on sign-in (run “claim local projects”)

## Merge behavior: server list vs local list

On app load (when signed in):

1. Fetch `GET /api/projects` list.
2. Combine with local projects list (IndexedDB).
3. For each project id:
   - If local has unsynced edits (in queue): keep local as active; attempt push.
   - Else if server `revision` > `lastSyncedRevision`: pull server and replace local payload.
   - Else keep local.

For projects that exist only on server:

- Pull on-demand (when user clicks) or eagerly in background (limit concurrency).

For projects deleted on server:

- If server has `deletedAt` and local has no unsynced edits: tombstone/delete locally.

## Media handling (v1)

Project `data` should reference media using existing local mechanisms (OPFS paths, IndexedDB thumbnails).

Cross-device media is out of scope; when loading a project on a new device, missing media should degrade gracefully:

- show placeholders for missing assets
- allow user to replace media

## Security & abuse considerations

- Require session on all project routes; scope all queries by `session.user.id`.
- Validate `id` param and size-limit `data` payload to avoid giant JSON writes.
- Consider basic rate limiting (per user) on PUT/DELETE in production.

## Deliverables (implementation checklist)

- Drizzle schema for `projects` referencing Better Auth `user.id`
- Migrations runbook (generate + apply) for local and prod
- Route handlers:
  - `GET /api/projects`
  - `GET /api/projects/:id`
  - `PUT /api/projects/:id` with `baseRevision`
  - `DELETE /api/projects/:id` tombstone
- Client sync queue:
  - enqueue on local commit
  - background processor w/ retry/backoff
  - conflict handling policy implemented
- “Claim local projects” on sign-in
- UI status surface: “Saved locally / Syncing / Synced / Sync error”

