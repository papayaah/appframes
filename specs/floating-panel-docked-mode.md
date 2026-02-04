# Floating Panel Docked Mode

## Overview

Enhance the `FloatingSettingsPanel` component so that context panels (Image Settings, Frame Settings) **default to a docked position** in the lower-right corner instead of floating freely. Users can detach panels to float them, and reattach via an icon in the title bar. **The same component and behavior are reused for the History panel**—unifying all right-side panels into one shared system.

## Goals

- **Contextual visibility** — Panels only appear when a relevant element is selected (e.g., frame, image); they disappear when nothing is selected. This is unchanged from current behavior.
- **Default: Docked** — When visible, panels appear in a fixed lower-right dock by default, not floating over the canvas
- **Detach to float** — Users can detach a panel to make it draggable/floating (current behavior)
- **Attach to re-dock** — An attach icon in the title bar reattaches the panel to the lower-right dock
- **Persist preference** — Remember whether each panel is docked or floating (and floating position) per session via localStorage
- **Reuse with History** — History panel uses the same component; all right-side panels share dock/float behavior and layout

## Current State

- **Settings panels** (Image, Frame): Use `FloatingSettingsPanel` with `position: fixed`, anchored near the selected frame or centered. **Only visible when selection exists** (frame selected for Frame Settings; frame + image for Image Settings); disappear when selection is cleared. Position persisted via `localStorage`. Header: drag handle, title, subtitle, optional close. Draggable and resizable.
- **History panel**: Uses `AppShell.Aside`—a separate sidebar with fixed width (320px when open, 16px rail when closed). Has its own toggle notch and layout. Not part of the floating panel system.

## UX Design

### Contextual Visibility (Unchanged)

- **Image Settings**: Visible only when a frame with an image is selected (`frameSelectionVisible` + frame has media)
- **Frame Settings**: Visible only when a frame is selected (`frameSelectionVisible`)
- **When nothing is selected**: Both panels disappear
- Docked mode changes *where* panels appear (docked vs floating), not *when* (still driven by canvas selection)

### Docked Mode (Default)

- **Position**: Lower-right corner of the main content area (canvas region)
- **Constraints**:
  - Offset from right edge: ~24px
  - Offset from bottom edge: ~24px (above any footer/chrome)
  - **Side-by-side**: All docked panels (History, Image Settings, Frame Settings) sit side-by-side or stack in the dock—they coexist without overlapping, like friendly neighbors.
- **Layout**: Same card appearance (shadow, radius, header, content)
- **Behavior**: Panel is fixed in place; no drag handle active in docked mode (or drag handle triggers detach)

### Panel Height (Docked and Floating)

- **Grow with content**: Panel height should grow to fit its content. When there are only a few settings, the panel stays compact—no unnecessary empty space or scroll.
- **Maximum height**: Cap height at the available viewport height (minus dock margins). If the user has enough browser height, the panel expands to accommodate more settings; it never exceeds the usable vertical space.
- **Scroll when needed**: Show a scrollbar in the content area only when content exceeds the max height. Avoid scroll when content is short.
- **Maximize space**: Use available space efficiently—start small, grow up to the max as settings increase, so users rarely need to scroll when they have a tall viewport.

### Floating Mode (Detached)

- **Trigger**: User drags the panel header; or a "detach" / "float" icon in the title bar
- **Behavior**: Same as current — draggable, position persisted
- **Visual**: Optional subtle indicator (e.g., shadow) that panel is "floating" vs docked

### Title Bar Icons

| State    | Icon              | Action                    |
|----------|-------------------|---------------------------|
| Docked   | Pin-off / Unpin   | Click to detach (float)   |
| Floating | Pin / Attach      | Click to reattach (dock)  |

Suggested icons (Tabler):
- **Docked → Detach**: `IconPin` or `IconArrowUpRight` (implies "pop out")
- **Floating → Attach**: `IconPinFilled` or `IconPinned` (implies "pin back")

Alternatively, a single **pin icon** that toggles:
- Unpinned (outline) = docked → click to float
- Pinned (filled) = floating → click to dock

### Dock Region

```
+------------------------------------------------------+
|  Header (if any)                                     |
+------------------------------------------------------+
| Nav  |  Canvas area                    | Dock region |
|      |                                 | +--------+  |
|      |                                 | | History|  |
|      |                                 | | Frame  |  |
|      |                                 | | Image  |  |
|      |                                 | +--------+  |
+------------------------------------------------------+
```

- Dock is positioned in the **right side of the main content area**, above any footer
- **Unified layout**: When History and settings panels are both docked, they sit side-by-side or stack vertically—all use the same dock region. No overlap; they share the right side of the layout.
- Panels stack vertically in the dock when multiple are open (e.g., History, Frame Settings, Image Settings—order TBD)

### Reuse with History Panel

