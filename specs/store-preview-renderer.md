# Store Preview Renderer (All Screens Grouped by Canvas Size)

## Overview

The Store Preview Renderer is a dedicated view that shows **all screens across all canvas sizes**, grouped by **platform** (Apple vs Google) and ordered by **largest → smallest**. It gives users a single place to review their screenshot portfolio and jump back into the editor for a specific canvas size.

## Status

This feature is **already implemented** in the app:

- UI: `components/AppFrames/StorePreviewRenderer.tsx`
- Route: `app/preview/page.tsx`
- Rendering: reuses `CompositionRenderer` + `TextElement` for accurate previews
- Data source: `screensByCanvasSize` from `useFrames()` (`components/AppFrames/FramesContext.tsx`)

## Core requirements

1. **Only show non-empty canvas sizes**: display canvas sizes that have at least one screen; hide empty ones.
2. **Group by platform**: Apple (default) vs Google (canvasSize starts with `google`).
3. **Sort sizes**: within each platform, sort by pixel area (largest → smallest).
4. **Accurate rendering**: previews must use the same rendering logic as export (Composition + background + text).
5. **Names + ordering**: show screen names and preserve the order from `screensByCanvasSize[canvasSize]`.
6. **Navigation**
   - From editor → preview page.
   - From preview → editor.
   - From a canvas size group → editor with that canvas size selected.

## Implementation notes (as built)

- **Grouping + sorting** are done by computing dimensions via `getCanvasDimensions(...)` and sorting by area.
- **Canvas background** is rendered via `canvasBackgroundMediaId` (same approach as export surfaces).
- **Per-canvas edit** uses `switchCanvasSize(canvasSize)` and then navigates back to `/`.
- **Export convenience**: the preview view includes “quick export” actions powered by `lib/ExportService.tsx` (beyond the original Kiro scope, but useful).

## Gaps / follow-ups (if we care)

- **Empty state copy**: confirm the empty state message matches current product copy expectations.
- **Editor restore behavior**: requirement “restore previously selected screen” is handled by persisted state; confirm UX is correct when jumping from preview → editor.

