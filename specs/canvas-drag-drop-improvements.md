# Canvas Drag-and-Drop Improvements (Media Library + Smart Frame Fill)

## Overview

This spec enhances the drag-and-drop behavior in the AppFrames canvas editor so that:

- Dropped images are **automatically saved** to the media library (**OPFS** for blobs + **IndexedDB** for metadata).
- Drops are **target-aware** (device frame vs canvas background).
- Multi-file drops are **distributed intelligently** across available device frames.
- Users get **clear visual feedback** during drag-over.

The implementation should reuse the existing `handleMediaUpload` logic in `components/AppFrames/AppFrames.tsx`, and keep persistence flowing through the existing IndexedDB state system (`lib/PersistenceDB.ts`, `hooks/usePersistence.ts`).

## Glossary

- **Canvas**: Main editing area where device frames and compositions are displayed.
- **Canvas background**: Area outside device frames where a background image can be placed.
- **Device frame**: A visual mockup (iPhone, iPad, etc.) that displays an image.
- **Device frame drop zone**: Interactive area inside a device frame where images can be dropped.
- **Composition**: Layout arrangement of device frames (single, dual, stack, triple, fan).
- **Screen**: A screenshot/image displayed in a device frame.
- **Background image**: Image placed on the canvas background, outside device frames.
- **Media library**: Persistent storage using IndexedDB (metadata) + OPFS (files).
- **OPFS**: Origin Private File System.
- **IndexedDB**: Browser database storing media file metadata.

## Requirements

### R1: Automatic persistence to media library

**User Story:** As a user, I want images I drag onto the canvas to be automatically saved to my media library, so that I can reuse them later without re-uploading.

**Acceptance Criteria:**

1. WHEN a user drags an image file onto the canvas THEN the system SHALL save the file to OPFS with a unique filename.
2. WHEN a user drags an image file onto the canvas THEN the system SHALL save the file metadata to the AppFrames IndexedDB database.
3. WHEN saving to the media library THEN the system SHALL generate a thumbnail at maximum 200px dimension.
4. WHEN saving to the media library THEN the system SHALL extract and store the image width and height dimensions.
5. WHEN the media library save completes THEN the system SHALL use the returned `mediaId` to populate the device frame.

### R2: Target-aware placement (frame vs background)

**User Story:** As a user, I want to drop images on device frames to fill them, or on the canvas background to set a background image, so that I have precise control over image placement.

**Acceptance Criteria:**

1. WHEN a user drops an image on a device frame drop zone THEN the system SHALL populate that specific device frame with the image.
2. WHEN a user drops an image on the canvas background (outside device frames) THEN the system SHALL set the image as the canvas background image.
3. WHEN an image is dropped on a device frame THEN the system SHALL auto-fit the image to fill the frame using object-fit cover.
4. WHEN an image is dropped on the canvas background THEN the system SHALL scale the image to cover the entire canvas area.
5. WHEN detecting drop zones THEN the system SHALL use `element.getBoundingClientRect()` to determine if the drop is on a device frame or background.

### R3: Visual feedback + robust failure behavior

**User Story:** As a user, I want visual feedback when I drag images onto the canvas, so that I understand where the image will be placed.

**Acceptance Criteria:**

1. WHEN a user drags a file over a device frame THEN the system SHALL highlight that device frame as a drop target.
2. WHEN a user drags a file over the canvas background THEN the system SHALL highlight the canvas background as a drop target.
3. WHEN the drag operation completes successfully THEN the system SHALL immediately display the image in the appropriate location.
4. WHEN the media library save fails THEN the system SHALL display an error message to the user.
5. WHEN multiple files are dragged simultaneously THEN the system SHALL process all files and distribute them across available device frames.

### R4: Intelligent fill behavior for multi-device compositions

**User Story:** As a user, I want dropped images to fill device frames intelligently in multi-device compositions, so that I can quickly populate multiple screenshots without manual selection.

**Acceptance Criteria:**

1. WHEN a user drops multiple images on a canvas with a multi-device composition THEN the system SHALL distribute images across empty device frames.
2. WHEN more images are dropped than available frames THEN the system SHALL fill all frames and ignore excess images.
3. WHEN all device frames have images and a single image is dropped on a frame THEN the system SHALL replace that frame's image.
4. WHEN a new screen is added to an empty canvas THEN the system SHALL set `selectedScreenIndex` to `0`.
5. WHEN identifying empty device frames THEN the system SHALL check for both missing `mediaId` and missing image properties.

### R5: Maintainable delegation + reuse existing upload logic

