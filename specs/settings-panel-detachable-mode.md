# Detachable Settings Panel (Float / Pin Toggle)

> **Prerequisite:** [Right Settings Sidebar (Phase 1)](./floating-panel-docked-mode.md) must be implemented first.

## Overview

Add the ability to detach the settings panel from the right sidebar (built in Phase 1) and float it freely over the canvas, and reattach it back. This reuses the existing `FloatingSettingsPanel` dragging and resizing infrastructure from the current codebase.

Once Phase 1 converts the settings panels into a pinned right sidebar, this phase gives users the choice to pop it out as a floating panel (restoring the pre-Phase-1 experience) or keep it pinned — and toggle between the two modes at will.

---

## Goals

- **Detach to float** — Users can pop the settings panel out of the right sidebar into a free-floating, draggable panel over the canvas
- **Reattach to pin** — A pin icon on the floating panel snaps it back into the right sidebar
- **Persist preference** — Remember whether the user prefers pinned or floating (and the floating position/size) per session via localStorage
- **Smooth transitions** — Animate between pinned and floating states

---

## UX Design

### Detaching (Sidebar → Floating)

- **Trigger**: Click a "pop out" / detach icon in the sidebar header, OR drag the sidebar header away from the edge
- **Behavior**: The right sidebar collapses (canvas expands back), and the panel appears as a floating card at the position where the sidebar was (or at the last remembered floating position)
- **Visual**: The floating panel matches the current `FloatingSettingsPanel` appearance — card with shadow, rounded corners, drag handle in header

### Floating Mode

- **Draggable**: Header acts as a drag handle. Position updates via `transform: translate3d()` for GPU acceleration.
- **Resizable**: Bottom-right corner resize handle. Min width: 240px, min height: 200px.
- **Position persistence**: Floating position and size stored in localStorage using existing `floating-panel-position-{key}` and `floating-panel-size-{key}` keys.
- **Height**: Grows with content up to a max of `viewport height - 48px`. Scrollbar appears only when content exceeds max height.
- **Interaction lock**: `useInteractionLock()` prevents canvas interaction while dragging/resizing the panel.

### Reattaching (Floating → Sidebar)

- **Trigger**: Click a "pin" / attach icon in the floating panel header
- **Behavior**: The floating panel disappears, and the right sidebar slides in (canvas pushes inward), showing the same settings content
- **Snap zone** (optional): Dragging the floating panel close to the right edge could show a visual hint and snap it back to the sidebar on drop

### Title Bar Icons

| State    | Icon              | Action                    |
|----------|-------------------|---------------------------|
| Pinned   | `IconArrowUpRight` or `IconPinOff` | Click to detach (float)   |
| Floating | `IconPin` or `IconPinFilled`       | Click to reattach (pin)   |

A single pin icon that toggles between states:
- **Outline** (unpinned) = floating → click to pin back to sidebar
- **Filled** (pinned) = sidebar → click to pop out as floating

### Layout Diagram

```
PINNED MODE (Phase 1):
+------------------------------------------------------+
| Nav Rail |  Canvas area              | Settings       |
| (80px)   |  (flexes to fill)         | Sidebar        |
|          |                           | (320px)        |
|          |                           | [Pin icon]     |
+------------------------------------------------------+

FLOATING MODE (Phase 2):
+------------------------------------------------------+
| Nav Rail |  Canvas area                              |
| (80px)   |  (full width)                             |
|          |        +------------------+                |
|          |        | Settings Panel   |                |
|          |        | (draggable)      |                |
|          |        | [Pin icon]       |                |
|          |        +------------------+                |
+------------------------------------------------------+
```

### Multi-Panel Behavior

When floating, Frame Settings and Image Settings can either:
- **Stay combined** in a single floating panel (recommended for simplicity)
- **Float independently** as separate panels with vertical offset (like the pre-Phase-1 behavior)

Recommended: keep them as one combined panel in both pinned and floating modes for consistency.

---

## Component Changes

### `SettingsSidebar` — New Props

These extend the Phase 1 `SettingsSidebarProps` interface:

```typescript
interface SettingsSidebarProps {
  // ... Phase 1 props (isOpen, width, onClose, selectedFrame, children) ...

  /**
   * Current mode. Default: 'pinned'.
   * 'pinned' = right sidebar (Phase 1 behavior)
   * 'floating' = free-floating panel over canvas
   */
  mode?: 'pinned' | 'floating';

  /**
   * Callback when user toggles between pinned and floating.
   */
  onModeChange?: (mode: 'pinned' | 'floating') => void;

  /**
   * Floating position override (loaded from localStorage).
   */
  floatingPosition?: { x: number; y: number };

  /**
   * Floating size override (loaded from localStorage).
   */
  floatingSize?: { width: number; height: number };
}
```

