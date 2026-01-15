# “Component tree” / Layers panel (Canva-style)

## Clarification: Canva doesn’t have a “developer component tree”

Canva’s equivalent is:

- **Pages**: list of pages/artboards (our equivalent is `ScreensPanel`)
- **Layers**: object/layer stack within the current page (text, photos, frames, backgrounds), often with grouping

So in AppFrames, the right mental model is **Layers (document objects)**, not React components.

## Current state in AppFrames

- **Pages-equivalent exists**: `components/AppFrames/ScreensPanel.tsx` shows screens and supports reordering.
- **Partial layers exists**: `components/AppFrames/TextTab.tsx` already has a “Layers” list for **text elements only** (zIndex ordering, rename, visibility, reorder, duplicate).
- There is **no unified layers tree** that shows:
  - canvas background
  - frame slots (device frames + their media)
  - text layers
  - selection across object types

## Goal

Add a Canva-like **Layers panel** for the currently selected screen that provides a unified “component tree” of editable objects:

- Screen background
- Frame slots (1..N based on composition)
- Text layers (existing)

## Non-goals (v1)

- Arbitrary nesting / grouping of layers (we can ship “flat with sections” first, then add groups later).
- Multi-screen layers view (layers are for the active screen only).

## Proposed UI

### Location

Option A (recommended): new tab in the left panel rail:

- `Layers` tab (icon: stack/layers)
- Contains a tree/list for the active screen

Option B: fold into existing `Text` tab as a new “All layers” section (less ideal; text tab is getting crowded).

### Structure (v1)

Render a single list with section headers:

1) **Background**
- Background color (and later background media)

2) **Frames**
- `Frame 1`, `Frame 2`, … (based on composition)
- each row shows:
  - device frame name
  - whether it has media
  - quick actions: select, clear, maybe lock

3) **Text**
- Reuse current `TextTab` layers list behavior:
  - zIndex ordering (top-most first)
  - rename, visibility toggle, reorder, duplicate, delete

If we want a literal “tree”, frames can be expandable:

- Frame 1
  - Media (image/mediaId)
  - Transform (scale/rotate/tilt) (read-only in v1, or jump to controls)

## Selection model

We currently have:

- screen selection (multi-select) + a primary selected screen index
- selected frame index (`selectedFrameIndex`)
- selected text id on the screen (`screen.settings.selectedTextId`)

For a unified layers panel, define a single “active object” concept:

```ts
type ActiveLayer =
  | { kind: 'background' }
  | { kind: 'frame'; frameIndex: number }
  | { kind: 'text'; textId: string };
```

v1 can map selection without adding new persisted state:

- selecting a **frame layer** sets `selectedFrameIndex = frameIndex` and clears `selectedTextId`
- selecting a **text layer** sets `selectedTextId = textId` (existing) and leaves `selectedFrameIndex` as-is (or set it to 0, decision)
- selecting **background** clears `selectedTextId`

## Reordering rules

- **Frames**: fixed order (slot index). Not reorderable in v1.
- **Text**: reorderable (already implemented via `zIndex` normalization).
- **Cross-type ordering** (text vs frame vs background): not supported in v1.

## “Canva-like” affordances to include

- **Visibility toggles**:
  - text already has `visible`
  - frames/background can add `hidden` later (requires schema updates) — v1 can skip.
- **Locking**:
  - would prevent drag/resize/rotate on the canvas and show a lock icon in layers
  - requires adding a `locked` flag per element (text, per-frame) — v2.
- **Rename**:
  - text rename exists
  - screens already have `name`, frames could get `name` later

## Keyboard behavior (optional but Canva-like)

When the Layers panel is focused:

- Up/Down: move selection through layers
- Enter: rename (text) / open relevant controls
- Delete/Backspace: delete selected text layer

## Undo/redo integration

All “Layers panel” operations should be undoable via the planned history system:

- rename text
- toggle visibility
- reorder text
- duplicate/delete text
- clear/replace frame media (if exposed here)

History boundaries: one entry per action (no per-mousemove updates).

## Implementation plan

1) Add a new `LayersTab` component:
   - reads active screen + selection from `useFrames()`
   - renders Background / Frames / Text sections
   - reuses existing text-layer row logic from `TextTab` (extract small subcomponents to avoid duplication)

2) Add routing + tab button:
   - update `SidebarTabs.tsx` to include a new `layers` tab and route
   - ensure selecting an element can navigate to `/layers` when desired (similar to current `/text` behavior)

3) Selection wiring:
   - add context helpers:
     - `selectFrame(frameIndex)`
     - `selectBackground()`
     - keep `selectTextElement(textId)` as-is

4) v2 follow-ups:
   - add “locked” flags for text + frames and enforce them in interaction handlers
   - introduce layer groups
   - show per-frame sub-items (media/transform) under a collapsible tree

