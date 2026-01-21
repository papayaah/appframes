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

### Better Auth tables (from `@reactkits.dev/better-auth-connect`)

The app uses Better Auth's standard tables (defined in `packages/better-auth-connect/src/server/drizzle/schema.ts`):

- `user` (singular)
  - `id` (text, primary key)
  - `name`, `email`, `image`
  - `emailVerified` (boolean)
  - `createdAt`, `updatedAt` (timestamps)

- `account` — OAuth provider accounts linked to users
- `session` — user sessions
- `verification` — verification tokens

**Important**: Do **not** create a separate `users` table. Use Better Auth's `user` table and reference `user.id` from app tables.

### App-specific tables (v1 sync)

- `projects`
  - `id` (uuid) — same as local `Project.id`
  - `userId` (text, fk → `user.id`)
  - `name` (text)
  - `data` (jsonb) — the full project payload (screensByCanvasSize, selections, zoom, etc.)
  - `revision` (bigint) — increments on each accepted write
  - `deletedAt` (timestamp, nullable) — tombstone for deletion
  - `createdAt`, `updatedAt` (timestamps)

**Why jsonb first?**
- Fast to ship and iterate while the client model is still evolving.
- We can later normalize to `screens`, `frames`, `textElements` if needed.

### Media

**Current state**: Media files are stored locally via **OPFS/IndexedDB** in `packages/media-library`:
- **Metadata** (asset records): IndexedDB (`MediaLibrary` database)
- **File blobs**: OPFS (Origin Private File System)

**For cross-device sync**, we'll use a hybrid local + cloud approach:
- **Local**: Keep OPFS/IndexedDB for fast offline access (authoritative for UX)
- **Cloud**: Store originals in object storage (S3/R2) and references in Postgres

#### Media Asset Data Model

```typescript
// Client-side (packages/media-library/src/types.ts)
export interface MediaAsset {
    // Local-only fields (for offline support)
    id?: number; // Local IndexedDB ID (temporary until synced)
    
    // Cloud fields (synced)
    cloudId?: string; // UUID from backend (primary key in cloud)
    userId?: string; // User who owns this asset
    
    // File storage
    handleName: string; // OPFS filename (local cache)
    cloudUrl?: string; // CDN/object storage URL (if synced)
    
    // Metadata
    fileName: string;
    fileType: MediaType; // 'image' | 'video' | 'audio' | 'document' | 'other'
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    
    // Timestamps
    createdAt: number; // Local creation time
    updatedAt: number; // Last modification time
    syncedAt?: number; // Last successful sync timestamp
    cloudCreatedAt?: string; // ISO timestamp from backend
    
    // Sync state
    syncStatus?: 'pending' | 'syncing' | 'synced' | 'error';
    syncError?: string;
}
```

#### Server-side Schema

```prisma
// Conceptual schema (actual implementation uses Drizzle)
model MediaAsset {
  id          String   @id @default(uuid())
  userId      String   // FK to Better Auth user.id (text)
  fileName    String
  fileType    String   // 'image' | 'video' | 'audio' | etc.
  mimeType    String
  size        Int
  width       Int?
  height      Int?
  url         String   // S3/R2 URL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // References Better Auth's user table (not a separate users table)
  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}
```

**Note**: The `User` model here refers to Better Auth's `user` table from `@reactkits.dev/better-auth-connect`. In Drizzle, this would be:
```typescript
userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
```

#### Media Sync Service

The `packages/media-library` package will provide a `MediaSyncService` class that handles:
- **Upload**: Upload new assets to S3/R2 and save metadata to Postgres
- **Download**: Pull cloud assets to local OPFS/IndexedDB
- **Background sync**: Auto-sync pending assets in background
- **Conflict resolution**: Last-write-wins (v1)

See implementation details in the "Media Sync Implementation" section below.

## API layer (Next.js App Router)

We’ll add Route Handlers under `app/api/*`:

- `GET/POST /api/auth/[...all]` (Better Auth handler via `toNextJsHandler(auth)`)
- Optional: `GET/DELETE /api/auth/{provider}/accounts` routes if we use `better-auth-connect`’s UI components that need to query connection status
- `GET /api/projects` — list user projects (id, name, updatedAt)
- `GET /api/projects/:id` — fetch full project
- `PUT /api/projects/:id` — upsert project with optimistic concurrency
- `POST /api/sync` (optional convenience endpoint) — batch push/pull

**Media endpoints**:
- `POST /api/media/assets` — upload new media asset (multipart form)
- `GET /api/media/assets` — list user's media assets
- `GET /api/media/assets/:id` — fetch asset metadata
- `DELETE /api/media/assets/:id` — delete asset (from S3 + Postgres)

### File upload flow (media assets)

**Upload process**:

1. **Client uploads to Next.js API** (`POST /api/media/assets`):
   - Request: `multipart/form-data` with:
     - `file`: The actual file (File/Blob)
     - `fileName`: Original filename
     - `fileType`: Media type ('image', 'video', etc.)
     - `mimeType`: MIME type
     - Optional: `width`, `height` (if image)
   
