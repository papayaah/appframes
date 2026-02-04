# Right Settings Sidebar

## Overview

Convert the existing floating `FloatingSettingsPanel` (Image Settings, Frame Settings) into a **pinned right sidebar** that behaves like the existing left sidebar (`SidebarTabs`). When a frame or image is selected, the settings panel slides in from the right, pushing the canvas content inward — mirroring how the left sidebar pins open and pushes the canvas when a tab is clicked.

This is implemented in **two phases**:

- **Phase 1 (this spec):** Pin the settings panel to the right side as a fixed sidebar. No floating behavior — it either shows or hides.
- **Phase 2 (future):** Re-introduce floating/detachable mode so users can pop the panel out and drag it freely over the canvas.

---

## Goals

- **Contextual visibility** — Panels only appear when a relevant element is selected (frame selected = Frame Settings; frame + image = Image Settings). They disappear when nothing is selected. This is unchanged.
- **Right sidebar** — When visible, the panel is pinned to the right edge of the screen as a sidebar, pushing the canvas content to the left — exactly like the left sidebar pushes the canvas to the right when pinned.
- **Consistent with left sidebar** — Same visual treatment, animation style, and layout-push behavior as the existing `SidebarTabs` pinned panel.
- **Replace floating behavior (for now)** — Phase 1 removes floating/dragging entirely. The panel is always pinned when visible.

---

## Current State

- **Settings panels** (Image, Frame): Use `FloatingSettingsPanel` with `position: fixed`, anchored near the selected frame. Draggable and resizable. Position persisted via `localStorage`. Only visible when a selection exists.
- **History panel**: Uses `AppShell.Aside` — a separate right sidebar (320px open, 16px rail closed). Has its own toggle notch. Not part of the floating panel system.
- **Left sidebar** (`SidebarTabs`): 80px icon rail always visible. Clicking a tab pins the panel open (360px total), pushing the canvas via `AppShell.Navbar` width change with `transition: 'width 0.2s ease'`.

---

## Phase 1: Pinned Right Sidebar

### UX Design

#### Layout

```
Nothing selected — sidebar fully hidden:
+------------------------------------------------------+
|  Header (45px)                                       |
+------------------------------------------------------+
| Nav Rail |  Canvas area                              |
| (80px)   |  (fills available space)                  |
|          |                                           |
+------------------------------------------------------+

Frame selected — settings sidebar slides in:
+------------------------------------------------------+
|  Header (45px)                                       |
+------------------------------------------------------+
| Nav Rail |  Canvas area              | Settings      |
| (80px)   |  (flexes to fill)         | Sidebar       |
|          |                           | (320px)       |
| [Panel]  |                           | +----------+  |
| (280px   |                           | | Frame    |  |
|  when    |                           | | Settings |  |
|  pinned) |                           | |          |  |
|          |                           | | Image    |  |
|          |                           | | Settings |  |
|          |                           | +----------+  |
+------------------------------------------------------+

Frame selected + History open — both coexist:
+------------------------------------------------------+
|  Header (45px)                                       |
+------------------------------------------------------+
| Nav Rail |  Canvas area        | Settings | History  |
| (80px)   |  (flexes)           | (320px)  | (320px)  |
|          |                     | +------+  | +------+ |
|          |                     | |Frame |  | |Undo  | |
|          |                     | |Setti.|  | |Redo  | |
|          |                     | |      |  | |List  | |
|          |                     | |Image |  | |      | |
|          |                     | |Setti.|  | |      | |
|          |                     | +------+  | +------+ |
+------------------------------------------------------+
```

- The settings sidebar occupies the **right edge** of the layout, similar to how the left sidebar occupies the left edge.
- **No notch or rail** — when no element is selected, the settings sidebar is completely hidden (0px width). There is no persistent visual indicator. Since visibility is entirely driven by selection state, there is nothing for the user to manually toggle.
- When **a frame is selected**, the right sidebar slides in at 320px, pushing the canvas inward with a smooth transition.
- The canvas area flexes between the left sidebar and the right settings sidebar (and History, if open).

#### Contextual Visibility (Unchanged)

- **Frame Settings**: Visible when a frame is selected (`frameSelectionVisible`)
- **Image Settings**: Visible when a frame with an image is selected (`frameSelectionVisible` + frame has media)
- **When nothing is selected**: Settings sidebar fully disappears (0px, no rail/notch)
- Selection logic remains the same — only the *location* of the panel changes (right sidebar instead of floating)

#### Panel Content — Stacked Sections

When the right sidebar is open, it contains the relevant settings panels **stacked vertically as sections** within the same sidebar:

1. **Frame Settings** (always shown when sidebar is open, since a frame must be selected)
2. **Image Settings** (shown below Frame Settings when the selected frame has an image)

Both sections are visible simultaneously — there is no tab switching or replacing. Each section has its own collapsible header, similar to how the left sidebar has section headers. If the selected frame has no image, only the Frame Settings section appears.

#### History Panel — Separate and Independent

The History panel (`AppShell.Aside`) remains its own independent sidebar. It does **not** merge into or replace the settings sidebar.

- **Both can be open at the same time**: Settings sidebar and History sidebar sit side-by-side. The canvas flexes to accommodate both.
- **No interference**: Opening History does not close Settings, and vice versa. They are independent.
- **Layout order** (left to right): Nav Rail → Canvas → Settings Sidebar → History Sidebar
- History retains its existing toggle notch and `AppShell.Aside` behavior.

#### Panel Height & Scrolling

