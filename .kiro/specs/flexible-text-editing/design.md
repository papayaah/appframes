# Design Document

## Overview

This design replaces the single-caption system with a flexible multi-text editing system. Users can add unlimited text elements, each with independent positioning, rotation, and styling. The solution extends the existing `DraggableText` component and `TextStylePanel` while introducing new layer management and rotation capabilities.

## Architecture

The enhancement follows the existing architecture pattern:
- **FramesContext.tsx**: Manages text element state and operations
- **TextElement.tsx**: Individual text component with drag, rotate, edit (replaces DraggableText)
- **TextTab.tsx**: Layer list + style panel UI (replaces caption UI)
- **Canvas.tsx**: Renders all text elements, handles selection
- **CompositionRenderer.tsx**: Exports all visible text elements
- **lib/PersistenceDB.ts**: Persists text elements as part of Screen data

Data flow:
1. User clicks "Add Text" in TextTab
2. FramesContext creates new TextElement with default values
3. Canvas renders TextElement component
4. User interacts: drag to move, rotate handle to rotate, double-click to edit
5. Changes update FramesContext state
6. Auto-save persists to IndexedDB (debounced)

## Components and Interfaces

### New TextElement Interface

```typescript
interface TextElement {
  id: string;                    // Unique identifier (nanoid or uuid)
  content: string;               // Text content (supports markdown)
  x: number;                     // Position X (0-100% of canvas)
  y: number;                     // Position Y (0-100% of canvas)
  rotation: number;              // Rotation angle in degrees (0-360)
  style: TextStyle;              // All styling properties (reuse existing)
  visible: boolean;              // Show/hide toggle
  name: string;                  // User-defined name
  zIndex: number;                // Layer order (higher = on top)
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

```typescript
interface CanvasSettings {
  canvasSize: string;
  deviceFrame: string;
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan';
  compositionScale: number;
  selectedScreenIndex: number;
  selectedTextId?: string;       // NEW: Currently selected text element ID
  screenScale: number;
  screenPanX: number;
  screenPanY: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  
  // REMOVED: captionVertical, captionHorizontal, captionText, showCaption, captionStyle
}
```

### New TextElement Component

**File:** `components/AppFrames/TextElement.tsx`

**Props:**
```typescript
interface TextElementProps {
  element: TextElement;
  isSelected: boolean;
  canvasWidth: number;           // For calculating absolute positions
  canvasHeight: number;
  onUpdate: (updates: Partial<TextElement>) => void;
  onSelect: () => void;
  onDelete: () => void;
}
```

**Features:**
- Drag to move (reuse DraggableText logic)
- Double-click to edit content
- Rotation handle at top center
- Delete button (X) in top-right when selected
- Selection border (violet, 2px solid)
- Hover state (dashed border)
- Transform: `translate(-50%, -50%) rotate(${rotation}deg)`

**Rotation Handle:**
- Circle positioned at top center of bounding box
- Icon: `IconRotate` from Tabler Icons
- Drag to rotate around element center
- Display angle tooltip while dragging
- Snap to 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315° when within 5°

### Updated TextTab Component

**File:** `components/AppFrames/TextTab.tsx`

**Layout:**
```
┌─────────────────────────────────┐
│ [+ Add Text]          [🗑️ Delete]│ ← Toolbar
├─────────────────────────────────┤
│ Layers                          │
│ ┌─────────────────────────────┐ │
│ │ 👁️ Text 1          ⋮⋮⋮      │ │ ← Drag handle
│ │ 👁️ Headline        ⋮⋮⋮      │ │
│ │ 👁️ Subheading      ⋮⋮⋮      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Style (when text selected)      │
│ [TextStylePanel component]      │
└─────────────────────────────────┘
```

**Components:**
- `Button` with `IconPlus` for "Add Text"
- `Button` with `IconTrash` for "Delete" (disabled if no selection)
- `TextLayerList` component for layer management
- `TextStylePanel` (reuse existing, no changes needed)

### New TextLayerList Component

**File:** `components/AppFrames/TextLayerList.tsx`

**Props:**
```typescript
interface TextLayerListProps {
  elements: TextElement[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, name: string) => void;
}
```

**Features:**
- List of text elements sorted by zIndex (highest first)
- Each item shows: eye icon, name, drag handle
- Click item to select
- Click eye to toggle visibility
- Click name to rename inline
- Drag item to reorder (updates zIndex)
- Use `@dnd-kit/core` for drag-and-drop (already in project? Check package.json)
- Alternative: Use Mantine's built-in drag utilities or simple mouse events

### Updated Canvas Component

**File:** `components/AppFrames/Canvas.tsx`

**Changes:**
- Render all text elements from current screen
- Handle click on canvas background to deselect
- Pass selection state to each TextElement
- Layer text elements by zIndex

**Rendering:**
```typescript
{currentScreen.textElements
  .filter(el => el.visible)
  .sort((a, b) => a.zIndex - b.zIndex)
  .map(element => (
    <TextElement
      key={element.id}
      element={element}
      isSelected={settings.selectedTextId === element.id}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      onUpdate={(updates) => updateTextElement(element.id, updates)}
      onSelect={() => selectTextElement(element.id)}
      onDelete={() => deleteTextElement(element.id)}
    />
  ))}