### Internal State

```typescript
// Mode state — persisted to localStorage
const [mode, setMode] = useState<'pinned' | 'floating'>(() => {
  const stored = localStorage.getItem('settings-sidebar-mode');
  return stored === 'floating' ? 'floating' : 'pinned';
});

// Floating position — persisted to localStorage
const [floatPos, setFloatPos] = useState<{ x: number; y: number }>(() => {
  const stored = localStorage.getItem('settings-sidebar-float-position');
  return stored ? JSON.parse(stored) : { x: window.innerWidth - 340, y: 100 };
});

// Floating size — persisted to localStorage
const [floatSize, setFloatSize] = useState<{ width: number; height: number }>(() => {
  const stored = localStorage.getItem('settings-sidebar-float-size');
  return stored ? JSON.parse(stored) : { width: 320, height: 400 };
});
```

---

## Persistence Keys

| Key | Purpose |
|-----|---------|
| `settings-sidebar-mode` | `'pinned'` \| `'floating'` |
| `settings-sidebar-float-position` | `{ x, y }` — last floating position |
| `settings-sidebar-float-size` | `{ width, height }` — last floating size |

---

## Implementation Plan

### Step 1: Add mode state to `SettingsSidebar`

- Add `mode` state (`'pinned' | 'floating'`), initialized from localStorage or default `'pinned'`
- When `mode === 'pinned'`: render as right sidebar (Phase 1 behavior, unchanged)
- When `mode === 'floating'`: render as a portal to `document.body` with absolute/fixed positioning
- Parent (`AppFrames.tsx`) needs to know the mode to set `settingsWidth` to 0 when floating (canvas expands)

### Step 2: Floating rendering path

- Reuse existing `FloatingSettingsPanel` dragging logic (pointer events on header, `requestAnimationFrame` position updates)
- Reuse existing resize handle logic (bottom-right corner, min constraints)
- Apply `transform: translate3d(x, y, 0)` for position, `willChange: 'transform'` for performance
- Z-index: 200 (matching current floating panels)
- Render via `createPortal(panelContent, document.body)` to escape layout stacking contexts

### Step 3: Detach / Attach UI

- Add pin/detach icon button to the sidebar header (Phase 1 header gains a new button)
- Add pin/attach icon button to the floating panel header
- On detach:
  1. Set `mode = 'floating'`
  2. Call `onModeChange?.('floating')` so parent sets `settingsWidth = 0`
  3. Compute initial floating position (sidebar's screen position, or last stored position)
  4. Persist `'floating'` to localStorage
- On attach:
  1. Set `mode = 'pinned'`
  2. Call `onModeChange?.('pinned')` so parent sets `settingsWidth = 320`
  3. Persist `'pinned'` to localStorage
  4. Store current floating position for next time

### Step 4: Drag-to-detach (optional polish)

- When pinned, allow dragging the sidebar header
- On drag start beyond a threshold (e.g., 20px away from right edge): switch to floating mode at the current pointer position
- Provides discoverability without requiring the icon

### Step 5: Transition animation (optional polish)

- Animate the panel from its pinned position to the floating position (and vice versa) using a brief CSS transition or `framer-motion`
- Sidebar collapse/expand already animates from Phase 1; the floating panel could fade in simultaneously
- Sequence: sidebar starts collapsing → floating panel fades in at target position (staggered ~100ms)

---

## Edge Cases

- **Mode switch while scrolled**: Preserve scroll position in settings content when switching between pinned and floating
- **Floating panel off-screen**: If stored floating position would place the panel off-screen (e.g., window resized smaller), clamp to visible viewport with 20px margin
- **Selection cleared while floating**: If the user deselects while floating, hide the floating panel (same contextual visibility rules from Phase 1 apply)
- **Resize constraints**: Floating panel min size must accommodate all settings controls without breaking layout
- **History panel**: When floating, the settings panel no longer conflicts with History for right-side space — both can coexist naturally
- **Window resize**: If window shrinks while floating, recheck that panel is still within viewport bounds
- **Quick toggle**: If user rapidly toggles pin/float, debounce the animation to avoid visual glitching

---

## Success Criteria

- Users can detach the settings sidebar into a floating panel via a header icon
- The floating panel is draggable and resizable with the same quality as the current `FloatingSettingsPanel`
- Users can reattach the floating panel back to the right sidebar via a pin icon
- Preference (pinned vs floating) persists across sessions
- Floating position and size persist across sessions
- Contextual visibility rules still apply in both modes (panel hides when nothing is selected)
- Canvas expands to full width when panel is floating (no dead space on the right)
- Transition between modes feels smooth and intentional
