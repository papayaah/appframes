# Persistence migration to Web Worker

## Why this spec exists

Persistence today runs on the **main thread**: IndexedDB (via `idb`) is called from `lib/PersistenceDB.ts`, and all save/load/sync-state operations run in the same thread as the UI. Debouncing and async I/O already keep the app responsive, but moving persistence into a **Web Worker** gives:

- **Guaranteed isolation**: Serialization and IndexedDB reads/writes never run on the main thread, so they cannot cause jank during drag, pan, or rapid edits.
- **Right tool for the job**: Web Workers are designed for exactly this kind of background work.
- **Future-proofing**: As projects grow (more screens, larger payloads), the main thread stays free.

This spec defines how to migrate the current persistence layer into a worker while keeping the same public API and behavior. It assumes the existing architecture from `specs/offline-first-persistence.md` and `specs/cross-device-project-sync.md` (IndexedDB + sync queue + Postgres mirror).

## Goals

- **All IndexedDB access** (projects, appState, syncState) runs **inside a single Web Worker**.
- **Main thread** only sends commands and receives results via `postMessage`; no direct `openDB` / `idb` calls on the main thread.
- **Public API unchanged**: `FramesContext`, `ProjectSyncService`, `WelcomeModal`, and `AppFrames` keep calling the same logical operations (save project, load project, etc.); the implementation becomes a thin client that talks to the worker.
- **No change in UX**: Debouncing, save status, sync queue, and error handling behave the same; only the execution context moves.
- **Graceful fallback**: If the worker fails to load or is unsupported, fall back to main-thread persistence (optional v1 requirement; can be phase 2).

## Async and debounce (still required)

The worker **does not replace** async or debounce; both stay in place.

- **Async**: The client API remains **Promise-based**. Every call (e.g. `saveProject`, `loadProject`) sends a message to the worker and returns a Promise that resolves when the worker replies. Callers still `await`; the work simply runs in the worker instead of the main thread.
- **Debounce**: We still **debounce** save triggers (e.g. 500ms after the last change) so rapid edits don’t flood the worker with messages or IndexedDB with writes. `usePersistence` and the existing debounce logic stay as-is; they just call the client instead of the current PersistenceDB.

So: **async** = how we talk to the worker and avoid blocking the main thread. **Debounce** = how we batch rapid changes into fewer saves. Both remain part of the design.

## Non-goals (v1)

- Moving **media files** (OPFS / `mediaFiles` store) into the worker. Media is used by `@reactkits.dev/react-media-library` and may stay on the main thread for v1; can be a follow-up.
- **SharedWorker** or **multiple workers**; a single dedicated persistence worker is enough.
- Changing the **sync protocol** or server API; `ProjectSyncService` still runs on the main thread and requests data from the worker when it needs to push/pull.

## Current architecture (pre-migration)

- **`lib/PersistenceDB.ts`**: Singleton class using `idb`’s `openDB`. Methods: `init`, `createProject`, `saveProject`, `loadProject`, `getAllProjects`, `deleteProject`, `renameProject`, `saveAppState`, `loadAppState`, `getSyncState`, `saveSyncState`, `enqueueSyncProject`, `dequeueSyncProject`, `updateSyncedRevision`, `getSyncedRevision`, `setSyncError`, `clearSyncError`. Media methods (`getMediaFile`, `getAllMediaFiles`, `addMediaFile`, `deleteMediaFile`) are used by the app and optionally stay main-thread in v1.
- **`hooks/usePersistence.ts`**: Debounces save calls and reports status (`idle` / `saving` / `saved` / `error`). Calls into `PersistenceDB` (or, after migration, the worker client).
- **`lib/ProjectSyncService.ts`**: Uses `persistenceDB` to load projects, read/write sync state, and enqueue/dequeue. Runs on the main thread; after migration it will request data from the worker via the same client API.
- **Call sites**: `FramesContext` (load/save project, app state, sync enqueue); `WelcomeModal` (load/save app state); `AppFrames` (init).