```

### Updated CompositionRenderer Component

**File:** `components/AppFrames/CompositionRenderer.tsx`

**Changes:**
- Render all visible text elements in export
- Apply same transforms (position, rotation)
- Ensure text is crisp at 2x resolution
- Layer by zIndex

### Updated FramesContext

**File:** `components/AppFrames/FramesContext.tsx`

**New State:**
```typescript
const [selectedTextId, setSelectedTextId] = useState<string | undefined>();
```

**New Functions:**
```typescript
const addTextElement = useCallback((screenId: string) => {
  const screen = findScreenById(screenId);
  if (!screen) return;
  
  const newElement: TextElement = {
    id: generateId(),
    content: 'Double-click to edit',
    x: 50,
    y: 50,
    rotation: 0,
    style: { ...DEFAULT_TEXT_STYLE },
    visible: true,
    name: `Text ${screen.textElements.length + 1}`,
    zIndex: screen.textElements.length + 1,
  };
  
  screen.textElements.push(newElement);
  setSelectedTextId(newElement.id);
  triggerSave();
}, []);

const updateTextElement = useCallback((
  screenId: string,
  textId: string,
  updates: Partial<TextElement>
) => {
  const screen = findScreenById(screenId);
  const element = screen?.textElements.find(el => el.id === textId);
  if (element) {
    Object.assign(element, updates);
    triggerSave();
  }
}, []);

const deleteTextElement = useCallback((screenId: string, textId: string) => {
  const screen = findScreenById(screenId);
  if (screen) {
    screen.textElements = screen.textElements.filter(el => el.id !== textId);
    if (selectedTextId === textId) {
      setSelectedTextId(undefined);
    }
    triggerSave();
  }
}, [selectedTextId]);

const reorderTextElements = useCallback((
  screenId: string,
  fromIndex: number,
  toIndex: number
) => {
  const screen = findScreenById(screenId);
  if (!screen) return;
  
  const elements = [...screen.textElements];
  const [moved] = elements.splice(fromIndex, 1);
  elements.splice(toIndex, 0, moved);
  
  // Update zIndex based on new order
  elements.forEach((el, idx) => {
    el.zIndex = idx + 1;
  });
  
  screen.textElements = elements;
  triggerSave();
}, []);

const selectTextElement = useCallback((textId: string | null) => {
  setSelectedTextId(textId || undefined);
}, []);

