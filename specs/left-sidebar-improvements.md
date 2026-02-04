# Left Sidebar Improvements

## Overview

Simplify the left sidebar (`SidebarTabs`) by removing the pin icon and hover-to-preview behavior. Panels always open in docked mode (pushing the canvas) when a tab icon is clicked. A **notch drag handle** on the panel's right edge lets users drag to close the panel — similar to how mobile bottom sheets use a notch to drag-dismiss.

---

## Goals

- **Remove pin icon** — No pin/unpin button in the panel header. The panel is always docked when open — there is no separate "floating" vs "pinned" state to manage.
- **Click to open/close** — Clicking a sidebar icon opens the panel docked. Clicking the same icon again closes it. Simple toggle.
- **Notch to drag-close** — A subtle drag handle on the right edge of the panel lets users drag the panel closed (left) as an alternative to clicking the icon again.
- **Panel stays open** — Clicking on the canvas does not close the panel. Users must explicitly close it (click icon or drag notch).
- **Cleaner UI** — Closer to Canva's sidebar pattern: no pin icon, no hover-to-preview, just click and go.

---

## Current State

The left sidebar currently has two modes:

1. **Hover (floating overlay)**: Hovering over an icon shows the panel as a floating overlay (`position: absolute`, `z-index: 200`, with shadow). Panel disappears when mouse leaves (200ms timeout). Does not push the canvas.
2. **Click (pinned/docked)**: Clicking an icon pins the panel open (`position: relative`, no shadow). Sidebar expands from 80px to 360px, pushing the canvas. A **pin icon** in the header toggles between pinned and unpinned. A close (X) button also appears.

**Problems:**
- The pin icon is unnecessary UI complexity — most users either always pin or never pin.
- Two modes (float vs pin) require users to understand the distinction.
- The hover-to-preview behavior can be annoying if users accidentally trigger panels while moving the mouse across the sidebar.

---

## UX Design

### Opening a Panel

1. User clicks a tab icon in the 80px icon rail (Layout, Device Frame, Text, Layers, Media Library, Settings)
2. Panel immediately opens **docked** — sidebar expands from 80px to 360px with `transition: 'width 0.2s ease'`
3. Canvas pushes to the right to accommodate the expanded sidebar
4. The clicked icon gets a highlighted background to show it's active

### Closing a Panel

Three ways to close:

1. **Click the same icon again** — Toggles the panel closed. Sidebar collapses back to 80px.
2. **Drag the notch** — Grab the notch handle on the panel's right edge and drag left. Once past a threshold, the panel closes.
3. **Close button (X)** — Still available in the panel header as a fallback.

Clicking on the canvas does **not** close the panel. The panel stays open until explicitly closed.

### Switching Panels

- Clicking a **different** tab icon while a panel is open switches the content without closing/reopening. The sidebar stays at 360px — only the panel content changes.

### No Hover Preview

- Hovering over tab icons does **not** open panels. Only a **tooltip** appears on hover showing the tab name.
- This eliminates accidental panel triggers and simplifies the interaction model.

### Notch Drag Handle

```
+--------+--+----------------------------+
| Icon   |  | Panel content              |
| Rail   |  |                            |
| (80px) |  |                            |
|        |  |                            |
|        |  |                            |
|        |  |                            |
|        |  |                            |
|        |  |                            |
+--------+--+----------------------------+
          ^
          Notch (drag handle on right edge)
```

- **Position**: Right edge of the panel (the border between the panel and the canvas)
- **Visual**: A subtle vertical pill/line (similar to mobile bottom sheet notch, but rotated 90 degrees for a vertical edge). Could be:
  - A small vertical line or set of dots (grip indicator)
  - Appears on hover over the edge area
  - Or always visible as a subtle indicator
- **Width**: ~8-12px hit area along the right edge of the panel
- **Cursor**: `col-resize` or `ew-resize` when hovering over the notch area
- **Drag behavior**:
  - Drag left: Panel starts collapsing. If dragged past a threshold (e.g., panel width < 150px or dragged more than 50% of panel width), it snaps closed.
  - Drag right: No effect (panel is already at full width). Could optionally allow resizing wider in the future.
  - Visual feedback during drag: Panel width follows the cursor in real-time
  - On release below threshold: Panel snaps back to full width (280px)
  - On release past threshold: Panel animates closed (sidebar collapses to 80px)

### Panel Header

Updated header (pin icon removed):

```
+-------------------------------------------+
| [Tab Title]                          [X]  |
+-------------------------------------------+
| Panel content...                          |
```

- **Title**: Shows the active tab name (e.g., "Layout", "Device Frame", "Text")
- **Close button (X)**: Small subtle ActionIcon, same as current
- **No pin icon**: Removed entirely
- **No drag handle in header**: Header is no longer draggable (panel is always docked, no floating mode)

### Icon Rail Visual States