2. **Server processes upload**:
   - Validates file size (enforce max limit, e.g., 10MB for images, 100MB for videos)
   - Validates MIME type (whitelist allowed types)
   - Generates unique filename: `${userId}/${uuid()}-${sanitizedOriginalName}`
   - Uploads file to S3/R2 bucket
   - Saves metadata to Postgres `MediaAsset` table
   - Returns: `{ id, cloudId, cloudUrl, ...metadata }`

3. **File organization in bucket**:
   - Structure: `{userId}/{assetId}-{originalFileName}`
   - Example: `user_abc123/550e8400-e29b-41d4-a716-446655440000-screenshot.png`
   - Benefits: Easy to list/delete by user, unique filenames prevent collisions

4. **Alternative: Direct S3 upload (future optimization)**:
   - Server generates presigned POST URL for client
   - Client uploads directly to S3 (bypasses Next.js server)
   - Client notifies server on completion
   - Server saves metadata to Postgres
   - Benefits: Reduces server load, faster uploads for large files

**Download process**:
- `GET /api/media/assets/:id` returns metadata with `cloudUrl`
- For private buckets: Server generates signed/expiring URL (valid for 1 hour)
- Client downloads file and caches in OPFS

**Request/Response format**:

```typescript
// POST /api/media/assets
// Request: multipart/form-data
{
  file: File,
  fileName: string,
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other',
  mimeType: string,
  width?: number,  // if image
  height?: number  // if image
}

// Response: 201 Created
{
  id: string,           // UUID (cloudId)
  userId: string,
  fileName: string,
  fileType: string,
  mimeType: string,
  size: number,
  width?: number,
  height?: number,
  cloudUrl: string,     // S3/R2 URL (or signed URL if private)
  createdAt: string,    // ISO timestamp
  updatedAt: string
}

// Error responses:
// 400 Bad Request - Invalid file type/size
// 401 Unauthorized - No session
// 413 Payload Too Large - File exceeds limit
// 500 Internal Server Error - Upload failed
```

**Error handling**:
- File size validation: Reject files exceeding limits (configurable per type)
- MIME type validation: Whitelist allowed types (images: jpeg, png, webp, gif; videos: mp4, webm)
- Retry logic: Client should retry failed uploads (exponential backoff)
- Partial uploads: For large files, consider chunked uploads (future enhancement)

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


### Media Sync Implementation

**Phase 1: Add Cloud Fields (Non-Breaking)**
- Add optional `cloudId`, `cloudUrl`, `syncStatus` fields to `MediaAsset` type in `packages/media-library`
- Existing local-only assets continue to work
- New uploads can optionally sync

**Phase 2: Sync Service & Backend**
- Create `packages/media-library/src/services/sync.ts` with `MediaSyncService` class
- Add media API routes (`app/api/media/assets/*`)
- Set up S3/R2 bucket and credentials
- Add `MediaAsset` table to Postgres schema

**Phase 3: Background Sync**
- Update `useMediaLibrary` hook to accept optional `syncConfig`
- Enable auto-sync for new uploads (background, non-blocking)
- Existing assets remain local-only until manually synced

**Phase 4: Pull on Login**
- On app load/login, pull cloud assets via `MediaSyncService.pullCloudAssets()`
- Merge with local assets (dedupe by `cloudId`)
- Show sync status in UI (pending/syncing/synced/error badges)

**Phase 5: Full Sync**
- Sync deletions
- Conflict resolution UI (v1: last-write-wins)
- Manual sync trigger button

#### Media Sync Service API

```typescript
// packages/media-library/src/services/sync.ts

export class MediaSyncService {
    async uploadAsset(asset: MediaAsset, file: File): Promise<MediaAsset>
    async fetchAssetMetadata(cloudId: string): Promise<MediaAsset>
    async downloadAssetFile(cloudUrl: string): Promise<File>
    async deleteAsset(cloudId: string): Promise<void>
    async syncPendingAssets(...): Promise<void> // Background sync
    async pullCloudAssets(...): Promise<void> // Pull on login
}
```

#### Media Sync Configuration

```typescript
// Consumer app provides sync config
const syncConfig: MediaSyncConfig = {
    apiBaseUrl: '/api',
    getUserId: async () => session?.user?.id || null,
    getAuthToken: async () => session?.token || null,
    autoSync: true,
    syncInterval: 30000, // 30 seconds
};

<MediaLibraryProvider syncConfig={syncConfig} ...>
```

#### Environment Variables

```env
# Object Storage (S3/R2)
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Or for Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

#### Security

- All media API routes require Better Auth session
- Users can only access their own assets (`WHERE userId = session.user.id`)
- File URLs: Use signed/expiring URLs for S3 access
- Rate limiting: Prevent abuse of upload endpoints
- File size limits: Enforce max file size on backend
