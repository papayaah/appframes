# Composition Presets Expansion

## Overview

AppFrames currently supports a small set of composition presets (`single`, `dual`, `stack`, `triple`, `fan`). This spec proposes expanding that list with a curated set of **high-signal layouts** that help users create more varied, “store-ready” screenshots faster.

Key constraint: composition presets must remain centralized and consistent with the app’s conventions (frame counts, layout rules, and UX defaults should be driven from the same source of truth).

## Goals

- Add **new composition presets** that cover common marketing layouts (hero + inset, grids, staggered stacks, etc.).
- Keep interactions **buttery**: device move/scale/rotate must continue using “preview in rAF, commit on end”.
- Ensure parity across:
  - Main canvas rendering
  - ScreensPanel thumbnails
  - Store preview (`/preview`)
  - Export (`ExportService`)
- Preserve existing projects and keep composition switching predictable (adding/removing slots safely).

## Non-goals

- Arbitrary freeform multi-frame layout editor (this is still “preset-based”).
- Adding new device frame art packs (separate concern).
- Cross-canvas splitting (covered in `specs/cross-canvas-element-dragging.md`).

## Current state (baseline)

- **Compositions**: `single`, `dual`, `stack`, `triple`, `fan`
- **Composition type** is stored in `CanvasSettings.composition` (`components/AppFrames/types.ts`).
- **Frame count mapping** exists in multiple places (`getCompositionFrameCount` in `components/AppFrames/FramesContext.tsx` and `components/AppFrames/CompositionRenderer.tsx`).
- **UI**: composition selection buttons exist in `components/AppFrames/Sidebar.tsx`.

## Proposed new presets (ideas)

These are intentionally named for UX clarity; exact names can change.

### 1) `quad-grid` (2×2 grid)

- **Frame count**: 4
- **Use case**: feature highlights / “four steps” onboarding.
- **Layout**: 2×2 evenly spaced, slight perspective optional.

### 2) `hero-inset` (one large + one small overlay)

- **Frame count**: 2
- **Use case**: hero screen with a supporting detail screen.
- **Layout**: frame 0 is large centered; frame 1 is smaller, offset bottom-right with a shadow.

### 3) `staggered-stack-3`

- **Frame count**: 3
- **Use case**: scrollable app flows; creates depth without looking like a fan.
- **Layout**: three frames with small vertical offsets and subtle scale differences.

### 4) `carousel-4`

- **Frame count**: 4
- **Use case**: “gallery” look; common for App Store preview sequences.
- **Layout**: central frame large, neighbors partially visible left/right; one behind or smaller.

### 5) `split-left-right` (two equal columns)

- **Frame count**: 2
- **Use case**: comparison; before/after; iPhone + iPad side-by-side.
- **Layout**: strict 50/50 columns, no overlap; good for clean designs.

### 6) `triple-column`

- **Frame count**: 3
- **Use case**: three highlights, no overlap (cleaner than `fan`).
- **Layout**: three equal columns; optional slight vertical staggering.

## UX requirements

- **Composition selector**
  - New presets must appear in `Sidebar` with clear labels + compact preview icons.
  - Presets should be grouped (e.g., “Basic” vs “Advanced”) to avoid overwhelming users.

- **Switching compositions**
  - Switching to a higher frame count should add empty `ScreenImage` slots with sensible defaults.
  - Switching to a lower frame count should **truncate** extra slots (or preserve them in a hidden stash only if we add explicit UX for that later).

- **Defaults per preset**
  - Each preset defines reasonable defaults for:
    - per-frame base position
    - per-frame base scale
    - per-frame base rotation (optional)
  - Users can still adjust `frameX/frameY/frameScale/rotateZ` per frame.

## Technical design

### Single source of truth for presets

Create a centralized composition registry (conceptually):

- `compositionId`
- `frameCount`
- `layout` metadata used by `CompositionRenderer`
- optional per-frame initial transforms
- optional “fixed width / no overlap” hint (to stabilize layout)

This registry should drive:

- `getCompositionFrameCount`
- Sidebar composition options
- CompositionRenderer layout switch

### Rendering behavior

- `CompositionRenderer` should implement each preset as a deterministic layout function:
  - derive a **base transform** per frame (position/scale/rotation)
  - apply user transforms (`frameX/frameY/frameScale/rotateZ`) via the existing wrapper logic
- Must work for:
  - editor canvas
  - thumbnails (renderer already used)
  - export surfaces

### Persistence

- No schema change required if we store composition as a string union and store per-frame transforms in `ScreenImage`.
- Adding presets requires expanding the composition union type and ensuring validation defaults handle unknown values safely.

## Implementation plan

- **Centralize preset definitions**
  - Move/define all presets in one place (preferably `components/AppFrames/FramesContext.tsx` per repo convention about centralized presets).
  - Ensure `getCompositionFrameCount` and UI use the same source.
- **Add new composition IDs to types**
  - Extend `CanvasSettings.composition` union.
- **Implement layouts in `CompositionRenderer`**
  - Add cases for each new preset with clean base positioning rules.
- **Update `Sidebar`**
  - Add new buttons with labels and compact previews.
- **Validation**
  - Ensure invalid/unknown composition values fall back to `single`.

## Open questions

- Which of the proposed presets do you want first (top 2–3)?
- Should we allow compositions >4 frames (e.g., 5 or 6), or cap at 4 for now?
- Do we want any presets optimized for landscape (e.g., “feature strip”)?

