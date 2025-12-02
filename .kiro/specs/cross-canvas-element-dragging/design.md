# Design Document

## Overview

This feature enables cross-canvas element dragging, allowing users to drag device frames and text elements across multiple canvas screens in the ScreensPanel. When an element is dropped while overlapping multiple screens, the system automatically calculates intersection regions and stores partial element data in each affected screen. This enables creative split-screen compositions where a single element spans multiple exported images.

The design leverages the existing HTML/DOM-based rendering system and extends the current drag-and-drop infrastructure to support cross-canvas interactions. Each screen maintains its own partial element data, ensuring independent export capabilities while providing a unified dragging experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AppFrames (Root)                        │
│  - Manages screens array                                     │
│  - Handles media uploads                                     │
│  - Coordinates export operations                             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│  Canvas        │       │ ScreensPanel    │
│  - Renders     │       │ - Shows         │
│    selected    │       │   thumbnails    │
│    screens     │       │ - Drag source   │
│  - Main view   │       │ - Drop target   │
└────────────────┘       └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │ CrossCanvasDrag │
                         │    Context      │
                         │ - Tracks drag   │
                         │ - Calculates    │
                         │   intersections │
                         │ - Manages       │
                         │   overlays      │
                         └─────────────────┘
```

### Component Responsibilities

**AppFrames.tsx**
- Root state management for screens array
- Handles screen CRUD operations (add, remove, update)
- Coordinates export and download operations
- Provides CrossCanvasDragProvider context

**ScreensPanel.tsx**
- Renders screen thumbnails in horizontal scrollable panel
- Initiates drag operations for elements
- Receives drop events for cross-canvas elements
- Displays visual feedback during drag operations

**Canvas.tsx**
- Renders selected screens in main view
- Displays device frames and text elements
- Handles element positioning and transformations
- Supports direct element manipulation

**CrossCanvasDragContext.tsx** (New)
- Manages global drag state
- Calculates element-screen intersections
- Provides drag preview overlays
- Coordinates partial element data storage

**PartialElementRenderer.tsx** (New)
- Renders partial elements with clipping
- Handles device frame and text element types
- Applies CSS clip-path for boundary clipping
- Maintains element positioning and scale

## Components and Interfaces

### Data Models

#### PartialElementData Interface

```typescript
interface PartialElementData {
  // Unique identifier for the element being split
  elementId: string;
  
  // Type of element
  elementType: 'deviceFrame' | 'text';
  
  // Global position of the full element (relative to ScreensPanel)
  globalX: number;
  globalY: number;
  
  // Dimensions of the full element
  fullWidth: number;
  fullHeight: number;
  
  // Visible region within this screen (relative to element)
  clipX: number;      // Left edge of visible region
  clipY: number;      // Top edge of visible region
  clipWidth: number;  // Width of visible region
  clipHeight: number; // Height of visible region
  
  // Position of visible region within screen (relative to screen)
  screenX: number;
  screenY: number;
  
  // Element-specific data
  deviceFrameData?: {
    frameType: string;
    imageIndex: number;
    screenScale: number;
    screenPanX: number;
    screenPanY: number;
  };
  
  textData?: {
    text: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    alignment: string;
  };
}
```

#### Screen Interface Extension

```typescript
interface Screen {
  id: string;
  mediaId?: number;
  image?: string;
  name: string;
  images: ScreenImage[];
  settings: CanvasSettings;
  
  // New: Partial elements that span across this screen
  partialElements?: PartialElementData[];
}
```

#### CrossCanvasDragState Interface

```typescript
interface CrossCanvasDragState {
  // Is a cross-canvas drag currently active?
  isDragging: boolean;
  
  // Element being dragged
  draggedElement: {
    type: 'deviceFrame' | 'text';
    sourceScreenIndex: number;
    frameIndex?: number;
    data: any;
  } | null;
  
  // Current drag position (relative to ScreensPanel)
  dragX: number;
  dragY: number;
  
  // Element dimensions
  elementWidth: number;
  elementHeight: number;
  