const duplicateTextElement = useCallback((screenId: string, textId: string) => {
  const screen = findScreenById(screenId);
  const element = screen?.textElements.find(el => el.id === textId);
  if (element) {
    const duplicate: TextElement = {
      ...element,
      id: generateId(),
      name: `${element.name} Copy`,
      x: element.x + 5,
      y: element.y + 5,
      zIndex: screen.textElements.length + 1,
    };
    screen.textElements.push(duplicate);
    setSelectedTextId(duplicate.id);
    triggerSave();
  }
}, []);
```

**Context Value:**
```typescript
{
  // ... existing values
  selectedTextId,
  addTextElement,
  updateTextElement,
  deleteTextElement,
  reorderTextElements,
  selectTextElement,
  duplicateTextElement,
}
```

## Correctness Properties

### Property 1: Text element persistence
*For any* text element created or modified, the changes should be saved to IndexedDB and restored on page reload.
**Validates: Requirements US-1, US-2, US-3, US-4**

### Property 2: Independent text styling
*For any* text element, style changes should only affect that element and not other text elements on the same screen.
**Validates: Requirements US-5**

### Property 3: Rotation transform correctness
*For any* rotation angle, the text element should rotate around its center point and maintain correct positioning.
**Validates: Requirements US-4**

### Property 4: Layer order consistency
*For any* reordering operation, text elements should render in the correct z-index order on canvas and in export.
**Validates: Requirements US-7**

### Property 5: Selection state consistency
*For any* selection change, only one text element should be selected at a time, and the style panel should reflect the selected element's properties.
**Validates: Requirements US-5**

### Property 6: Visibility toggle correctness
*For any* text element with visible=false, it should not appear on canvas or in exported image.
**Validates: Requirements US-8**

### Property 7: Migration data integrity
*For any* existing screen with caption data, the caption should be converted to a text element without data loss.
**Validates: Migration Strategy**

## Error Handling

### Text Element Operations
- **Add text with no screen**: Log error, show alert
- **Update non-existent text**: Log warning, no-op
- **Delete last text element**: Allow (no minimum requirement)
- **Invalid rotation angle**: Clamp to 0-360 range

### Rotation Handling
- **Rotation beyond 360°**: Normalize to 0-360 range
- **Negative rotation**: Convert to positive equivalent (e.g., -45° → 315°)
- **NaN rotation**: Default to 0°

### Migration Errors
- **Missing caption data**: Skip migration, create empty textElements array
- **Invalid caption style**: Use DEFAULT_TEXT_STYLE
- **Invalid position values**: Default to center (50, 50)

### User Feedback
- Success: Text appears immediately on canvas
- Failure: Alert dialog with error message
- Loading: No loading state needed (operations are synchronous)

## Testing Strategy

### Unit Tests

**TextElement Component:**
- Test drag to move updates x, y
- Test double-click enters edit mode
- Test rotation handle updates rotation angle
- Test delete button calls onDelete
- Test selection border appears when isSelected=true

**TextLayerList Component:**
- Test reorder updates zIndex correctly
- Test visibility toggle updates visible property
- Test rename updates name property
- Test selection highlights correct item

**FramesContext Functions:**
- Test addTextElement creates element with correct defaults
- Test updateTextElement modifies only target element
- Test deleteTextElement removes element and clears selection
- Test reorderTextElements updates zIndex values
- Test duplicateTextElement creates copy with offset position

### Property-Based Tests

Property-based testing will use **fast-check** library for TypeScript/React testing.

Each property test should run a minimum of 100 iterations.

**Property Test 1: Text element persistence**
- Generate random TextElement objects
- Add to screen via addTextElement
- Verify element exists in state
- Simulate save/reload cycle
- Verify element restored correctly
- Tag: **Feature: flexible-text-editing, Property 1: Text element persistence**

**Property Test 2: Independent text styling**
- Generate random screen with multiple text elements
- Update style of one element
- Verify other elements unchanged
- Tag: **Feature: flexible-text-editing, Property 2: Independent text styling**

**Property Test 3: Rotation transform correctness**
- Generate random rotation angles (-720 to 720)
- Apply to text element
- Verify normalized to 0-360 range
- Verify transform CSS is correct
- Tag: **Feature: flexible-text-editing, Property 3: Rotation transform correctness**

**Property Test 4: Layer order consistency**
- Generate random array of text elements
- Reorder randomly
- Verify zIndex values are sequential
- Verify render order matches zIndex
- Tag: **Feature: flexible-text-editing, Property 4: Layer order consistency**

**Property Test 5: Selection state consistency**
- Generate random screen with multiple text elements
- Select each element sequentially
- Verify only one selected at a time
- Verify selectedTextId matches
- Tag: **Feature: flexible-text-editing, Property 5: Selection state consistency**

**Property Test 6: Visibility toggle correctness**
- Generate random text elements with random visibility
- Render canvas
- Verify only visible elements rendered
- Verify export excludes hidden elements
- Tag: **Feature: flexible-text-editing, Property 6: Visibility toggle correctness**

**Property Test 7: Migration data integrity**
- Generate random caption data (old format)
- Run migration function
- Verify text element created with correct content, position, style
- Verify old fields removed
- Tag: **Feature: flexible-text-editing, Property 7: Migration data integrity**

### Integration Tests
- Test full flow: add text → edit → style → rotate → export
- Test multi-text scenario with 5+ elements
- Test migration from old caption system
- Test keyboard shortcuts (Delete key)

## Implementation Notes

### Rotation Implementation

**Rotation Handle:**
```typescript
const handleRotationMouseDown = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  const centerX = /* calculate center X */;
  const centerY = /* calculate center Y */;
  const startAngle = Math.atan2(
    e.clientY - centerY,
    e.clientX - centerX
  ) * (180 / Math.PI);
  
  const handleMove = (moveEvent: MouseEvent) => {
    const currentAngle = Math.atan2(
      moveEvent.clientY - centerY,
      moveEvent.clientX - centerX
    ) * (180 / Math.PI);
    
    let newRotation = element.rotation + (currentAngle - startAngle);
    
    // Normalize to 0-360
    newRotation = ((newRotation % 360) + 360) % 360;
    
    // Snap to common angles
    const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    for (const snap of snapAngles) {
      if (Math.abs(newRotation - snap) < 5) {
        newRotation = snap;
        break;
      }
    }
    
    onUpdate({ rotation: newRotation });
  };
  
  const handleEnd = () => {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
  };
  
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
};
```

**Transform CSS:**
```typescript
style={{
  position: 'absolute',
  left: `${element.x}%`,
  top: `${element.y}%`,
  transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
  transformOrigin: 'center center',
  zIndex: element.zIndex,
}}
```

### Migration Function

```typescript
function migrateScreenToTextElements(screen: Screen): Screen {
  // Check if already migrated
  if (screen.textElements && screen.textElements.length > 0) {
    return screen;
  }
  
  // Initialize empty array
  screen.textElements = [];
  
  // Migrate old caption if exists
  const settings = screen.settings as any; // Cast to access old fields
  if (settings.showCaption && settings.captionText) {
    const textElement: TextElement = {
      id: generateId(),
      content: settings.captionText,
      x: settings.captionHorizontal ?? 50,
      y: settings.captionVertical ?? 50,
      rotation: 0,
      style: settings.captionStyle ?? { ...DEFAULT_TEXT_STYLE },
      visible: true,
      name: 'Text 1',
      zIndex: 1,
    };
    
    screen.textElements.push(textElement);
    
    // Clean up old fields
    delete settings.captionText;
    delete settings.showCaption;
    delete settings.captionStyle;
    delete settings.captionVertical;
    delete settings.captionHorizontal;
  }
  
  return screen;
}

