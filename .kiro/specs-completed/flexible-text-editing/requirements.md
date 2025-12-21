# Flexible Text Editing System

## Overview

Replace the current single-caption system with a flexible multi-text editing system similar to Canva, where users can add unlimited text elements, each independently editable with full styling controls and transformations (position, rotation, scale).

## Current State

The app currently has:
- Single caption toggle (Show Caption switch)
- One text element per screen with limited positioning
- `DraggableText` component with drag and double-click editing
- `TextStylePanel` with comprehensive styling options
- `TextTab` in sidebar for caption controls

**Problems:**
- Limited to one text element per screen
- "Caption" terminology is limiting (implies single subtitle)
- No rotation or advanced transformations
- No layer management for multiple text elements

## User Stories

### Core Functionality

**US-1: Add Multiple Text Elements**
- As a user, I want to add multiple text elements to my canvas
- So that I can create rich, multi-layered designs with headlines, subheadings, and body text

**Acceptance Criteria:**
- Click "Add Text" button to create new text element
- Default text appears at canvas center: "Double-click to edit"
- No limit on number of text elements per screen
- Each text element is independent with its own styling

**US-2: Edit Text Content**
- As a user, I want to double-click any text to edit its content
- So that I can quickly update text without navigating menus

**Acceptance Criteria:**
- Double-click enters edit mode with text selected
- Textarea expands to fit content
- Enter key saves and exits edit mode
- Escape key cancels and reverts changes
- Click outside text also saves changes

**US-3: Position Text Elements**
- As a user, I want to drag text elements anywhere on the canvas
- So that I can precisely position text in my design

**Acceptance Criteria:**
- Drag text element to move it
- Cursor changes to grab/grabbing
- Smooth dragging with no lag
- Position persists when switching screens
- Visual feedback (highlight border) when hovering

**US-4: Rotate Text Elements**
- As a user, I want to rotate text at any angle
- So that I can create dynamic, angled text designs

**Acceptance Criteria:**
- Rotation handle appears when text is selected
- Drag rotation handle to rotate around center point
- Display rotation angle while dragging (e.g., "45°")
- Snap to 0°, 45°, 90°, 135°, 180° when close (within 5°)
- Rotation persists across sessions

**US-5: Select and Style Individual Text**
- As a user, I want to click a text element to select it and see its styling options
- So that I can customize each text element independently

**Acceptance Criteria:**
- Click text to select (shows selection border)
- Selected text shows in Text tab with all style controls
- Style changes apply only to selected text
- Selection persists when switching between tabs
- Click canvas background to deselect

**US-6: Delete Text Elements**
- As a user, I want to delete text elements I no longer need
- So that I can keep my canvas clean

**Acceptance Criteria:**
- Delete button appears when text is selected
- Keyboard shortcut: Delete or Backspace key
- Confirmation not required (can undo via browser)
- Cannot delete if it's the last text element (optional)

### Layer Management

**US-7: Reorder Text Layers**
- As a user, I want to control which text appears on top
- So that I can layer text elements correctly

**Acceptance Criteria:**
- Text tab shows list of all text elements
- Drag to reorder in layer stack
- "Bring to Front" and "Send to Back" buttons
- Visual indicator of layer order (z-index)

**US-8: Show/Hide Text Elements**
- As a user, I want to temporarily hide text without deleting it
- So that I can experiment with different layouts

**Acceptance Criteria:**
- Eye icon toggle in text list
- Hidden text not visible on canvas or in export
- Hidden text still editable when selected in list

**US-9: Name Text Elements**
- As a user, I want to name my text elements
- So that I can identify them easily in the layer list

**Acceptance Criteria:**
- Default names: "Text 1", "Text 2", etc.
- Click name to rename inline
- Names shown in layer list
- Names not visible on canvas

## UI Changes

### Remove Caption-Specific UI
- ❌ Remove "Show Caption" toggle
- ❌ Remove "Caption Text" label
- ❌ Remove `captionText`, `showCaption`, `captionStyle` from CanvasSettings
- ❌ Remove `captionVertical`, `captionHorizontal` positioning (replaced by per-text x/y/rotation)

### New Text Tab Layout

```
┌─────────────────────────────────┐
│ Text                            │
├─────────────────────────────────┤
│ [+ Add Text]          [🗑️ Delete]│
├─────────────────────────────────┤
│ Layers                          │
│ ┌─────────────────────────────┐ │
│ │ 👁️ Text 1          ⋮⋮⋮      │ │
│ │ 👁️ Headline        ⋮⋮⋮      │ │ ← Drag to reorder
│ │ 👁️ Subheading      ⋮⋮⋮      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Style (when text selected)      │
│ Font Family: [Inter      ▼]    │
│ Font Size: [━━━━●━━━━] 32      │
│ Font Style: [Bold ▼] [I] [Aa]  │
│ Text Color: [●] #1a1a1a        │
│ Alignment: [≡] [≡] [≡]         │
│ ▼ Background                    │
│ ▼ Text Shadow                   │
│ ▼ Advanced                      │
└─────────────────────────────────┘
```