  // Screens that currently overlap with dragged element
  overlappingScreens: Array<{
    screenIndex: number;
    intersection: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}
```

### New Components

#### CrossCanvasDragContext

**Purpose:** Provides global drag state and intersection calculation logic

**Key Methods:**
- `startDrag(element, position)` - Initiates cross-canvas drag
- `updateDragPosition(x, y)` - Updates drag position and recalculates intersections
- `endDrag()` - Finalizes drag and applies partial elements to screens
- `calculateIntersections(elementBounds, screenBounds[])` - Computes overlap regions
- `getOverlappingScreens()` - Returns list of screens that overlap with dragged element

**State Management:**
- Uses React Context API for global state
- Provides hooks: `useCrossCanvasDrag()`
- Memoizes intersection calculations for performance

#### PartialElementRenderer

**Purpose:** Renders partial elements with proper clipping and positioning

**Props:**
```typescript
interface PartialElementRendererProps {
  partialElement: PartialElementData;
  screenDimensions: { width: number; height: number };
  scale?: number; // For thumbnail rendering
}
```

**Rendering Logic:**
1. Calculate clip-path based on visible region
2. Position element relative to screen
3. Apply CSS transforms for scale and rotation
4. Render device frame or text based on element type

**CSS Clipping:**
```css
.partial-element {
  position: absolute;
  clip-path: inset(
    ${clipY}px 
    ${fullWidth - clipX - clipWidth}px 
    ${fullHeight - clipY - clipHeight}px 
    ${clipX}px
  );
}
```

#### DragOverlay

**Purpose:** Provides visual feedback during drag operations

**Features:**
- Semi-transparent preview of dragged element
- Highlight borders on overlapping screens
- Split region indicators
- Real-time position updates

**Rendering:**
- Positioned absolutely over ScreensPanel
- Uses pointer-events: none to avoid interfering with drag
- Animates opacity and scale for smooth transitions

### Modified Components

#### ScreensPanel.tsx

**New Responsibilities:**
- Detect drag start on device frames and text elements
- Track drag position relative to panel
- Render DragOverlay during drag operations
- Handle drop events and trigger partial element creation

**New Props:**
```typescript
interface ScreensPanelProps {
  // ... existing props
  onCrossCanvasDrop?: (
    elementData: any,
    overlappingScreens: number[]
  ) => void;
}
```

**Drag Detection:**
- Add `draggable="true"` to device frames and text elements in thumbnails
- Implement `onDragStart`, `onDrag`, `onDragEnd` handlers
- Use `dataTransfer` to pass element data

#### Canvas.tsx

**New Responsibilities:**
- Render partial elements from screen.partialElements array
- Support dragging partial elements for repositioning
- Update partial element positions on drag

**Rendering Order:**
1. Background color
2. Composition (device frames from images array)
3. Partial elements (from partialElements array)
4. Text captions

#### ScreenThumbnail (in ScreensPanel.tsx)

**New Responsibilities:**
- Render partial elements in thumbnail view
- Scale partial elements proportionally
- Maintain clipping boundaries at thumbnail scale

## Data Flow

### Cross-Canvas Drag Flow

```
1. User starts drag on element in thumbnail
   ↓
2. ScreensPanel.onDragStart()
   - Captures element data
   - Calls CrossCanvasDragContext.startDrag()
   ↓
3. User moves mouse over ScreensPanel
   ↓
4. ScreensPanel.onDrag()
   - Updates drag position
   - Calls CrossCanvasDragContext.updateDragPosition()
   ↓
5. CrossCanvasDragContext.calculateIntersections()
   - Gets all screen bounds from ScreensPanel
   - Calculates overlap regions
   - Updates overlappingScreens state
   ↓
6. DragOverlay renders
   - Shows element preview at drag position
   - Highlights overlapping screens
   - Displays split region indicators
   ↓
7. User releases mouse (drop)
   ↓
8. ScreensPanel.onDrop()
   - Calls CrossCanvasDragContext.endDrag()
   ↓
9. CrossCanvasDragContext.endDrag()
   - For each overlapping screen:
     - Calculate PartialElementData
     - Call AppFrames.addPartialElement(screenIndex, partialData)
   ↓
10. AppFrames updates screens array
    - Adds partialElement to screen.partialElements
    ↓
11. Re-render
    - Thumbnails show partial elements
    - Canvas shows partial elements
    - Export includes partial elements
```

### Intersection Calculation Algorithm

```typescript
function calculateIntersection(
  elementBounds: Rect,
  screenBounds: Rect
): Intersection | null {
  // Check if rectangles overlap
  const overlapX = Math.max(0, 
    Math.min(elementBounds.right, screenBounds.right) - 
    Math.max(elementBounds.left, screenBounds.left)
  );
  
  const overlapY = Math.max(0,
    Math.min(elementBounds.bottom, screenBounds.bottom) - 
    Math.max(elementBounds.top, screenBounds.top)
  );
  
  if (overlapX === 0 || overlapY === 0) {
    return null; // No intersection
  }
  
  // Calculate intersection rectangle
  const intersectionLeft = Math.max(elementBounds.left, screenBounds.left);
  const intersectionTop = Math.max(elementBounds.top, screenBounds.top);
  
  // Calculate clip region (relative to element)
  const clipX = intersectionLeft - elementBounds.left;
  const clipY = intersectionTop - elementBounds.top;
  
  // Calculate position within screen
  const screenX = intersectionLeft - screenBounds.left;
  const screenY = intersectionTop - screenBounds.top;
  
  return {
    clipX,
    clipY,
    clipWidth: overlapX,
    clipHeight: overlapY,
    screenX,
    screenY,
  };
}
```

### Partial Element Storage

When a drag ends, the system creates PartialElementData for each overlapping screen:

```typescript
function createPartialElementData(
  element: DraggedElement,
  intersection: Intersection,
  screenIndex: number
): PartialElementData {
  return {
    elementId: generateUniqueId(),
    elementType: element.type,
    globalX: element.x,
    globalY: element.y,
    fullWidth: element.width,
    fullHeight: element.height,
    clipX: intersection.clipX,
    clipY: intersection.clipY,
    clipWidth: intersection.clipWidth,
    clipHeight: intersection.clipHeight,
    screenX: intersection.screenX,
    screenY: intersection.screenY,
    deviceFrameData: element.type === 'deviceFrame' ? {
      frameType: element.frameType,
      imageIndex: element.imageIndex,
      screenScale: element.screenScale,
      screenPanX: element.screenPanX,
      screenPanY: element.screenPanY,
    } : undefined,
    textData: element.type === 'text' ? {
      text: element.text,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      color: element.color,
      alignment: element.alignment,
    } : undefined,
  };
}
```

## Error Handling

### Drag Operation Errors

**Invalid Drag Source:**
- Validate element type before starting drag
- Show error message if element cannot be dragged
- Prevent drag operation from starting

**Intersection Calculation Errors:**
- Handle edge cases (element completely outside all screens)
- Validate screen bounds before calculation
- Return empty array if no intersections found

**Drop Operation Errors:**
- Validate overlapping screens array
- Check for duplicate partial elements
- Rollback state if partial element creation fails

### Rendering Errors

**Partial Element Rendering:**
- Validate PartialElementData before rendering
- Handle missing element data gracefully
- Show placeholder if element cannot be rendered

**Clipping Errors:**
- Validate clip region bounds
- Clamp values to element dimensions
- Fall back to full element if clipping fails

**Export Errors:**
- Ensure partial elements are included in DOM before export
- Validate clip-path CSS before export
- Retry export if partial element is missing

### Performance Considerations

**Intersection Calculation:**
- Throttle drag position updates (16ms / 60fps)
- Memoize screen bounds to avoid recalculation
- Use requestAnimationFrame for smooth updates

**Rendering Optimization:**
- Only render partial elements for visible screens
- Use React.memo for PartialElementRenderer
- Avoid re-rendering non-overlapping screens during drag

**Memory Management:**
- Clean up partial element data when screen is removed
- Remove orphaned partial elements
- Limit maximum number of partial elements per screen

## Testing Strategy

### Unit Tests

**Intersection Calculation:**
- Test with overlapping rectangles
- Test with non-overlapping rectangles
- Test with partially overlapping rectangles
- Test with element completely inside screen
- Test with element completely outside screen
- Test with element overlapping multiple screens

**Partial Element Data Creation:**
- Test with device frame element
- Test with text element
- Test with various intersection regions
- Test with edge cases (zero-width/height intersections)

**Clipping Logic:**
- Test clip-path calculation
- Test with various clip regions
- Test with rotated elements
- Test with scaled elements

### Integration Tests

**Drag and Drop:**
- Test drag start on device frame
- Test drag start on text element
- Test drag across multiple screens
- Test drop on single screen
- Test drop on multiple screens
- Test drag cancellation (ESC key)

**Rendering:**
- Test partial element rendering in thumbnail
- Test partial element rendering in canvas
- Test partial element rendering in export
- Test with multiple partial elements
- Test with overlapping partial elements

**State Management:**
- Test partial element addition to screen
- Test partial element removal from screen
- Test partial element update
- Test screen removal with partial elements
- Test repositioning partial elements

### Property-Based Tests

Property-based tests will be defined after completing the prework analysis in the next section.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Drag preview visibility
*For any* canvas element being dragged over the screens panel, the system should display a visual preview at the current drag position
**Validates: Requirements 1.1**

### Property 2: Overlapping screen highlighting
*For any* dragged element position and screen layout, all screens that intersect with the element bounds should be highlighted
**Validates: Requirements 1.2**

### Property 3: Preview intersection accuracy
*For any* dragged element that overlaps a screen, the preview should show the exact intersection region that will be captured by that screen
**Validates: Requirements 1.4**

### Property 4: Drop applies to all overlapping screens
*For any* element drop position, partial element data should be created for all and only the screens that were overlapping at the moment of drop
**Validates: Requirements 1.5, 9.5**

### Property 5: Intersection calculation correctness
*For any* element bounds and screen bounds, the calculated intersection region should match the actual geometric overlap
**Validates: Requirements 2.1, 2.3**

### Property 6: Partial element data storage
*For any* screen that intersects with a dropped element, the screen should store partial element data containing element position, visible region, and clipping boundaries
**Validates: Requirements 2.2, 2.4**

### Property 7: Non-overlapping screens unchanged
*For any* element drop, screens that do not intersect with the element should remain unmodified
**Validates: Requirements 2.5**

### Property 8: Thumbnail renders only visible portion
*For any* screen containing a partial element, the thumbnail should render only the portion of the element within the clip region
**Validates: Requirements 3.1, 3.3**

### Property 9: Independent thumbnail rendering
*For any* element split across multiple screens, each screen's thumbnail should independently show only its own clip region without being affected by other screens' clip regions
**Validates: Requirements 3.2**

### Property 10: Device frame content clipping proportionality
*For any* device frame partial element with screenshot content, the screenshot should be clipped proportionally with the frame clipping in both thumbnails and exports
**Validates: Requirements 3.4, 4.3, 5.1**

### Property 11: Text element clipping
*For any* text partial element, the text should be clipped at screen boundaries in both thumbnails and exports
**Validates: Requirements 3.5, 4.4, 5.4**

### Property 12: Thumbnail updates on state change
*For any* screen with partial elements, when the partial element data changes, the thumbnail should refresh to reflect the new state
**Validates: Requirements 3.6**

### Property 13: Export renders only visible portion
*For any* screen with a partial element, the exported image should contain only the portion of the element within that screen's boundaries
**Validates: Requirements 4.1**

### Property 14: Export scale invariance
*For any* partial element, the clipping proportions should remain the same when exporting at different resolutions (1x, 2x, etc.)
**Validates: Requirements 4.2**

### Property 15: Independent export rendering
*For any* set of screens with partial elements from the same source element, each exported image should contain only its respective partial element view
**Validates: Requirements 4.5**

### Property 16: Export positioning and scale accuracy
*For any* partial element in an export, the element portion should maintain the correct position and scale relative to the screen
**Validates: Requirements 4.6**

### Property 17: Screenshot aspect ratio preservation
*For any* device frame partial element with screenshot content, the screenshot aspect ratio should be maintained when the frame is clipped
**Validates: Requirements 5.2**

### Property 18: Dynamic screenshot visibility updates
*For any* device frame partial element, when the visible portion of the frame changes, the visible portion of the screenshot should update accordingly
**Validates: Requirements 5.3**

### Property 19: Text styling preservation
*For any* text partial element, the font size, style, and alignment should be maintained when the text is clipped
**Validates: Requirements 5.5**

### Property 20: Horizontal drag produces vertical splits
*For any* element dragged horizontally across screens, the resulting splits should occur along vertical boundaries between screens
**Validates: Requirements 6.1**

### Property 21: Vertical drag produces horizontal splits
*For any* element dragged vertically across screens, the resulting splits should occur along horizontal boundaries between screens
**Validates: Requirements 6.2**

### Property 22: Diagonal drag produces both split types
*For any* element dragged diagonally across screens, the resulting splits should occur along both vertical and horizontal boundaries
**Validates: Requirements 6.3**

### Property 23: Grid layout intersection correctness
*For any* screen arrangement in a grid layout, intersection calculations should correctly identify all overlapping screens
**Validates: Requirements 6.4**

### Property 24: Element replacement
*For any* screen with a partial element, dropping a new element on that screen should replace the existing partial element with the new element
**Validates: Requirements 7.1, 7.3**

### Property 25: Screen removal cleanup
*For any* screen with partial elements, removing the screen should delete all partial element data associated with that screen
**Validates: Requirements 7.2**

### Property 26: Partial element modification isolation
*For any* screen with a partial element, modifying that screen's partial element should not affect other screens with different portions of the same source element
**Validates: Requirements 7.5**

### Property 27: Overlay indicators during drag
*For any* element being dragged over multiple screens, overlay indicators should be displayed showing the split regions
**Validates: Requirements 8.1**

### Property 28: Overlapping screen visual feedback
*For any* drag position, screens that will receive a partial element should be highlighted, and screens that will not should not be highlighted
**Validates: Requirements 8.3, 8.4**

### Property 29: Drag end cleanup
*For any* completed drag operation, all drag-related visual indicators should be removed
**Validates: Requirements 8.5**

### Property 30: Continuous intersection calculation
*For any* drag position update, intersections should be recalculated for all visible screens
**Validates: Requirements 9.1**

### Property 31: Dynamic preview appearance
*For any* dragged element, when the element enters a screen's boundary, a preview should appear for that screen
**Validates: Requirements 9.2**

### Property 32: Dynamic preview removal
*For any* dragged element, when the element exits a screen's boundary, the preview for that screen should disappear
**Validates: Requirements 9.3**

### Property 33: Repositioning removes old data
*For any* existing partial element being repositioned, the previous partial element data should be removed from all previously affected screens
**Validates: Requirements 10.2**

### Property 34: Repositioning creates new data
*For any* repositioned element, new partial element data should be created for all newly overlapping screens
**Validates: Requirements 10.3**

### Property 35: Repositioning updates UI
*For any* repositioned element, all affected thumbnails should update to reflect the new partial element positions
**Validates: Requirements 10.4**

### Property 36: Repositioning cleanup for non-overlapping screens
*For any* repositioned element, screens that no longer overlap with the element should have their partial element data removed
**Validates: Requirements 10.5**

### Property 37: Consistent drag mechanism
*For any* element type (device frame or text), the drag initiation and handling should use the same mechanism
**Validates: Requirements 11.1, 11.2**

### Property 38: Consistent intersection logic
*For any* element type and position, the intersection calculation should produce the same results given the same geometric bounds
**Validates: Requirements 11.3**

### Property 39: Consistent storage logic
*For any* element type, partial element data should be stored using the same data structure and storage mechanism
**Validates: Requirements 11.4**

### Property 40: Consistent visual indicators
*For any* element type being dragged, the visual feedback indicators should be consistent
**Validates: Requirements 11.5**


## Implementation Details

### CSS Clipping Strategy

The system uses CSS `clip-path` with `inset()` function to clip partial elements:

```css
.partial-element {
  position: absolute;
  left: ${screenX}px;
  top: ${screenY}px;
  width: ${fullWidth}px;
  height: ${fullHeight}px;
  clip-path: inset(
    ${clipY}px 
    ${fullWidth - clipX - clipWidth}px 
    ${fullHeight - clipY - clipHeight}px 
    ${clipX}px
  );
}
```

**Advantages:**
- Hardware-accelerated
- Works with transforms
- Maintains element quality
- Exports correctly with html-to-image

**Coordinate System:**
- `inset()` values are: top, right, bottom, left
- All values are relative to element bounds
- Positive values clip inward from edges

### Drag Event Handling

**HTML5 Drag and Drop API:**
```typescript
// Make element draggable
<div draggable="true" onDragStart={handleDragStart}>

// Drag start - capture element data
function handleDragStart(e: DragEvent) {
  const elementData = {
    type: 'deviceFrame',
    sourceScreenIndex: screenIndex,
    frameIndex: frameIndex,
    // ... other data
  };
  e.dataTransfer.setData('application/json', JSON.stringify(elementData));
  e.dataTransfer.effectAllowed = 'copy';
}

// Drag over - update position and calculate intersections
function handleDrag(e: DragEvent) {
  const rect = panelRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  updateDragPosition(x, y);
}

// Drop - create partial elements
function handleDrop(e: DragEvent) {
  e.preventDefault();
  const elementData = JSON.parse(e.dataTransfer.getData('application/json'));
  const overlappingScreens = getOverlappingScreens();
  createPartialElements(elementData, overlappingScreens);
}
```

### Screen Bounds Calculation

```typescript
function getScreenBounds(screenIndex: number): Rect {
  const thumbnailElement = document.getElementById(`screen-thumb-${screenIndex}`);
  if (!thumbnailElement) return null;
  
  const panelRect = panelRef.current.getBoundingClientRect();
  const thumbRect = thumbnailElement.getBoundingClientRect();
  
  return {
    left: thumbRect.left - panelRect.left,
    top: thumbRect.top - panelRect.top,
    right: thumbRect.right - panelRect.left,
    bottom: thumbRect.bottom - panelRect.top,
    width: thumbRect.width,
    height: thumbRect.height,
  };
}
```

### Performance Optimizations

**Throttled Intersection Calculation:**
```typescript
const throttledUpdatePosition = useCallback(
  throttle((x: number, y: number) => {
    const intersections = calculateIntersections(x, y);
    setOverlappingScreens(intersections);
  }, 16), // 60fps
  []
);
```

**Memoized Screen Bounds:**
```typescript
const screenBounds = useMemo(() => {
  return screens.map((_, index) => getScreenBounds(index));
}, [screens.length]); // Only recalculate when screen count changes
```

**Conditional Rendering:**
```typescript
// Only render partial elements for visible screens
{selectedScreenIndices.includes(screenIndex) && (
  <PartialElementRenderer partialElement={element} />
)}
```

### Export Integration

**Including Partial Elements in Export:**
```typescript
async function exportScreen(screenIndex: number) {
  const screen = screens[screenIndex];
  const canvasElement = document.getElementById(`canvas-${screen.id}`);
  
  // Ensure partial elements are rendered in DOM
  const partialElements = screen.partialElements || [];
  
  // html-to-image will capture the entire DOM including partial elements
  const dataUrl = await toPng(canvasElement, {
    quality: 1.0,
    pixelRatio: 2,
  });
  
  return dataUrl;
}
```

**Clipping at Export Time:**
- CSS `clip-path` is automatically applied during export
- html-to-image captures the clipped appearance
- No additional processing needed

### State Management

**Partial Element State:**
```typescript
// In AppFrames.tsx
const [screens, setScreens] = useState<Screen[]>([]);

// Add partial element to screen
function addPartialElement(screenIndex: number, partialData: PartialElementData) {
  setScreens(prev => {
    const updated = [...prev];
    const screen = updated[screenIndex];
    if (!screen) return prev;
    
    updated[screenIndex] = {
      ...screen,
      partialElements: [
        ...(screen.partialElements || []),
        partialData,
      ],
    };
    
    return updated;
  });
}

// Remove partial elements from screen
function removePartialElements(screenIndex: number, elementId: string) {
  setScreens(prev => {
    const updated = [...prev];
    const screen = updated[screenIndex];
    if (!screen) return prev;
    
    updated[screenIndex] = {
      ...screen,
      partialElements: (screen.partialElements || []).filter(
        el => el.elementId !== elementId
      ),
    };
    
    return updated;
  });
}
```

**Cross-Canvas Drag State:**
```typescript
// In CrossCanvasDragContext.tsx
const [dragState, setDragState] = useState<CrossCanvasDragState>({
  isDragging: false,
  draggedElement: null,
  dragX: 0,
  dragY: 0,
  elementWidth: 0,
  elementHeight: 0,
  overlappingScreens: [],
});
```

## Dependencies

### Existing Dependencies
- React 19.2.0 - Component framework
- Mantine 8.3.9 - UI components
- html-to-image 1.11.13 - Export functionality
- TypeScript 5.9.3 - Type safety

### No New Dependencies Required
All functionality can be implemented using existing dependencies and browser APIs:
- HTML5 Drag and Drop API (native)
- CSS clip-path (native)
- getBoundingClientRect (native)
- React Context API (included in React)

## Browser Compatibility

**Required Features:**
- HTML5 Drag and Drop API - Supported in all modern browsers
- CSS clip-path with inset() - Supported in Chrome 55+, Firefox 54+, Safari 9.1+
- getBoundingClientRect - Universal support
- html-to-image - Works in all modern browsers

**Fallback Strategy:**
- No fallback needed - target browsers all support required features
- Minimum browser versions: Chrome 90+, Firefox 88+, Safari 14+

## Migration Strategy

### Backward Compatibility

**Existing Screens:**
- Screens without `partialElements` array will continue to work
- Default to empty array if `partialElements` is undefined
- No migration of existing data needed

**Existing Drag and Drop:**
- Current drag-and-drop for images will continue to work
- New cross-canvas drag is additive, not replacing existing functionality
- Both systems can coexist

### Gradual Rollout

**Phase 1: Core Infrastructure**
- Add `partialElements` field to Screen interface
- Implement CrossCanvasDragContext
- Add intersection calculation logic

**Phase 2: Drag and Drop**
- Implement drag handlers in ScreensPanel
- Add DragOverlay component
- Enable cross-canvas dragging

**Phase 3: Rendering**
- Implement PartialElementRenderer
- Add partial element rendering to Canvas
- Add partial element rendering to thumbnails

**Phase 4: Export**
- Ensure partial elements are included in exports
- Test export at various resolutions
- Validate clipping in exported images

## Security Considerations

**XSS Prevention:**
- Sanitize text content before rendering
- Use React's built-in XSS protection
- Validate element data before storage

**Data Validation:**
- Validate PartialElementData structure
- Clamp clip region values to element bounds
- Validate screen indices before access

**Resource Limits:**
- Limit maximum number of partial elements per screen (e.g., 10)
- Limit maximum number of overlapping screens during drag (e.g., 20)
- Throttle intersection calculations to prevent performance issues

## Accessibility

**Keyboard Support:**
- Support keyboard-based drag and drop (future enhancement)
- Provide keyboard shortcuts for element manipulation
- Ensure focus management during drag operations

**Screen Reader Support:**
- Add ARIA labels to draggable elements
- Announce drag start and drop events
- Provide text descriptions of partial elements

**Visual Indicators:**
- High contrast mode support for drag overlays
- Clear visual feedback for all drag states
- Accessible color choices for highlights

## Future Enhancements

**Advanced Clipping:**
- Support for custom clip shapes (circles, polygons)
- Gradient clipping for smooth transitions
- Animated clipping effects

**Multi-Element Selection:**
- Drag multiple elements simultaneously
- Group elements for coordinated movement
- Bulk operations on partial elements

**Smart Snapping:**
- Snap elements to screen boundaries
- Align elements across screens
- Distribute elements evenly

**Undo/Redo:**
- Track partial element operations
- Support undo for drag and drop
- Maintain operation history

**Templates:**
- Save partial element layouts as templates
- Apply templates to new screens
- Share templates between users