**User Story:** As a developer, I want the drag-and-drop logic to be maintainable and testable, so that future enhancements are easier to implement.

**Acceptance Criteria:**

1. WHEN implementing the upload logic THEN the system SHALL reuse the existing `handleMediaUpload` function from `AppFrames.tsx`.
2. WHEN determining drop target THEN the system SHALL use `element.getBoundingClientRect()` to detect if drop is on device frame or background.
3. WHEN the Canvas component receives a dropped file THEN the system SHALL delegate storage operations to the parent AppFrames component.
4. WHEN processing dropped files THEN the system SHALL handle errors gracefully without crashing the application.
5. WHEN saving to OPFS THEN the system SHALL use timestamp-based unique filenames to prevent collisions.

### R6: Background image persistence + export

**User Story:** As a user, I want background images to be stored and persisted, so that my canvas backgrounds are preserved across sessions.

**Acceptance Criteria:**

1. WHEN a background image is set THEN the system SHALL save the `mediaId` to the screen's settings.
2. WHEN a screen with a background image is loaded THEN the system SHALL restore the background image from the media library.
3. WHEN a background image is removed THEN the system SHALL clear the background `mediaId` from settings.
4. WHEN exporting a screen with a background image THEN the system SHALL include the background in the exported PNG.
5. WHEN a background image is set THEN the system SHALL persist the change to IndexedDB via the state persistence system.

## Proposed Design

### Architecture and responsibilities

- **`components/AppFrames/AppFrames.tsx`**
  - Owns state updates for screens/settings.
  - Reuses `handleMediaUpload(file)` to persist media + return `mediaId`.
  - Applies “smart fill” logic for multi-file drops.
  - Applies “explicit target” logic for frame-targeted drops.
  - Updates `selectedScreenIndex` appropriately.

- **`components/AppFrames/Canvas.tsx`**
  - Handles drag/drop UI events and visual highlights.
  - Detects drop target using bounding boxes for device-frame drop zones.
  - Delegates storage/state work to `AppFrames` via callbacks.

- **Persistence layer**
  - **`lib/PersistenceDB.ts`**: IndexedDB metadata / app state.
  - **`lib/opfs.ts`**: OPFS blob writes/reads.

### Data flow

1. User drags image(s) onto Canvas.
2. Canvas computes the intended drop target:
   - **Frame-targeted**: a specific device frame index.
   - **Background-targeted**: canvas background.
3. Canvas hands `(files, target)` up to AppFrames.
4. AppFrames uploads each file via `handleMediaUpload(file)` and receives `mediaId`s.
5. AppFrames applies:
   - frame-targeted replacement, or
   - background set, or
   - smart distribution across empty frames (for multi-file drops).
6. App state persists via existing persistence system; UI updates immediately.

## Algorithms

### Composition frame count

Map a composition type to a frame count:

- `single`: 1
- `dual`: 2
- `stack`: 2
- `triple`: 3
- `fan`: 3

### Empty frame detection

A frame is considered “empty” when:

- `!screen.mediaId` AND `!screen.image` (covers both persisted media and any legacy image property).

### Multi-file distribution

When dropping **N files** without an explicit frame target:

- Determine `frameCount` from composition.
- Compute candidate indices within `[0, frameCount)`.
- Fill in order:
  - prefer indices that are “empty”
  - if more files than empty slots: stop once `frameCount` is filled (ignore excess).

When dropping a **single file** on an explicit device frame:

- Replace that frame, regardless of “empty” status.

## Error handling + UX

- If upload fails for a file:
  - show a user-visible error (Mantine notification or equivalent),
  - continue processing remaining files when appropriate,
  - do not crash the editor.
- Drag-over highlights:
  - highlight device frame when cursor is over its drop zone,
  - otherwise highlight the canvas background area.

## Implementation plan (tasks)

- [ ] **Plumb a richer drop callback from `Canvas` to `AppFrames`**
  - include dropped files + detected target (frame index vs background).
- [ ] **Implement drop-target detection + highlights in `Canvas.tsx`**
  - compute bounding rects for frame drop zones
  - show hover state for frame/background
- [ ] **Reuse `handleMediaUpload` for every dropped file**
  - ensure OPFS filename uniqueness (timestamp-based)
  - ensure thumbnail + dimensions are stored (max 200px thumbnail dimension)
- [ ] **Implement smart distribution for multi-file drops**
  - fill empty frames first within composition frame count
  - ignore excess files when frames are full
- [ ] **Persist background images per-screen**
  - store background `mediaId` in the screen’s settings
  - restore on load
  - support clear/remove background
- [ ] **Export includes background**
  - ensure export pipeline composites background image when present