## Target architecture

### Worker (new)

- **Entry**: A single worker script (e.g. `lib/persistence.worker.ts` or `workers/persistence.ts`) bundled so it can be loaded with `new Worker(url)`.
- **Responsibilities**:
  - Open and hold the IndexedDB connection (`idb` / `openDB`) inside the worker.
  - Handle messages from the main thread: each message is a **command** with a unique `id`, a `type`, and a `payload`.
  - Run the **same logic** as today’s `PersistenceDB` (projects, appState, syncState): create/save/load/delete/rename project, save/load app state, get/save sync state, enqueue/dequeue, update/get synced revision, set/clear sync error.
  - Post back a **response** message: `{ id, type: 'result' | 'error', result?: T, error?: string }`.
- **No DOM**: Worker must not use `window`, `document`, or React; only IndexedDB and message passing.
- **Structured clone**: All payloads and results must be **structured-cloneable** (plain objects, arrays, primitives; no functions or class instances). Dates can be serialized as ISO strings and rehydrated on the main thread if needed.

### Main-thread client (new)

- **`lib/PersistenceClient.ts`** (or keep the name `PersistenceDB` as a facade): Exposes the **same async method signatures** as the current `PersistenceDB` (e.g. `saveProject(project)`, `loadProject(id)`, etc.).
- **Implementation**: Each method builds a command `{ id, type, payload }`, sends it to the worker with `worker.postMessage(...)`, and returns a **Promise** that resolves when the matching response message is received (use a `Map<id, { resolve, reject }>`).
- **Worker lifecycle**: Create the worker once (e.g. on first use or at app init); if worker fails to load, optionally fall back to main-thread persistence (see Fallback below).
- **Initialization**: The client sends an `init` command; the worker opens IndexedDB and replies when ready. Callers (e.g. `AppFrames`, `FramesContext`) still call something like `persistenceDB.init()` which now means “ensure worker is ready.”

### Sync service

- **`ProjectSyncService`** continues to run on the main thread.
- It no longer imports `persistenceDB` from `PersistenceDB.ts`; it uses the **same client** (`PersistenceClient`) that talks to the worker.
- All methods it uses (`loadProject`, `getSyncState`, `enqueueSyncProject`, `saveProject`, `updateSyncedRevision`, etc.) are async and now resolve when the worker finishes the operation. No change in sync logic; only the source of data is the worker.

### Debouncing and status

- **`usePersistence`** and **`FramesContext`** keep calling the same API (e.g. `persistenceDB.saveProject(...)`). They still debounce and set save status; the only difference is that the underlying call goes to the client, which posts to the worker and awaits the response. No UX change.

## Before / after code example

### Before (main thread only)

**Caller (FramesContext)** — unchanged in the after; we keep this exact call:

```ts
debouncedSave(async () => {
  await persistenceDB.saveProject({
    id: currentProjectId,
    name: doc.name,
    screensByCanvasSize: doc.screensByCanvasSize,
    // ...
  });
  syncProject(currentProjectId);
});
```

**PersistenceDB (main thread)** — runs IndexedDB on the same thread as the UI:

```ts
// lib/PersistenceDB.ts (current)
async saveProject(project: Project): Promise<void> {
  if (!this.db) await this.init();
  await this.db!.put('projects', {
    ...project,
    updatedAt: new Date(),
    lastAccessedAt: new Date(),
  });
}
```

The `await this.db!.put(...)` runs on the **main thread**. Serialization and the actual disk write can cause small pauses.

---

### After (worker + client)

**Caller (FramesContext)** — identical; no code change:

```ts
debouncedSave(async () => {
  await persistenceDB.saveProject({
    id: currentProjectId,
    name: doc.name,
    screensByCanvasSize: doc.screensByCanvasSize,
    // ...
  });
  syncProject(currentProjectId);
});
```