| State | Background | Icon Color |
|-------|-----------|------------|
| Inactive | Transparent | Gray (#666) |
| Hover | Light gray (#f5f5f5) | Dark gray (#444) |
| Active (panel open) | Light purple (#f0f0ff) | Purple (#667eea) |

Active state always uses purple highlight since there's only one mode (docked). No distinction between "floating active" and "pinned active" needed.

---

## Layout Diagram

```
Panel closed (default):
+--------+--------------------------------------+
| Icons  |  Canvas                              |
| (80px) |  (fills available space)             |
|        |                                      |
+--------+--------------------------------------+

Panel open:
+--------+--+----------------------+------------+
| Icons  |N | Panel content        |  Canvas    |
| (80px) |o | (280px)              |  (flexes)  |
|        |t |                      |            |
|        |c |                      |            |
|        |h |                      |            |
+--------+--+----------------------+------------+
         (8px)
         Total sidebar width: 80 + 280 = 360px
```

---

## Implementation Plan

### Step 1: Remove pin logic and hover-to-preview

In `SidebarTabs.tsx`:

1. Remove `isPinned` state and `isPinnedRef` — no longer needed
2. Remove `handleTabHover`, `handlePanelHover`, `handlePanelLeave` — no hover preview
3. Remove the pin icon (`IconPin` / `IconPinFilled`) from the panel header
4. Remove the `togglePin` function
5. Keep the close button (X) in the header

### Step 2: Simplify click behavior

Update `handleTabClick`:

```typescript
const handleTabClick = useCallback((tabId: TabId) => {
  if (activeTab === tabId) {
    // Clicking the same icon = close panel
    setActiveTab(null);
    onPanelToggle?.(false);  // collapse sidebar to 80px
  } else {
    // Clicking any icon = open/switch panel
    setActiveTab(tabId);
    onPanelToggle?.(true);   // expand sidebar to 360px
  }
}, [activeTab, onPanelToggle]);
```

### Step 3: Panel is always docked

- Panel always renders with `position: 'relative'` (in layout flow)
- No `position: 'absolute'` path — remove the conditional styling
- No shadow when open (panel is part of the layout, not floating)
- Sidebar width is either 80px (closed) or 360px (open)
- Keep the existing `transition: 'width 0.2s ease'` for smooth animation

### Step 4: Add notch drag handle

1. Add a drag handle element on the right edge of the panel:

```tsx
<Box
  style={{
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    cursor: 'col-resize',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  }}
  onPointerDown={handleNotchDragStart}
>
  {/* Subtle grip indicator */}
  <Box style={{
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  }} />
</Box>
```

2. Implement drag-to-close:

```typescript
const handleNotchDragStart = useCallback((e: React.PointerEvent) => {
  e.currentTarget.setPointerCapture(e.pointerId);
  const startX = e.clientX;
  const panelWidth = 280; // current panel width

  const onMove = (moveEvent: PointerEvent) => {
    const deltaX = moveEvent.clientX - startX;
    const newWidth = Math.max(0, panelWidth + deltaX);
    // Update panel width in real-time (via ref + rAF for performance)
    setPanelDragWidth(newWidth);
  };

  const onUp = (upEvent: PointerEvent) => {
    const deltaX = upEvent.clientX - startX;
    const newWidth = panelWidth + deltaX;

    if (newWidth < 150) {
      // Past threshold — snap closed
      setActiveTab(null);
      onPanelToggle?.(false);
    }
    // Otherwise snap back to full width
    setPanelDragWidth(null);

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}, [onPanelToggle]);
```

### Step 5: Update hover behavior

- Remove `onMouseEnter` / `onMouseLeave` handlers from tab icons
- Add `<Tooltip>` to each icon for name display on hover (if not already present)
- No panel preview on hover — only tooltips

### Step 6: Clean up persistence

- Remove any localStorage keys related to pin state (if any)
- Active tab state can optionally be persisted so the sidebar remembers which panel was last open

---

## Edge Cases

- **Quick tab switching**: Clicking between different icons rapidly should smoothly switch content without animation glitches (sidebar stays at 360px during switches)
- **Notch drag while animating**: If user grabs the notch while the panel is still animating open, cancel the animation and switch to drag-controlled width
- **Small viewports**: On narrow screens, the 360px sidebar might take up too much space. Could cap panel width or make it responsive.
- **Touch devices**: The notch drag should work with touch events (pointer events handle this)
- **Keyboard accessibility**: Tab icons should be keyboard-focusable. Enter/Space toggles the panel. The notch drag doesn't need keyboard support (close button covers that).

---

## Migration Notes

### What changes from current behavior

| Behavior | Before | After |
|----------|--------|-------|
| Hover over icon | Opens floating panel preview | Shows tooltip only |
| Click icon | Pins panel (pushes canvas) | Opens panel docked (pushes canvas) |
| Pin icon in header | Visible — toggles float/pin | Removed |
| Close button (X) | Visible | Visible (unchanged) |
| Click canvas | Panel stays open (if pinned) | Panel stays open |
| Panel styling | Two modes: shadow (float) vs no shadow (pin) | One mode: no shadow (always docked) |
| **New: Notch drag** | N/A | Drag right edge to close |

### What stays the same

- Icon rail (80px, same icons, same order)
- Panel width (280px content area, 360px total)
- Smooth width transition animation (0.2s ease)
- Panel content components (Layout, Device Frame, Text, Layers, Media Library, Settings)
- Active icon highlighting

---

## Success Criteria

- Clicking a sidebar icon opens the panel docked, pushing the canvas with smooth animation
- Clicking the same icon closes the panel
- Clicking a different icon switches the panel content without closing/reopening
- No pin icon appears anywhere in the sidebar
- Hovering over icons shows tooltips only, no panel preview
- The notch drag handle on the right edge lets users drag to close the panel
- Dragging past the threshold snaps the panel closed; releasing before threshold snaps back to full width
- Panel stays open when interacting with the canvas
- Close button (X) in header still works as a fallback
- Animation timing matches current sidebar behavior
