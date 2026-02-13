/**
 * Project Archive (.appframes) — shared types and utilities for export/import
 *
 * The .appframes format is a ZIP archive containing:
 *   manifest.json   — metadata + version + media file list
 *   project.json    — full project data with media references rewritten
 *   media/          — referenced media files (original quality)
 */

// ---------------------------------------------------------------------------
// Archive format constants
// ---------------------------------------------------------------------------

export const ARCHIVE_FORMAT_VERSION = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArchiveManifest {
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  projectName: string;
  mediaFiles: ArchiveMediaEntry[];
  warnings?: string[];
}

export interface ArchiveMediaEntry {
  mediaRef: string;       // Filename in media/ directory of archive
  originalPath: string;   // The serverMediaPath that was replaced
}

// ---------------------------------------------------------------------------
// Sanitise a filename into a safe archive filename
// ---------------------------------------------------------------------------

export function sanitizeFilename(name: string): string {
  // Take just the filename portion (after the last /)
  const parts = name.split('/');
  const filename = parts[parts.length - 1] || 'file';
  // Strip non-alphanumeric chars except dots, hyphens, underscores
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

// ---------------------------------------------------------------------------
// Client-side: collect all unique mediaIds from project data
// ---------------------------------------------------------------------------

/**
 * Walk all ScreenImage, SharedBackground, and CanvasSettings entries to
 * collect every unique `mediaId` in the project data.
 * Returns a Set of mediaId numbers.
 */
export function collectClientMediaIds(data: Record<string, unknown>): Set<number> {
  const ids = new Set<number>();

  const screensByCanvasSize = data.screensByCanvasSize as
    | Record<string, Array<Record<string, unknown>>>
    | undefined;

  if (screensByCanvasSize) {
    for (const screens of Object.values(screensByCanvasSize)) {
      for (const screen of screens) {
        const images = screen.images as Array<Record<string, unknown>> | undefined;
        if (images) {
          for (const img of images) {
            if (typeof img.mediaId === 'number') {
              ids.add(img.mediaId);
            }
          }
        }

        const settings = screen.settings as Record<string, unknown> | undefined;
        if (settings && typeof settings.canvasBackgroundMediaId === 'number') {
          ids.add(settings.canvasBackgroundMediaId);
        }
      }
    }
  }

  const sharedBackgrounds = data.sharedBackgrounds as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (sharedBackgrounds) {
    for (const bg of Object.values(sharedBackgrounds)) {
      if (typeof bg.mediaId === 'number') {
        ids.add(bg.mediaId);
      }
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Client-side: strip project data for export (mediaId -> mediaRef)
// ---------------------------------------------------------------------------

/**
 * Deep-clone the project data, replace `mediaId` with `mediaRef`,
 * and strip transient/session state.
 * `mediaIdToRef` maps mediaId (number) -> mediaRef (archive filename).
 */
export function stripProjectForClientExport(
  data: Record<string, unknown>,
  mediaIdToRef: Map<number, string>,
): Record<string, unknown> {
  const clone = structuredClone(data);

  const screensByCanvasSize = clone.screensByCanvasSize as
    | Record<string, Array<Record<string, unknown>>>
    | undefined;

  if (screensByCanvasSize) {
    for (const screens of Object.values(screensByCanvasSize)) {
      for (const screen of screens) {
        const settings = screen.settings as Record<string, unknown> | undefined;
        if (settings) {
          delete settings.selectedTextId;

          // Rewrite canvas background mediaId -> mediaRef
          if (typeof settings.canvasBackgroundMediaId === 'number') {
            const ref = mediaIdToRef.get(settings.canvasBackgroundMediaId);
            if (ref) {
              settings.canvasBackgroundMediaRef = ref;
            }
            delete settings.canvasBackgroundMediaId;
          }
          delete settings.canvasBackgroundServerPath;
        }

        const images = screen.images as Array<Record<string, unknown>> | undefined;
        if (images) {
          for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i];

            if (img.cleared) {
              images.splice(i, 1);
              continue;
            }

            if (typeof img.mediaId === 'number') {
              const ref = mediaIdToRef.get(img.mediaId);
              if (ref) {
                img.mediaRef = ref;
              }
            }

            delete img.mediaId;
            delete img.serverMediaPath;
            delete img.image;
          }
        }
      }
    }
  }

  const sharedBackgrounds = clone.sharedBackgrounds as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (sharedBackgrounds) {
    for (const bg of Object.values(sharedBackgrounds)) {
      if (typeof bg.mediaId === 'number') {
        const ref = mediaIdToRef.get(bg.mediaId);
        if (ref) {
          bg.mediaRef = ref;
        }
      }
      delete bg.mediaId;
      delete bg.serverMediaPath;
    }
  }

  delete clone.selectedScreenIndices;
  delete clone.primarySelectedIndex;
  delete clone.selectedFrameIndex;
  delete clone.zoom;

  return clone;
}

// ---------------------------------------------------------------------------
// Client-side: rewrite mediaRef -> mediaId (for import)
// ---------------------------------------------------------------------------

/**
 * Walk the imported project data and replace every `mediaRef` with the
 * corresponding new local `mediaId`.
 */
export function rewriteMediaRefsToIds(
  data: Record<string, unknown>,
  mediaRefToId: Map<string, number>,
): Record<string, unknown> {
  const clone = structuredClone(data);

  const screensByCanvasSize = clone.screensByCanvasSize as
    | Record<string, Array<Record<string, unknown>>>
    | undefined;

  if (screensByCanvasSize) {
    for (const screens of Object.values(screensByCanvasSize)) {
      for (const screen of screens) {
        const images = screen.images as Array<Record<string, unknown>> | undefined;
        if (images) {
          for (const img of images) {
            if (typeof img.mediaRef === 'string') {
              const id = mediaRefToId.get(img.mediaRef);
              if (id !== undefined) {
                img.mediaId = id;
              }
              delete img.mediaRef;
            }
          }
        }

        const settings = screen.settings as Record<string, unknown> | undefined;
        if (settings) {
          if (typeof settings.canvasBackgroundMediaRef === 'string') {
            const id = mediaRefToId.get(settings.canvasBackgroundMediaRef);
            if (id !== undefined) {
              settings.canvasBackgroundMediaId = id;
            }
            delete settings.canvasBackgroundMediaRef;
          }
        }
      }
    }
  }

  const sharedBackgrounds = clone.sharedBackgrounds as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (sharedBackgrounds) {
    for (const bg of Object.values(sharedBackgrounds)) {
      if (typeof bg.mediaRef === 'string') {
        const id = mediaRefToId.get(bg.mediaRef);
        if (id !== undefined) {
          bg.mediaId = id;
        }
        delete bg.mediaRef;
      }
    }
  }

  return clone;
}

