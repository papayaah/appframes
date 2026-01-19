# Floating Settings Panel (Draggable Context Panel)

## Overview

Convert context-specific settings panels (like "Selected Image" controls) from the fixed Sidebar into **floating, draggable panels** that appear near the canvas selection. This creates a reusable component pattern for contextual settings that can be used for:
- Image/device frame settings (Scale, Pan X, Pan Y)
- Text element settings (font, color, style)
- Frame transform settings (position, scale, rotation)
- Future context-specific controls

## Current state

- **"Selected Image" panel** is currently in `components/AppFrames/Sidebar.tsx` (lines 290-354)
- Contains: Scale slider, Pan X/Y inputs, Reset button
- Fixed position in the sidebar (not contextual to selection)
- Takes up sidebar space even when not relevant

## Goals

- **Floating panel**: Appears as an overlay near the canvas, not in the sidebar
- **Draggable**: Users can drag the panel to reposition it
- **Contextual**: Only appears when relevant (e.g., when a frame is selected)
- **Reusable component**: Shared `FloatingSettingsPanel` component for all context panels
- **Smart positioning**: Auto-positions near the selection, but user can override by dragging

## UX design

### Panel appearance

- **Card-style**: White background, subtle shadow, rounded corners
- **Header**: Title + drag handle (grip icon) + optional close button
- **Content area**: Flexible content slot (any React children)
- **Size**: Compact width (~280px), height adapts to content
- **Z-index**: High enough to float above canvas but below modals

### Positioning behavior

1. **Initial position**: When panel first appears, position it:
   - Near the selected element (frame/text) if visible on canvas
   - Or near the canvas center if selection is off-screen
   - Avoid overlapping the selection itself
   - Stay within viewport bounds

2. **User dragging**: Once user drags the panel, remember that position for future appearances

3. **Viewport constraints**: Panel should not be draggable outside the viewport (clamp to edges)

### Drag interaction

- **Drag handle**: Header area (or explicit grip icon) is draggable
- **Visual feedback**: Slight opacity change or shadow increase while dragging
- **Snap behavior** (optional): Snap to edges or corners when near viewport boundaries

## Component API

### `FloatingSettingsPanel` component

```typescript
interface FloatingSettingsPanelProps {
  // Content
  title: string;
  subtitle?: string; // Optional subtitle (e.g., "Slot 3")
  children: React.ReactNode;
  
  // Visibility
  isOpen: boolean;
  onClose?: () => void; // Optional close handler
  
  // Positioning
  initialPosition?: { x: number; y: number }; // Optional override
  anchorToElement?: HTMLElement | null; // Element to position relative to
  anchorOffset?: { x: number; y: number }; // Offset from anchor (default: { x: 20, y: 20 })
  
  // Persistence
  positionKey?: string; // Key for localStorage to persist position per panel type
  onPositionChange?: (position: { x: number; y: number }) => void;
  
  // Styling
  width?: number; // Default: 280
  maxHeight?: number; // Optional max height with scroll
}
```

### Usage example: Image settings panel

```tsx
<FloatingSettingsPanel
  title="Selected Image"
  subtitle={`Slot ${selectedFrameIndex + 1}`}
  isOpen={selectedFrameIndex !== null}
  anchorToElement={selectedFrameElement} // DOM ref to selected frame
  positionKey="image-settings-panel"
  onClose={() => setSelectedFrameIndex(null)}
>
  <Text size="xs" c="dimmed" mb="xs" mt="md">SCALE</Text>
  <Slider
    value={settings.screenScale}
    onChange={(value) => setSettings({ ...settings, screenScale: value })}
    min={0}
    max={100}
    label={(value) => `${value}%`}
  />
  {/* Pan X, Pan Y, Reset button... */}
</FloatingSettingsPanel>
```

## Technical design

### Positioning logic

```typescript
function calculateInitialPosition(
  anchorElement: HTMLElement | null,
  panelWidth: number,
  panelHeight: number,
  viewport: { width: number; height: number }
): { x: number; y: number } {
  if (!anchorElement) {
    // Center of viewport
    return {
      x: (viewport.width - panelWidth) / 2,
      y: (viewport.height - panelHeight) / 2,
    };
  }
  
  const rect = anchorElement.getBoundingClientRect();
  const anchorX = rect.right + 20; // 20px offset to the right
  const anchorY = rect.top;
  
  // Clamp to viewport
  return {
    x: Math.min(anchorX, viewport.width - panelWidth - 20),
    y: Math.max(20, Math.min(anchorY, viewport.height - panelHeight - 20)),
  };
}
```

### Drag implementation

- Use the same "preview in rAF, commit on end" pattern as frame dragging
- Store drag position in component state
- Optionally persist to localStorage using `positionKey`
- On drag end, save position for next appearance

### Portal rendering

- Render panel via React Portal (`createPortal`) to avoid z-index issues
- Portal target: a container div positioned absolutely over the canvas area
- Ensure portal container doesn't interfere with canvas interactions

## Implementation plan

1. **Create `FloatingSettingsPanel` component**
   - `components/AppFrames/FloatingSettingsPanel.tsx`
   - Implement drag logic with rAF preview
   - Implement positioning logic
   - Add localStorage persistence (optional)

2. **Extract "Selected Image" panel content**
   - Create `ImageSettingsPanel.tsx` (content only, no positioning)
   - Move Scale, Pan X/Y, Reset controls into this component

3. **Integrate into `AppFrames.tsx` or `Canvas.tsx`**
   - Render `FloatingSettingsPanel` wrapping `ImageSettingsPanel`
   - Pass selected frame element ref for anchoring
   - Show/hide based on `selectedFrameIndex !== null`

4. **Remove from Sidebar**
   - Remove "Selected Image" section from `Sidebar.tsx`
   - Keep other sidebar content (Composition, Background Color, etc.)

5. **Test and refine**
   - Test positioning near canvas edges
   - Test dragging and persistence
   - Test with multiple canvas screens
   - Ensure panel doesn't interfere with canvas interactions

## Future use cases

Once `FloatingSettingsPanel` exists, it can be reused for:

- **Text element settings**: When a text element is selected, show font/style/color controls
- **Frame transform settings**: Position, scale, rotation controls for selected frame
- **Layer properties**: If we add a layers panel, show properties for selected layer
- **Custom panels**: Any context-specific settings that should appear near the selection

## Edge cases

- **Multiple selections**: If multiple frames are selected, show panel for primary selection
- **Off-screen selection**: If selected element is scrolled out of view, position panel at canvas center
- **Small viewports**: On mobile/small screens, panel might need to be full-width or modal-style
- **Panel collision**: If multiple panels could appear (future), ensure they don't overlap
- **Export**: Panel should be hidden during export (use `data-export-hide` attribute)