// Run migration on all screens during app initialization
function migrateAllScreens(screensByCanvasSize: Record<string, Screen[]>) {
  Object.values(screensByCanvasSize).forEach(screens => {
    screens.forEach(screen => migrateScreenToTextElements(screen));
  });
}
```

### ID Generation

Use existing ID generation pattern from the codebase:
```typescript
function generateId(): string {
  return `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

Or install `nanoid` if not already present:
```bash
npm install nanoid
```

```typescript
import { nanoid } from 'nanoid';

function generateId(): string {
  return nanoid();
}
```

### Keyboard Shortcuts

Add keyboard event listener in Canvas or AppFrames:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedTextId && (e.key === 'Delete' || e.key === 'Backspace')) {
      // Prevent if user is editing text
      if (document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      deleteTextElement(currentScreenId, selectedTextId);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedTextId, deleteTextElement]);
```

## Performance Considerations

- **Rendering**: Text elements render independently, no performance impact for 10-20 elements
- **Rotation**: CSS transforms are GPU-accelerated, smooth performance
- **Drag operations**: Use requestAnimationFrame for smooth dragging if needed
- **Auto-save**: Debounce saves to 500ms to avoid excessive IndexedDB writes
- **Export**: html-to-image handles text transforms correctly

## Browser Compatibility

- **CSS Transforms**: Universal support
- **Rotation**: Supported in all modern browsers
- **Markdown rendering**: react-markdown already in use
- **IndexedDB**: Universal support

## Dependencies

**Existing (no installation needed):**
- `react-markdown` - Text rendering
- `@mantine/core` - UI components
- `@tabler/icons-react` - Icons
- `idb` - IndexedDB wrapper

**New (check if needed):**
- `nanoid` - ID generation (optional, can use timestamp-based IDs)
- `@dnd-kit/core` - Drag-and-drop for layer list (optional, can use mouse events)

## Future Enhancements

- Resize handles for text bounding box
- Text alignment guides (snap to other elements)
- Text effects presets (gradient, outline, glow)
- Font upload support
- Text templates library
- Group/ungroup text elements
- Copy/paste between screens
- Undo/redo for text operations
- Text animation (for video export)
- Rich text editor (bold, italic, color within text)

## Migration Timeline

1. **Phase 1**: Add textElements array to Screen interface, run migration
2. **Phase 2**: Implement TextElement component with drag and edit
3. **Phase 3**: Add rotation functionality
4. **Phase 4**: Implement TextLayerList and layer management
5. **Phase 5**: Update TextTab UI, remove caption fields
6. **Phase 6**: Update CompositionRenderer for export
7. **Phase 7**: Testing and bug fixes

## Rollback Plan

If issues arise:
1. Keep old caption fields in CanvasSettings temporarily
2. Add feature flag to toggle between old/new system
3. Provide "Revert to Caption" button in UI
4. Maintain backward compatibility for 1-2 releases
