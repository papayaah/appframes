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

## Mixed device frames (iPad + Mac + iPhone in one canvas)

Yes—this is already supported by the data model:

- Each slot is a `ScreenImage`, and each `ScreenImage` has its own `deviceFrame` selection.
- A composition preset only defines **where the slots go**; it should not assume all slots use the same device type or size.

**Requirement:** all new presets must remain **device-type agnostic**, and layouts must still look reasonable when slots mix devices with very different aspect ratios (e.g., iPhone + iPad + iMac).

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

## Preview icons (Sidebar composition button)

The current `Sidebar` uses simple outlined-rectangle glyphs to preview each composition. For new presets, we should add icons in the same spirit: neutral rounded rectangles with a consistent stroke.

Below are reference SVGs (conceptual) for each proposed preset:

### `quad-grid` icon

```svg
<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#495057" stroke-width="2">
    <rect x="8" y="4" width="14" height="14" rx="3"/>
    <rect x="26" y="4" width="14" height="14" rx="3"/>
    <rect x="8" y="22" width="14" height="14" rx="3"/>
    <rect x="26" y="22" width="14" height="14" rx="3"/>
  </g>
</svg>
```

### `hero-inset` icon

```svg
<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#495057" stroke-width="2">
    <rect x="10" y="4" width="20" height="32" rx="4"/>
    <rect x="26" y="18" width="14" height="18" rx="3"/>
  </g>
</svg>
```

### `staggered-stack-3` icon

```svg
<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#495057" stroke-width="2">
    <rect x="10" y="8" width="16" height="24" rx="3"/>
    <rect x="18" y="6" width="16" height="26" rx="3"/>
    <rect x="26" y="4" width="16" height="28" rx="3"/>
  </g>
</svg>
```

### `carousel-4` icon

```svg
<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#495057" stroke-width="2">
    <rect x="6" y="10" width="12" height="20" rx="3"/>
    <rect x="16" y="6" width="16" height="28" rx="3"/>
    <rect x="30" y="10" width="12" height="20" rx="3"/>
    <rect x="36" y="14" width="8" height="14" rx="2" opacity="0.9"/>
  </g>
</svg>
```

### `split-left-right` icon

```svg
<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#495057" stroke-width="2">
    <rect x="8" y="4" width="14" height="32" rx="4"/>
    <rect x="26" y="4" width="14" height="32" rx="4"/>
  </g>
</svg>
```

### `triple-column` icon

```svg
<svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#495057" stroke-width="2">
    <rect x="7" y="6" width="10" height="28" rx="3"/>
    <rect x="19" y="6" width="10" height="28" rx="3"/>
    <rect x="31" y="6" width="10" height="28" rx="3"/>
  </g>
</svg>
```

## Auto-fit requirement (critical)

**All compositions must automatically fit frames within canvas bounds.**

### Current state (hardcoded multipliers)

The existing compositions (`single`, `dual`, `stack`, `triple`, `fan`) currently use **hardcoded scale multipliers**:
- `dual`: `0.9`
- `stack`: `0.85`
- `triple`: `0.68`
- `fan`: `0.7`

These multipliers work reasonably well for common canvas sizes but are **not dynamic**—they don't adapt to different canvas dimensions or orientations.

### New requirement (dynamic auto-fit)

For new compositions (and ideally refactoring existing ones), the system must **calculate scale dynamically** based on actual canvas dimensions:

1. **Calculate available space**: Get canvas dimensions from `getCanvasDimensions(canvasSize, orientation)`.
2. **Calculate total frame width needed**: 
   - Get natural device frame width from `DeviceFrame` config
   - Multiply by `BASE_COMPOSITION_SCALE` (0.85) to get base size
   - Sum widths for all frames + gaps between them
3. **Compute scale factor**: If total width exceeds available width, calculate: `autoFitScale = Math.min(1, availableWidth / totalWidthNeeded)`
4. **Apply to all frames**: All frames in the composition should use the same calculated scale (or proportional scales if the layout intentionally varies sizes).

**Example**: For `triple-column` (3 horizontal frames):
- Canvas width: 1284px (iPhone 6.5" portrait)
- Natural frame width: ~390px (iPhone 14 Pro at BASE_COMPOSITION_SCALE 0.85)
- Total width needed: `(390 * 3) + (12 * 2 gaps) = 1194px`
- Auto-fit scale: `Math.min(1, 1284 / 1194) = 1.0` (fits perfectly)
- But if canvas was smaller (e.g., 1000px): `Math.min(1, 1000 / 1194) = 0.837` (shrinks to fit)

**Implementation notes**:
- This should happen in `CompositionRenderer` when computing base transforms for each preset.
- The auto-fit scale should be **combined** with the existing `BASE_COMPOSITION_SCALE` and user `frameScale` adjustments.
- Auto-fit should respect canvas orientation (portrait vs landscape) and adjust accordingly.
- For compositions with intentional size variation (e.g., `hero-inset`), the auto-fit should ensure the **largest** frame fits, then scale others proportionally.
- **Backward compatibility**: Existing hardcoded multipliers can remain as fallbacks, but new compositions should use dynamic calculation.

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
    - per-frame base scale (with auto-fit calculation applied)
    - per-frame base rotation (optional)
  - Users can still adjust `frameX/frameY/frameScale/rotateZ` per frame (user adjustments are applied **on top of** the auto-fit base scale).

## Technical design

### Single source of truth for presets

Create a centralized composition registry (conceptually):

- `compositionId`
- `frameCount`
- `label` (for the Sidebar)
- `icon` (for the Sidebar preview glyph)
- `layout` metadata used by `CompositionRenderer`
- optional per-frame initial transforms
- optional “fixed width / no overlap” hint (to stabilize layout)

This registry should drive:

- `getCompositionFrameCount`
- Sidebar composition options
- CompositionRenderer layout switch

### Rendering behavior

- `CompositionRenderer` should implement each preset as a deterministic layout function:
  - **Calculate auto-fit scale** based on canvas dimensions and frame count/spacing
  - derive a **base transform** per frame (position/scale/rotation) with auto-fit applied
  - apply user transforms (`frameX/frameY/frameScale/rotateZ`) via the existing wrapper logic (user adjustments are multiplicative on top of auto-fit)
- Must work for:
  - editor canvas
  - thumbnails (renderer already used)
  - export surfaces
- **Auto-fit algorithm** (pseudo-code):
  ```typescript
  const canvasDims = getCanvasDimensions(canvasSize, orientation);
  const naturalFrameWidth = deviceFrameConfig.width * BASE_COMPOSITION_SCALE;
  const totalWidthNeeded = (naturalFrameWidth * frameCount) + (gap * (frameCount - 1));
  const autoFitScale = Math.min(1, canvasDims.width / totalWidthNeeded);
  // Apply autoFitScale to all frames in the composition
  ```

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
  - **Ensure auto-fit calculation** is applied for all new presets (especially horizontal/vertical multi-frame layouts).
- **Update `Sidebar`**
  - Add new buttons with labels and compact previews.
- **Validation**
  - Ensure invalid/unknown composition values fall back to `single`.

## Open questions

- Which of the proposed presets do you want first (top 2–3)?
- Should we allow compositions >4 frames (e.g., 5 or 6), or cap at 4 for now?
- Do we want any presets optimized for landscape (e.g., “feature strip”)?