**PersistenceClient (main thread)** — thin wrapper that posts to the worker and returns a Promise:

```ts
// lib/PersistenceClient.ts (new)
async saveProject(project: Project): Promise<void> {
  return this.send('saveProject', { project });
}

private send<T>(type: string, payload: object): Promise<T> {
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    this.pending.set(id, { resolve, reject });
    this.worker.postMessage({ id, type, payload });
  });
}
// When worker replies: this.pending.get(id).resolve(msg.result); this.pending.delete(id);
```

**Worker (persistence.worker.ts)** — runs IndexedDB in a separate thread:

```ts
// lib/persistence.worker.ts (new)
import { openDB } from 'idb';

let db: IDBPDatabase<...> | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;
  try {
    if (type === 'init') {
      db = await openDB('AppFrames', 2, { ... });
      self.postMessage({ id, type: 'result', result: undefined });
      return;
    }
    if (type === 'saveProject') {
      if (!db) await init();
      await db.put('projects', {
        ...payload.project,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      });
      self.postMessage({ id, type: 'result', result: undefined });
      return;
    }
    // ... loadProject, getAllProjects, etc.
  } catch (err) {
    self.postMessage({ id, type: 'error', error: String(err) });
  }
};
```

The `await db.put(...)` now runs **in the worker**. The main thread only sends a message and waits on a Promise; it never blocks on IndexedDB.

---

**Summary**: The caller stays the same. The “before” implementation does the work on the main thread; the “after” implementation splits into a client (postMessage + Promise) and a worker (same IndexedDB logic, different thread).

## Message protocol (worker ↔ main thread)

### Command (main → worker)

Every command is an object:

- **`id`**: string (e.g. UUID or nanoid) so the main thread can match the response.
- **`type`**: string, e.g. `init`, `createProject`, `saveProject`, `loadProject`, `getAllProjects`, `deleteProject`, `renameProject`, `saveAppState`, `loadAppState`, `getSyncState`, `saveSyncState`, `enqueueSyncProject`, `dequeueSyncProject`, `updateSyncedRevision`, `getSyncedRevision`, `setSyncError`, `clearSyncError`.
- **`payload`**: object with the parameters for that operation (e.g. `{ project }` for `saveProject`, `{ id }` for `loadProject`).

Example:

```ts
{ id: "req-1", type: "saveProject", payload: { project: { id: "...", name: "...", ... } } }
```

### Response (worker → main thread)

- **`id`**: same as the command.
- **`type`**: `"result"` | `"error"`.
- **`result`**: for `result`, the return value (structured-cloneable; e.g. project object, array of projects, or `undefined` for void operations).
- **`error`**: for `error`, an error message string (and optionally a code if we want).

Example:

```ts
{ id: "req-1", type: "result", result: undefined }
{ id: "req-2", type: "result", result: { id: "...", name: "My Project", ... } }
{ id: "req-3", type: "error", error: "QUOTA_EXCEEDED" }
```

### Serialization

- **Dates**: PersistenceDB currently uses `Date` in memory. In the worker, store as-is in IndexedDB (IDB supports Date). When sending results to the main thread, serialize dates as ISO strings and document that the client may rehydrate them to `Date` if the rest of the app expects `Date`.
- **No functions or class instances** in any payload or result; only data that `structuredClone` supports (or equivalent).

## Browser support

- **Web Workers**: Supported in all modern desktop and mobile browsers (iOS Safari, Chrome Android, etc.).
- **IndexedDB in workers**: Supported in Chrome, Firefox, Edge, Safari 15.2+ (iOS 15.2+). For older Safari, the spec allows a fallback to main-thread persistence (see Fallback).
- Document the minimum versions in the implementation (e.g. “IndexedDB in worker requires Safari 15.2+”).

## Fallback (optional v1)

