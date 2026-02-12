# Project Export & Import

## Overview

Export a complete project as a self-contained `.appframes` file (ZIP archive) that includes all screens, settings, text elements, shared backgrounds, and media files. Another user can import this file to fully recreate the project on their machine — no account or cloud sync required.

## Motivation

- Share complete projects with teammates or clients
- Back up projects locally with all assets included
- Move projects between machines without an account
- Distribute templates with real content pre-loaded

---

## File Format

### `.appframes` Archive (ZIP)

```
my-project.appframes
  manifest.json         # Project metadata + version
  project.json          # Full project data (screens, settings, text, effects)
  media/
    <uuid>.jpg          # Referenced media files (original quality)
    <uuid>.png
    ...
```

### manifest.json

```json
{
  "version": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-02-12T10:30:00Z",
  "projectName": "My App Screenshots",
  "screenCount": 12,
  "mediaCount": 8,
  "totalSize": 45000000
}
```

### project.json

The full `Project` object with media references rewritten:

```json
{
  "name": "My App Screenshots",
  "screensByCanvasSize": {
    "iphone-6.5": [
      {
        "id": "screen-abc",
        "name": "Home Screen",
        "images": [
          {
            "diyOptions": { ... },
            "mediaRef": "a1b2c3d4.jpg",
            "panX": 50,
            "panY": 50,
            "frameScale": 100,
            "tiltX": 5,
            "frameColor": "#1a1a1a",
            "frameEffects": { ... }
          }
        ],
        "settings": { ... },
        "textElements": [ ... ]
      }
    ]
  },
  "sharedBackgrounds": {
    "iphone-6.5": {
      "screenIds": ["screen-abc", "screen-def"],
      "type": "image",
      "mediaRef": "e5f6g7h8.jpg",
      "imageFit": "fill"
    }
  }
}
```

**Key transformation:** `mediaId` (local IndexedDB ID) and `serverMediaPath` are replaced with `mediaRef` — a filename pointing to a file in the `media/` directory. This makes the archive fully self-contained and portable.

---

## Architecture: Server-Side

Since we deploy to a dedicated Ubuntu server and the sync system already uploads media files there, export and import run server-side. This avoids client-side ZIP libraries, handles large files via streaming, and leverages media already on disk.

### npm packages

- **`archiver`** — streaming ZIP creation (export)
- **`yauzl`** — reliable ZIP extraction (import)

---

## Export Flow (Server-Side)

### Client triggers export

1. Client ensures project is synced (calls `syncAll()` so all media is on the server)
2. Client calls `GET /api/projects/:id/export`
3. Server streams back the `.appframes` ZIP file
4. Browser triggers download of `<project-name>.appframes`

### Server builds the archive

#### Step 1: Load project data

Read the project from the database by ID. This includes `screensByCanvasSize`, `sharedBackgrounds`, `name`, etc.

#### Step 2: Collect & deduplicate media

Walk all `ScreenImage` entries, `SharedBackground` entries, and `canvasBackgroundMediaId` values across all canvas sizes. For each `serverMediaPath`:

1. Resolve to the file on disk (media upload directory)
2. Generate a stable `mediaRef` filename: `<uuid>.<ext>`
3. Deduplicate — same `serverMediaPath` across frames/screens = one file in the archive

#### Step 3: Rewrite media references

Deep-clone the project data. For each `ScreenImage`:
- Replace `mediaId` + `serverMediaPath` + `image` (base64) with `mediaRef: "<filename>"`
- Strip `cleared` slots (omit empty frames)

For `SharedBackground` with `mediaId`:
- Replace with `mediaRef`

For `CanvasSettings` with `canvasBackgroundMediaId`:
- Replace with `canvasBackgroundMediaRef`

#### Step 4: Strip transient state

Remove from the export:
- `id` (will be regenerated on import)
- `pristine`, `createdAt`, `updatedAt`, `lastAccessedAt`
- `selectedScreenIndices`, `primarySelectedIndex`, `selectedFrameIndex`
- `zoom`
- Per-screen `selectedTextId`

These are session/device state, not project content.

#### Step 5: Stream ZIP response

Using `archiver`:

1. Set response headers: `Content-Type: application/zip`, `Content-Disposition: attachment; filename="<name>.appframes"`
2. Pipe `archiver` to the response stream
3. Append `manifest.json` (buffer)
4. Append `project.json` (buffer)
5. Append each media file as `media/<ref>` (streamed from disk — no full file in memory)
6. Finalize the archive

```ts
const archive = archiver('zip', { zlib: { level: 6 } });
archive.pipe(res);
archive.append(JSON.stringify(manifest), { name: 'manifest.json' });
archive.append(JSON.stringify(projectData), { name: 'project.json' });
for (const [ref, filePath] of mediaFiles) {
  archive.file(filePath, { name: `media/${ref}` });
}
await archive.finalize();
```

---

## Import Flow (Server-Side)

### Client uploads the file

1. User selects/drops a `.appframes` file
2. Client uploads to `POST /api/projects/import` (multipart form data)
3. Server processes the archive, creates the project
4. Server returns the new project ID
5. Client pulls the project via normal sync and opens it

### Server processes the archive

#### Step 1: Extract & validate