- **Migration**: Replace `AppShell.Aside` + `HistorySidebar` with the same docked panel component. History becomes another instance of the unified panel.
- **Shared behavior**: History panel gets dock/float, pin/unpin, height-grows-with-content, and max-height—same as Image and Frame settings panels.
- **Layout**: History and settings panels share the dock region. When all docked, they arrange side-by-side (horizontal) or stacked (vertical) without overlapping.
- **Toggle**: History panel uses a collapse/expand control (or the dock's pin icon) instead of the current notch. The rail/notch pattern could remain as a secondary affordance, or be folded into the unified panel header.

## Component API Changes

### `FloatingSettingsPanel` — New Props

```typescript
interface FloatingSettingsPanelProps {
  // ... existing props ...

  /**
   * Whether to support docked mode. Default: true.
   * When true, panel defaults to lower-right dock; user can detach/attach.
   */
  dockable?: boolean;

  /**
   * Default mode on first use. Default: 'docked'.
   * 'docked' = lower-right dock
   * 'floating' = free-floating (current behavior)
   */
  defaultMode?: 'docked' | 'floating';

  /**
   * Bounds for the dock region (optional override).
   * { right: number, bottom: number } = offset from viewport right/bottom
   */
  dockBounds?: { right: number; bottom: number };

  /**
   * Max height for the panel. Default: viewport height minus dock margins.
   * Panel height grows with content up to this max; scroll only when exceeded.
   */
  maxHeight?: number;
}
```

### Persistence Keys (localStorage)

| Key                              | Purpose                         |
|----------------------------------|---------------------------------|
| `floating-panel-position-{key}`  | Floating position (existing)    |
| `floating-panel-size-{key}`      | Panel size (existing)           |
| `floating-panel-mode-{key}`      | `'docked'` \| `'floating'` (new)|

## Implementation Plan

### Phase 1: Docked layout and state

1. Add `dockable`, `defaultMode`, and `dockBounds` props to `FloatingSettingsPanel`
2. Add internal state: `mode: 'docked' | 'floating'`
3. Load initial mode from localStorage `floating-panel-mode-{positionKey}` or use `defaultMode`
4. When `mode === 'docked'`:
   - Compute dock position: `right: 24`, `bottom: 24` (or use `dockBounds`)
   - Position panel with `right`/`bottom` CSS instead of `transform`
   - Disable drag on header (or use drag to detach)
   - **Height**: Grow with content; cap at `maxHeight` or `(viewport height - dock margins)`; scroll only when content exceeds max
5. When `mode === 'floating'`: keep current behavior (position, drag, resize); same height rules apply

### Phase 2: Attach / Detach UI

1. Add pin/attach icon button to the header (next to close button)
2. **Docked**:
   - Show "unpin" or "float" icon
   - Click → set `mode = 'floating'`, compute initial floating position (e.g., current dock position as x,y), persist mode
3. **Floating**:
   - Show "pin" or "attach" icon
   - Click → set `mode = 'docked'`, persist mode
4. Persist mode change to localStorage

### Phase 3: Drag-to-detach (optional)

- When docked, allow dragging the header
- On drag start: switch to floating mode at current pointer position
- Provides discoverability for detach without requiring the icon

### Phase 4: Multi-panel stacking

- When multiple panels are open and docked (History, Image Settings, Frame Settings):
  - Stack vertically or arrange side-by-side in the dock region
  - Define stacking order (e.g., History, Frame, Image—or by `positionKey`)
  - Panels share the dock; each can be detached independently

### Phase 5: Migrate History panel (optional)

1. Extract History content into a reusable component (header + undo/redo + scrollable list)
2. Wrap it with the same docked panel component used for Image/Frame settings
3. Remove `AppShell.Aside` for History; render History as a docked panel instance
4. History gets dock/float, pin/unpin, and height behavior for free

## Edge Cases

- **Resize in docked mode**: Optional — could disable resize when docked, or allow height-only resize
- **Small viewports**: If dock doesn't fit, fall back to floating or compact dock
- **Panel visibility**: When panels open/close (e.g., History collapse, settings panel appears), recompute dock layout (ResizeObserver or layout events)
- **Multiple canvases**: Dock is global; panels show content for the active selection regardless of dock position
- **Export**: Docked panels should still be hidden during export (`data-export-hide`)

## Open Questions

1. **Stacking**: When multiple panels are docked, stack vertically or side-by-side?
2. **History migration scope**: Migrate History in the same PR as docked mode, or as a follow-up?
3. **Animation**: Animate transition between docked ↔ floating for polish?

## Success Criteria

- Panels only appear when a relevant canvas element is selected; they disappear when nothing is selected (unchanged from current behavior)
- New users see panels docked in the lower-right by default when they *are* visible
- Users can detach (float) and reattach (dock) via the title bar icon
- Preference (docked vs floating) persists across sessions
- Floating position and size continue to persist when in floating mode
- (Optional) History panel uses the same component; all right-side panels share behavior and layout