- **Detection**: If `typeof Worker === 'undefined'` or the worker script fails to load (e.g. `worker.onerror`), or if we want to support older Safari, switch to a **main-thread** implementation of the same API (current `PersistenceDB` logic).
- **Single API**: The app always imports one facade (e.g. `persistenceDB` from `PersistenceClient.ts`). That facade either uses the worker or the main-thread implementation; callers do not care.
- **Phase 2**: If we ship v1 without fallback, we can add it later when we have a concrete support matrix.

## Media files (v1 scope)

- **Option A**: Leave **media files** (getMediaFile, getAllMediaFiles, addMediaFile, deleteMediaFile) on the main thread: keep a small, separate “main-thread PersistenceDB” that only does media, or keep media in the current PersistenceDB and only move projects/appState/syncState to the worker. The worker then only handles projects, appState, and syncState; the client facade can delegate media to the existing main-thread code.
- **Option B**: Move media into the same worker so **all** IndexedDB is in the worker. Simpler mental model but requires ensuring media library callers use the async client.

Recommendation: **Option A** for v1 (worker = projects + appState + syncState only); migrate media in a follow-up if desired.

## Implementation checklist

- [ ] **Worker bundle**: Add a worker entry (e.g. `lib/persistence.worker.ts`) that (1) opens IndexedDB with the same schema as current PersistenceDB, (2) listens for messages, (3) implements handlers for each command type by calling the same logic as current PersistenceDB (can move the core logic into a shared module or duplicate in worker). Build step must emit a separate worker bundle (e.g. `public/persistence.worker.js` or Next.js static file) and ensure the main app can instantiate `new Worker(url)`.
- [ ] **PersistenceClient (main thread)**: New module that (1) creates the worker, (2) maintains a request-id → Promise resolver map, (3) exposes `init()`, `saveProject`, `loadProject`, … with the same signatures as current PersistenceDB, (4) sends commands and resolves/rejects on response. Handle worker errors and optional fallback.
- [ ] **Replace singleton**: Replace `persistenceDB` export from `PersistenceDB.ts` with the new client (or re-export the client as `persistenceDB` from `PersistenceClient.ts`). Remove or refactor old `PersistenceDB.ts` so that its core logic lives either in the worker or in a shared module used by both worker and fallback.
- [ ] **ProjectSyncService**: Ensure it uses only the new client; no direct `openDB` on main thread.
- [ ] **FramesContext / WelcomeModal / AppFrames**: No API changes; they keep calling `persistenceDB.init()`, `persistenceDB.saveProject(...)`, etc. Verify debounce and save status still work.
- [ ] **Dates**: Document and implement date serialization for worker → main thread (e.g. ISO string in responses, rehydrate in client if needed).
- [ ] **Tests**: Update unit tests. Mock the worker (e.g. replace the client’s worker with a mock that responds to commands) so that FramesContext and ProjectSyncService tests don’t need a real worker. Optionally add a small integration test that runs the worker in a test environment if possible.
- [ ] **Fallback (optional)**: Implement main-thread fallback when worker is unavailable and wire it behind the same facade.

## Deliverables

- Worker script that owns IndexedDB (projects, appState, syncState) and responds to the command protocol.
- Main-thread PersistenceClient that exposes the same API as current PersistenceDB and communicates with the worker.
- All existing call sites using the client; no regression in save/sync behavior or UX.
- Optional: fallback to main-thread persistence when the worker is not available.
- Short note in README or docs on browser support (Web Worker + IndexedDB in worker).

## References

- `specs/offline-first-persistence.md` — overall offline-first and sync model.
- `specs/cross-device-project-sync.md` — sync API and conflict behavior.
- `lib/PersistenceDB.ts` — current implementation to migrate.
- `lib/ProjectSyncService.ts` — consumer of persistence; must use client.
- `hooks/usePersistence.ts` — debounce and status; no change except underlying persistence is via client.