- The sidebar spans the **full height** of the main content area (below the header, above any footer).
- Content scrolls vertically within the sidebar when it exceeds the available height.
- Use the same `scroll-on-hover` pattern as the left sidebar — scrollbars hidden until hover.

#### Header

The sidebar has a header bar with:
- **Title**: "Settings" (or contextual: "Frame Settings" when only frame is selected)
- **Close button** (X): Deselects the current element, hiding the sidebar

#### Animations

- **Open/close**: `transition: 'width 0.2s ease'` on the sidebar container — matching the left sidebar.
- **Canvas push**: `transition` on the main content area's right padding/margin — matching how `AppShell.Main` animates when the left navbar width changes.

---

### Implementation Plan

#### Step 1: Replace `AppShell.Aside` usage

Currently `AppShell.Aside` is used for the History panel. The right settings sidebar should also use `AppShell.Aside` (or a similar mechanism) to push the canvas content.

**Options:**
- **A)** Use `AppShell.Aside` for the settings sidebar and move History elsewhere (or combine them).
- **B)** Use a custom right sidebar outside of `AppShell.Aside` with manual margin/padding adjustment on the main content area (similar to how navWidth works but for the right side).

**Recommended: Option B** — Keep History on `AppShell.Aside` for now. Create a new right sidebar container that adjusts `AppShell.Main`'s right margin/padding via a state variable (e.g., `settingsWidth`), mirroring the `navWidth` pattern.

#### Step 2: Create `SettingsSidebar` component

A new component that wraps the existing Frame Settings and Image Settings content:

```typescript
interface SettingsSidebarProps {
  /** Whether the sidebar is open (driven by selection state) */
  isOpen: boolean;
  /** Width when open. Default: 320 */
  width?: number;
  /** Callback when user clicks close */
  onClose?: () => void;
  /** The selected frame data */
  selectedFrame?: Frame;
  /** Children or render sections */
  children: React.ReactNode;
}
```

**Behavior:**
- Renders as a fixed-position sidebar on the right edge
- Width transitions between 0px (closed) and 320px (open)
- Contains Frame Settings and Image Settings content in scrollable sections
- Header with title and close button

#### Step 3: Wire up to `AppFrames` layout

In `AppFrames.tsx`:

1. Add `settingsWidth` state (0 or 320), driven by `frameSelectionVisible`
2. Apply right margin/padding to `AppShell.Main` using `settingsWidth`
3. Add transition matching existing sidebar animation
4. Render `SettingsSidebar` alongside `AppShell.Main`
5. Remove existing `FloatingSettingsPanel` instances for Frame and Image settings

#### Step 4: Move settings content into sidebar sections

- Extract the content from `FrameSettingsPanel` and `ImageSettingsPanel` into the new sidebar
- Each section gets a collapsible header (frame settings, image settings)
- Maintain all existing controls and state bindings

#### Step 5: Handle interaction with existing layout elements

- **Left sidebar + Right sidebar**: Both can be open simultaneously. Canvas flexes between them.
- **History panel** (`AppShell.Aside`): Remains completely separate and independent. Both the settings sidebar and History can be open at the same time — they sit side-by-side (Settings to the left of History). The canvas flexes to accommodate all open panels. No changes needed to the History panel itself.
- **Export**: Settings sidebar should be hidden during export (`data-export-hide`)

---

### Persistence

| Key | Purpose |
|-----|---------|
| `settings-sidebar-width` | Sidebar width if user-resizable (future) |

No mode persistence needed in Phase 1 — the sidebar is always pinned, visibility is purely driven by selection state.

---

### Edge Cases

- **Small viewports**: If viewport is too narrow for left sidebar + canvas + settings sidebar (+ History if open), the settings sidebar could overlay instead of push (fallback). Or enforce a minimum canvas width. When all panels are open (left sidebar 360px + settings 320px + history 320px = 1000px), the canvas needs enough remaining space to be usable.
- **History + Settings coexistence**: Both are open simultaneously as independent sidebars. Canvas must flex to accommodate both. Ensure layout doesn't break when all panels are open at once.
- **Rapid selection changes**: Debounce or gate sidebar open/close to avoid flicker when clicking between elements quickly.
- **Canvas zoom/pan**: Ensure canvas zoom calculations account for the reduced canvas width when the settings sidebar is open (and when History is also open).

---

### Success Criteria

- Selecting a frame opens the settings sidebar on the right, pushing the canvas inward with a smooth animation
- Deselecting (clicking empty canvas) fully hides the sidebar (0px, no notch or rail remains)
- Frame Settings and Image Settings appear as **stacked sections** within the same sidebar (both visible simultaneously when applicable)
- Selecting a frame with an image shows both Frame Settings and Image Settings sections; selecting a frame without an image shows only Frame Settings
- All existing settings controls work identically (color picker, sliders, DIY frame options, etc.)
- Left sidebar and right settings sidebar can both be open, canvas flexes between them
- Settings sidebar and History sidebar are **independent** — both can be open at the same time, sitting side-by-side
- Opening/closing History has no effect on the settings sidebar, and vice versa
- Animation timing and easing matches the left sidebar
- Floating panel behavior is fully removed (no dragging, no floating positioning)

---

## Phase 2: Floating / Detachable Mode (Future)

> Full specs for Phase 2 are in a separate document: **[Detachable Settings Panel](./settings-panel-detachable-mode.md)**

Phase 2 adds the ability to detach the pinned sidebar into a floating, draggable panel and reattach it — giving users the choice between pinned and floating modes with persisted preferences.
