# Cross-Canvas Element Dragging (Auto-split Elements Across Canvases)

## Overview

This spec describes “cross-canvas” dragging: allowing a user to drag a canvas element (text, image, device frame) so that it **spans multiple canvases**, and the system automatically **splits** it such that each canvas stores and renders **only its visible portion**.

This should work consistently for:

- **Device frames** (frame chrome + screenshot content)
- **Text elements**
- **Other canvas elements** (e.g., free images / stickers) if/when introduced

Interaction performance should follow the project pattern: **preview in rAF, commit on end**.

## Glossary

- **Canvas**: The main editing area where selected screens are rendered.
- **Screen / canvas screen**: One exportable canvas (a “screen”) in the project.
- **Canvas element**: Any draggable element that can be placed on a screen (device frame, text element, image layer, etc.).
- **Cross-canvas drag**: Dragging a canvas element such that it overlaps multiple screens.
- **Split / partial element**: The per-screen representation of a single element when it overlaps multiple screens (each screen stores only its clipped portion).
- **Intersection region**: The rectangle where an element overlaps a given screen’s bounds.
- **Clipping**: Masking an element so only its visible portion renders inside a screen (e.g., CSS `clip-path`).

## Requirements (main goal: split-any-element)

1. **Preview**: WHILE a user drags a canvas element across screens THEN the UI SHALL preview the element spanning canvases and show the split regions per affected screen.
2. **Automatic splitting**: WHEN an element overlaps multiple screens THEN the system SHALL compute the intersection region for each screen and create/update the corresponding per-screen partial element.
3. **Commit**: WHEN the drag ends THEN the system SHALL persist the resulting split state into project state (so reload, thumbnails, and exports match).
4. **Type support**:
   - WHERE the element is a **device frame** THEN the frame + screenshot content SHALL be clipped proportionally and remain visually aligned.
   - WHERE the element is **text** THEN text styling SHALL remain intact and the glyphs SHALL clip at screen boundaries.
   - WHERE the element is an **image layer** THEN the image SHALL clip at screen boundaries while preserving transforms.
5. **Non-overlap**: WHEN a screen has no intersection with the dragged element THEN that screen SHALL remain unchanged.
6. **Performance**: WHILE dragging THEN previews SHALL remain smooth (rAF-batched visual updates; avoid expensive React renders per pointer move).
7. **Thumbnails + export parity**: WHEN a screen is exported or rendered in the ScreensPanel thumbnail THEN it SHALL match the same partial/split appearance shown on-canvas.

## Current status (already implemented today)

### What works today

- The current codebase has a **device-frame-only** version of this idea in the **main editor canvas view**:
  - `components/AppFrames/CrossCanvasDragContext.tsx`
  - `components/AppFrames/Canvas.tsx`
  - `components/AppFrames/OverflowDeviceRenderer.tsx`
- It previews device overflow across **left/right adjacent** canvases and persists that overflow in-context (`sharedDevices`) on drag end.

### Implementation notes (as built)

- **Bounds tracking**: `Canvas.tsx` registers each canvas’ DOM bounds in `CrossCanvasDragContext` via `registerCanvas(screenIndex, element)` using `getBoundingClientRect()`.
- **Overflow computation**: `CrossCanvasDragContext` computes whether the dragged device exits the source canvas left/right and whether a neighboring canvas is adjacent; if so, it computes:
  - `clipLeft` / `clipRight` (percent)
  - `offsetX` / `offsetY` (pixels)
- **Rendering**: `Canvas.tsx` renders overflow via `OverflowDeviceRenderer`, which applies `clipPath: inset(0 ${clipRight}% 0 ${clipLeft}%)` and renders a `DeviceFrame` scaled consistently with the composition baseline.

## Gaps to reach the main goal (not implemented yet)

To satisfy the “split-any-element” requirements above, we still need (at minimum):

- **A generalized, persisted partial-element model** (e.g., `screen.partialElements[]` in project state, not just in context memory)
- **Text splitting** (and any future image/sticker element splitting)
- **Thumbnail rendering** of partial elements (ScreensPanel) with correct clipping
- **Export parity** (exports include partial elements and match on-canvas)
- **More general overlap** (not only left/right adjacency; any overlapping screens)
- **Replace/remove/reposition semantics** for partial elements as first-class state