### Canvas Interaction

**Text Element States:**
1. **Default** - Normal appearance
2. **Hover** - Dashed border, "Drag to move, double-click to edit" tooltip
3. **Selected** - Solid border, rotation handle, resize handles (future)
4. **Editing** - White background, focused textarea, save/cancel hint

**Selection Indicators:**
- Selected: 2px solid violet border
- Rotation handle: Circle at top with rotation icon
- Delete button: X icon in top-right corner

## Data Model Changes

### New TextElement Interface

```typescript
interface TextElement {
  id: string;                    // Unique identifier
  content: string;               // Text content (supports markdown)
  x: number;                     // Position X (0-100%)
  y: number;                     // Position Y (0-100%)
  rotation: number;              // Rotation angle in degrees (0-360)
  style: TextStyle;              // All styling properties
  visible: boolean;              // Show/hide toggle
  name: string;                  // User-defined name
  zIndex: number;                // Layer order
}
```

### Updated Screen Interface

```typescript
interface Screen {
  id: string;
  images: ScreenImage[];
  name: string;
  settings: Omit<CanvasSettings, 'selectedScreenIndex'>;
  textElements: TextElement[];   // NEW: Array of text elements
}
```

### Updated CanvasSettings Interface

Remove caption-specific fields:
```typescript
interface CanvasSettings {
  canvasSize: string;
  deviceFrame: string;
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan';
  compositionScale: number;
  // ❌ REMOVE: captionVertical
  // ❌ REMOVE: captionHorizontal
  // ❌ REMOVE: captionText
  // ❌ REMOVE: showCaption
  // ❌ REMOVE: captionStyle
  selectedScreenIndex: number;
  selectedTextId?: string;       // NEW: Currently selected text element
  screenScale: number;
  screenPanX: number;
  screenPanY: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
}
```

## Technical Requirements

### Components to Create

1. **TextElement.tsx** - Individual text element with drag, rotate, edit
2. **TextLayerList.tsx** - Layer management UI with reordering
3. **TextToolbar.tsx** - Quick actions (add, delete, bring forward, etc.)

### Components to Update

1. **TextTab.tsx** - Replace caption UI with layer list + style panel
2. **Canvas.tsx** - Render multiple text elements, handle selection
3. **CompositionRenderer.tsx** - Render all visible text elements in export
4. **FramesContext.tsx** - Add text element management functions

### State Management Functions

```typescript
// Add to FramesContext
addTextElement: (screenId: string) => void;
updateTextElement: (screenId: string, textId: string, updates: Partial<TextElement>) => void;
deleteTextElement: (screenId: string, textId: string) => void;
reorderTextElements: (screenId: string, fromIndex: number, toIndex: number) => void;
selectTextElement: (textId: string | null) => void;
duplicateTextElement: (screenId: string, textId: string) => void;
```

### Persistence

- Text elements stored in IndexedDB as part of Screen object
- Auto-save on any text change (debounced)
- Migration needed for existing screens with old caption data

## Migration Strategy

For existing users with caption data:

```typescript
// Convert old caption to first text element
if (screen.settings.showCaption && screen.settings.captionText) {
  screen.textElements = [{
    id: generateId(),
    content: screen.settings.captionText,
    x: screen.settings.captionHorizontal || 50,
    y: screen.settings.captionVertical || 50,
    rotation: 0,
    style: screen.settings.captionStyle || DEFAULT_TEXT_STYLE,
    visible: true,
    name: 'Text 1',
    zIndex: 1,
  }];
  
  // Clean up old fields
  delete screen.settings.captionText;
  delete screen.settings.showCaption;
  delete screen.settings.captionStyle;
  delete screen.settings.captionVertical;
  delete screen.settings.captionHorizontal;
}
```

## Future Enhancements (Out of Scope)

- Resize handles for text bounding box
- Text effects (outline, gradient, shadow presets)
- Text templates/presets
- Font upload support
- Text animation (for video export)
- Group/ungroup text elements
- Align/distribute tools
- Copy/paste text between screens

## Success Metrics

- Users can add 5+ text elements per screen
- Text editing feels responsive (< 100ms interaction delay)
- No data loss during migration from caption system
- Export includes all visible text elements correctly positioned and rotated

## Dependencies

- Existing `TextStyle` interface (keep as-is)
- Existing `TextStylePanel` component (reuse)
- Existing `DraggableText` drag logic (enhance with rotation)
- `react-markdown` for text rendering (already installed)

## Notes

- Keep markdown support for text content (bold, italic, lists, etc.)
- Maintain 2x export resolution for crisp text
- Ensure text is selectable/editable even when rotated
- Consider touch device support for rotation gesture