Using `yauzl`:

1. Open the uploaded ZIP file
2. Read `manifest.json` — validate `version` compatibility
3. Read `project.json` — validate schema structure
4. List `media/` entries

#### Step 2: Save media files to disk

For each file in `media/`:
1. Stream from ZIP entry to the media upload directory on disk
2. Generate a `serverMediaPath` (e.g., `<userId>/<timestamp>-<originalName>`)
3. Record the mapping: `mediaRef → serverMediaPath`

#### Step 3: Rewrite media references

Walk the project data and replace every `mediaRef` with the new `serverMediaPath`.

#### Step 4: Create project in database

1. Generate a new project `id` (UUID)
2. Preserve all `screen.id` values (critical for shared background `screenIds` references)
3. Preserve `textElement.id` values
4. Set `pristine: false`
5. Set timestamps to now
6. Assign to the importing user
7. Save to the database

#### Step 5: Respond with project ID

Return `{ projectId: "<new-id>" }` so the client can switch to it.

---

## API Endpoints

### `GET /api/projects/:id/export`

**Auth:** Required (must own the project)

**Response:** Streamed ZIP file with headers:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="My Project.appframes"
```

**Errors:**
- `404` — Project not found
- `403` — Not the project owner
- `500` — Media file missing on disk (partial export still succeeds, logs warning)

### `POST /api/projects/import`

**Auth:** Required

**Body:** `multipart/form-data` with single file field `archive`

**Response:**
```json
{
  "projectId": "new-uuid",
  "projectName": "My App Screenshots",
  "screenCount": 12,
  "mediaImported": 8
}
```

**Errors:**
- `400` — Invalid archive (bad ZIP, missing manifest/project.json, unsupported version)
- `413` — File too large (configurable limit, e.g., 500MB)
- `500` — Server error during extraction

---

## UI

### Export

- **Location:** Project menu / header (next to project name)
- **Trigger:** "Export Project" button or menu item
- **Flow:** Sync first (show brief "Syncing..." if needed) → trigger download
- **Feedback:** Show "Exporting..." state on button, then browser download begins

### Import

- **Location:** Project switcher / welcome screen
- **Trigger:** "Import Project" button
- **Input:** File picker (accept `.appframes`) or drag-and-drop
- **Progress:** Upload progress bar (the heavy work is server-side, so this is the main wait)
- **Confirmation:** Show summary after import (name, screen count, media count)
- **Conflict:** If project name already exists, auto-append "(Imported)" suffix

---

## Edge Cases

### Unsynced media
- If a project has media only in OPFS (never synced), the client must sync before export
- Show "Syncing project..." step before triggering export download
- Alternatively: upload unsynced media as part of the export request

### Large projects
- Media files can be large (50MB+ for high-res screenshots)
- Server uses streaming (archiver pipes directly to response, files stream from disk)
- No full archive held in memory
- Import: uploaded file is streamed to a temp file, then extracted

### Missing media on server
- If a `serverMediaPath` can't be found on disk (deleted/corrupted), skip it
- Log a warning, include a `warnings` array in manifest
- Frame renders as empty on import — not a fatal error

### Version compatibility
- `manifest.version` allows future format changes
- If importing a newer version than the server supports, return `400` with message
- Older versions should always be importable (forward compatibility)

### Duplicate imports
- Importing the same file twice creates a separate project (new ID, new media copies)

### Canvas background images
- `canvasBackgroundMediaId` in screen settings must also be resolved and included

---

## Security

- Validate ZIP contents: no path traversal (`../`), reasonable file sizes, expected file types
- Sanitize project name for filesystem use
- Validate JSON structure matches expected schema before creating project
- Rate-limit import endpoint to prevent abuse
- Max file size limit on upload (configurable, default 500MB)

---

## Data Mapping Reference

| Source (local) | Export format | Import (server) |
|---|---|---|
| `ScreenImage.mediaId` | `mediaRef: "file.jpg"` | New `serverMediaPath` on disk |
| `ScreenImage.serverMediaPath` | Stripped | New `serverMediaPath` |
| `ScreenImage.image` (base64) | Stripped | Empty |
| `SharedBackground.mediaId` | `mediaRef: "file.jpg"` | New `serverMediaPath` |
| `CanvasSettings.canvasBackgroundMediaId` | `canvasBackgroundMediaRef` | New `serverMediaPath` |
| `Project.id` | Stripped | New UUID |
| `Screen.id` | Preserved | Preserved (shared BG refs) |
| `TextElement.id` | Preserved | Preserved |

---

## Implementation Priority

### Phase 1: Export
1. Add `GET /api/projects/:id/export` endpoint
2. Collect project data + resolve media files on disk
3. Stream ZIP response using `archiver`
4. Client: "Export Project" button → sync → trigger download

### Phase 2: Import
1. Add `POST /api/projects/import` endpoint
2. Extract ZIP using `yauzl`, save media to disk
3. Rewrite `mediaRef` → `serverMediaPath`, create project
4. Client: "Import Project" button → upload → pull and open

### Phase 3: Polish
1. Upload progress bar
2. Import confirmation dialog with summary
3. Drag-and-drop import support
4. Error handling UI for invalid/corrupted archives
