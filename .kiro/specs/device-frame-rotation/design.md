# Design Document

## Overview

This feature adds 3D tilt, 2D rotation, and interactive resizing capabilities to device frames in AppFrames, enabling users to create more dynamic and visually engaging app screenshot compositions. The implementation leverages CSS 3D transforms (rotateX, rotateY, rotateZ) and scale transforms to achieve perspective tilting, rotation, and resizing effects while maintaining export quality and existing functionality.

The design extends the current per-frame positioning system (frameX, frameY) to include rotation transforms (tiltX, tiltY, rotateZ) and per-frame scaling (frameScale), all stored in the ScreenImage interface. This replaces the global compositionScale setting with individual frame control. Interactive resize handles are added to each frame, allowing users to drag edges and corners to adjust frame size.

## Architecture

### Component Hierarchy

```
AppFrames (state management)
  └── Canvas
      └── CompositionRenderer
          └── DraggableFrame (wrapper with transforms)
              └── DeviceFrame (visual device mockup)
```

### Transform Application Flow

1. User adjusts tilt/rotation controls in sidebar
2. Values stored in `ScreenImage` interface (per-frame)
3. `CompositionRenderer` passes transform values to `DraggableFrame`
4. `DraggableFrame` applies CSS transforms in correct order
5. Export captures transformed DOM via html-to-image

### State Management

Transform values are stored per-frame in the `ScreenImage` interface, allowing each device frame in a composition to have independent tilt and rotation settings. This follows the existing pattern used for `frameX`, `frameY`, `panX`, and `panY`.

## Components and Interfaces

### Data Models

#### Extended ScreenImage Interface

```typescript
export interface ScreenImage {
  image?: string;
  mediaId?: number;
  panX?: number; // 0-100, default 50
  panY?: number; // 0-100, default 50
  frameX?: number; // Offset in pixels
  frameY?: number; // Offset in pixels
  
  // NEW: Transform properties
  tiltX?: number; // -60 to 60 degrees, default 0
  tiltY?: number; // -60 to 60 degrees, default 0
  rotateZ?: number; // -180 to 180 degrees, default 0
  frameScale?: number; // 20 to 200 percent, default 100
}
```

#### Updated CanvasSettings Interface

```typescript
export interface CanvasSettings {
  canvasSize: string;
  deviceFrame: string;
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan';
  // REMOVED: compositionScale - replaced by per-frame frameScale in ScreenImage
  captionVertical: number;
  captionHorizontal: number;
  selectedScreenIndex: number;
  screenScale: number;
  screenPanX: number;
  screenPanY: number;
  orientation: string;
  backgroundColor: string;
  captionText: string;
  showCaption: boolean;
}
```

### New Components

#### ResizeHandles Component

**Purpose:** Render interactive resize handles on device frames for drag-based resizing

**Structure:**
```typescript
interface ResizeHandlesProps {
  frameIndex: number;
  onResizeStart: (handle: ResizeHandle) => void;
  onResize: (deltaX: number, deltaY: number, handle: ResizeHandle) => void;
  onResizeEnd: () => void;
  isActive: boolean; // Show handles only when frame is hovered/selected
}

type ResizeHandle = 
  | 'top' | 'right' | 'bottom' | 'left'  // Edge handles
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // Corner handles
```

**Behavior:**
- Renders 8 handles: 4 corners + 4 edges
- Corner handles: proportional resize (maintain aspect ratio)
- Edge handles: single-dimension resize
- Handles appear on hover over the frame
- Visual feedback during drag (cursor changes, handle highlight)
- Handles positioned absolutely relative to frame bounds

**Implementation Notes:**
- Use `onMouseDown` to initiate drag
- Track mouse movement with `onMouseMove` on document
- Calculate delta from initial position
- Apply constraints (20-200%) during drag
- Finalize on `onMouseUp`

### Component Updates

#### 1. DeviceFrame Component

**Current Responsibility:** Renders device mockup with image, handles panning and frame positioning

**New Responsibility:** Accept and display transform props (read-only, transforms applied by parent)

**Props Addition:**
```typescript
interface DeviceFrameProps {
  // ... existing props
  tiltX?: number;
  tiltY?: number;
  rotateZ?: number;
}
```

**Changes:**
- No direct transform application (handled by DraggableFrame wrapper)
- Component remains focused on device visual rendering

#### 2. CompositionRenderer Component

**Current Responsibility:** Layouts device frames based on composition type, wraps frames in DraggableFrame for positioning

**New Responsibility:** Pass transform values from ScreenImage to DraggableFrame

**Changes:**
- Extract transform values from `images[index]` in `getFrameProps`
- Pass tiltX, tiltY, rotateZ, frameScale to DraggableFrame wrapper
- Update DraggableFrame to accept and apply transform props
- Remove usage of compositionScale from CanvasSettings
- Use per-frame frameScale instead of global compositionScale

**Updated DraggableFrame:**
```typescript
const DraggableFrame = ({ 
  index, 
  children, 
  baseStyle,
  tiltX = 0,
  tiltY = 0,
  rotateZ = 0,
  frameScale = 100
}: {
  index: number;
  children: React.ReactNode;
  baseStyle?: React.CSSProperties;
  tiltX?: number;
  tiltY?: number;
  rotateZ?: number;
  frameScale?: number;
}) => {
  const { frameX, frameY } = getFrameOffset(index);
  const [isHovered, setIsHovered] = useState(false);
  
  // Build transform string with correct order:
  // 1. Base composition transform (from baseStyle)
  // 2. Position offset (translate)
  // 3. Scale (applied before rotation for correct behavior)
  // 4. Rotation transforms (rotateX, rotateY, rotateZ)
  const baseTransform = baseStyle?.transform || '';
  const positionTransform = `translate(${frameX}px, ${frameY}px)`;
  const scaleTransform = `scale(${frameScale / 100})`;
  const rotationTransform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${rotateZ}deg)`;
  
  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyle,
        transform: `${baseTransform} ${positionTransform} ${scaleTransform} ${rotationTransform}`.trim(),
        transformStyle: 'preserve-3d', // Enable 3D transforms
        position: 'relative',
      }}
    >
      {children}
      {isHovered && (
        <ResizeHandles
          frameIndex={index}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
          isActive={isHovered}
        />
      )}
    </Box>
  );
};
```

#### 3. SidebarTabs Component (Device Tab)

**Current Responsibility:** Device selection, composition layout, scale controls

**New Responsibility:** Add transform controls for selected frame

**New Controls Section:**
```typescript
// Add after existing scale controls
<Stack gap="md">
  <Text size="sm" fw={500}>Transform</Text>
  
  <Box>
    <Text size="xs" c="dimmed">Tilt X (Vertical)</Text>
    <Slider
      value={currentFrame?.tiltX ?? 0}
      onChange={(value) => handleTransformChange('tiltX', value)}
      min={-60}
      max={60}
      step={1}
      marks={[
        { value: -60, label: '-60°' },
        { value: 0, label: '0°' },
        { value: 60, label: '60°' },
      ]}
    />
  </Box>
  
  <Box>
    <Text size="xs" c="dimmed">Tilt Y (Horizontal)</Text>
    <Slider
      value={currentFrame?.tiltY ?? 0}
      onChange={(value) => handleTransformChange('tiltY', value)}
      min={-60}
      max={60}
      step={1}
      marks={[
        { value: -60, label: '-60°' },
        { value: 0, label: '0°' },
        { value: 60, label: '60°' },
      ]}
    />
  </Box>
  
  <Box>
    <Text size="xs" c="dimmed">Rotation</Text>
    <Slider
      value={currentFrame?.rotateZ ?? 0}
      onChange={(value) => handleTransformChange('rotateZ', value)}
      min={-180}
      max={180}
      step={1}
      marks={[
        { value: -180, label: '-180°' },
        { value: 0, label: '0°' },
        { value: 180, label: '180°' },
      ]}
    />
  </Box>
  
  <Button
    variant="subtle"
    size="xs"
    onClick={handleResetTransforms}
  >
    Reset Transforms
  </Button>
</Stack>
```

#### 4. AppFrames Component

**Current Responsibility:** Root state management, handles frame position changes

**New Responsibility:** Handle transform changes via new callback

**New Handlers:**
```typescript
const handleTransformChange = (
  screenIndex: number,
  frameIndex: number,
  property: 'tiltX' | 'tiltY' | 'rotateZ' | 'frameScale',
  value: number
) => {
  setScreens(prevScreens => {
    const updated = [...prevScreens];
    if (updated[screenIndex]) {
      const screen = updated[screenIndex];
      const newImages = [...screen.images];
      
      // Ensure frame slot exists
      while (newImages.length <= frameIndex) {
        newImages.push({});
      }
      
      newImages[frameIndex] = {
        ...newImages[frameIndex],
        [property]: value,
      };
      
      updated[screenIndex] = {
        ...screen,
        images: newImages,
      };
    }
    return updated;
  });
};

const handleResize = (
  screenIndex: number,
  frameIndex: number,
  deltaX: number,
  deltaY: number,
  handle: ResizeHandle
) => {
  const currentFrame = screens[screenIndex]?.images?.[frameIndex];
  const currentScale = currentFrame?.frameScale ?? 100;
  
  // Calculate new scale based on handle type and delta
  let newScale = currentScale;
  
  if (handle.includes('corner')) {
    // Corner handles: proportional resize
    // Use the larger delta for uniform scaling
    const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const direction = deltaX > 0 || deltaY > 0 ? 1 : -1;
    newScale = currentScale + (delta * direction * 0.1); // Adjust sensitivity
  } else {
    // Edge handles: single dimension
    const delta = handle === 'left' || handle === 'right' ? deltaX : deltaY;
    newScale = currentScale + (delta * 0.1);
  }
  
  // Clamp to valid range
  newScale = Math.max(20, Math.min(200, newScale));
  
  handleTransformChange(screenIndex, frameIndex, 'frameScale', newScale);
};
```

### Transform Order and Perspective

**CSS Transform Order:**
1. Base composition transform (e.g., `rotate(-8deg)` for fan layout)
2. Position offset (`translate(frameX, frameY)`)
3. Scale (`scale(frameScale / 100)`) - Applied before rotation for correct behavior
4. Rotation transforms (`rotateX(tiltX) rotateY(tiltY) rotateZ(rotateZ)`)

**Perspective Setup:**
The parent container of DraggableFrame should have perspective applied to enable 3D depth:

```typescript
// In CompositionRenderer, wrap compositions in perspective container
<Box style={{ 
  perspective: '2000px',
  perspectiveOrigin: 'center center',
}}>
  {/* Composition content */}
</Box>
```

## Migration Strategy

### Removing compositionScale

**Files to Update:**
1. `components/AppFrames/types.ts` - Remove compositionScale from CanvasSettings
2. `components/AppFrames/FramesContext.tsx` - Remove from default settings
3. `components/AppFrames/Sidebar.tsx` - Remove composition scale slider
4. `components/AppFrames/CompositionRenderer.tsx` - Remove scale calculation from compositionScale
5. `components/AppFrames/OverflowDeviceRenderer.tsx` - Remove scale calculation from compositionScale
6. `lib/PersistenceDB.ts` - Remove compositionScale validation and defaults
7. `lib/PersistenceDB.test.ts` - Remove compositionScale from test fixtures

**Migration Handling:**
- When loading existing compositions with compositionScale, ignore the value
- All frames default to frameScale: 100 if not specified
- No data migration needed - old compositionScale values are simply not used

## Error Handling

### Value Constraints

**Input Validation:**
- Clamp tiltX: -60° to 60°
- Clamp tiltY: -60° to 60°
- Clamp rotateZ: -180° to 180°
- Clamp frameScale: 20% to 200%

**Implementation:**
```typescript
const clampTransform = (value: number, property: 'tiltX' | 'tiltY' | 'rotateZ' | 'frameScale'): number => {
  if (property === 'rotateZ') {
    return Math.max(-180, Math.min(180, value));
  }
  if (property === 'frameScale') {
    return Math.max(20, Math.min(200, value));
  }
  return Math.max(-60, Math.min(60, value));
};
```

### Export Edge Cases

**Clipping Handling:**
- Rotated frames may extend beyond canvas boundaries
- Current `overflow: hidden` on canvas will clip appropriately
- No special handling needed - browser handles clipping during export

**Transform Quality:**
- html-to-image captures DOM at 2x pixel ratio
- CSS transforms are vector-based, no quality loss
- Anti-aliasing handled by browser rendering engine

### Browser Compatibility

**CSS 3D Transforms:**
- Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- No fallback needed for target audience (developers with modern browsers)
- `transformStyle: preserve-3d` required for nested 3D transforms

## Testing Strategy

### Unit Tests

**Test File:** `components/AppFrames/CompositionRenderer.test.tsx`

**Test Cases:**
1. Transform values are correctly extracted from ScreenImage
2. DraggableFrame applies transforms in correct order
3. Default values (0) are used when transform props are undefined
4. Transform string is correctly formatted with units (deg)

**Test File:** `components/AppFrames/DeviceTab.test.tsx` (new file)

**Test Cases:**
1. Sliders render with correct min/max/step values
2. Transform change handler is called with correct parameters
3. Reset button sets all transforms to 0
4. Controls are disabled when no frame is selected

### Property-Based Tests


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tilt X transform application

*For any* valid tiltX value between -60 and 60 degrees, when applied to a device frame, the resulting CSS transform string should contain `rotateX(${tiltX}deg)`

**Validates: Requirements 1.1**

### Property 2: Tilt Y transform application

*For any* valid tiltY value between -60 and 60 degrees, when applied to a device frame, the resulting CSS transform string should contain `rotateY(${tiltY}deg)`

**Validates: Requirements 1.2**

### Property 3: Rotation transform application

*For any* valid rotateZ value between -180 and 180 degrees, when applied to a device frame, the resulting CSS transform string should contain `rotateZ(${rotateZ}deg)`

**Validates: Requirements 2.1**

### Property 4: Combined transform order

*For any* combination of tiltX, tiltY, and rotateZ values, when all three are applied to a device frame, the transform string should contain all three transforms in the order: rotateX, rotateY, rotateZ

**Validates: Requirements 2.3**

### Property 5: Transform independence across frames

*For any* screen with multiple frames in a composition, when transform values are set on one frame, the transform values of other frames in the same screen should remain unchanged

**Validates: Requirements 2.5**

### Property 6: Transform state persistence per frame

*For any* screen and frame index, when transform values (tiltX, tiltY, rotateZ) are set, those values should be stored in the corresponding ScreenImage object in the images array

**Validates: Requirements 4.1**

### Property 7: Transform state isolation between screens

*For any* two different screens, when transform values are set on a frame in one screen, the transform values of frames in the other screen should remain unchanged

**Validates: Requirements 4.2**

### Property 8: Tilt X value clamping

*For any* input value for tiltX, the stored value should be clamped to the range [-60, 60]

**Validates: Requirements 6.1**

### Property 9: Tilt Y value clamping

*For any* input value for tiltY, the stored value should be clamped to the range [-60, 60]

**Validates: Requirements 6.2**

### Property 10: Rotation value clamping

*For any* input value for rotateZ, the stored value should be clamped to the range [-180, 180]

**Validates: Requirements 6.3**

### Property 11: Frame scale transform application

*For any* valid frameScale value between 20 and 200 percent, when applied to a device frame, the resulting CSS transform string should contain `scale(${frameScale / 100})`

**Validates: Requirements 7.4**

### Property 12: Frame scale independence across frames

*For any* screen with multiple frames in a composition, when frameScale is set on one frame, the frameScale values of other frames in the same screen should remain unchanged

**Validates: Requirements 7.6**

### Property 13: Scale transform order before rotation

*For any* combination of frameScale and rotation values (tiltX, tiltY, rotateZ), when all are applied to a device frame, the transform string should contain scale before any rotation transforms

**Validates: Requirements 8.3**

### Property 14: Complete transform order with scale

*For any* combination of frameScale, tiltX, tiltY, and rotateZ values, when all are applied to a device frame, the transform string should contain all transforms in the order: scale, rotateX, rotateY, rotateZ

**Validates: Requirements 8.4**

### Property 15: Frame scale state persistence per frame

*For any* screen and frame index, when frameScale value is set, that value should be stored in the corresponding ScreenImage object in the images array

**Validates: Requirements 9.1**

### Property 16: Frame scale state isolation between screens

*For any* two different screens, when frameScale is set on a frame in one screen, the frameScale values of frames in the other screen should remain unchanged

**Validates: Requirements 9.2**

### Property 17: Frame scale value clamping

*For any* input value for frameScale, the stored value should be clamped to the range [20, 200]

**Validates: Requirements 10.1**

### Testing Strategy

#### Unit Tests

**Test File:** `components/AppFrames/CompositionRenderer.test.tsx`

1. **Zero transform example** - When tiltX, tiltY, and rotateZ are all 0 or undefined, the transform string should not include rotation transforms (or should be identity)
   - **Validates: Requirements 1.4, 2.4**

2. **Transform controls presence** - Device settings panel should render tilt X, tilt Y, and rotation sliders
   - **Validates: Requirements 3.1**

3. **Slider range configuration** - Tilt sliders should have min=-60, max=60; rotation slider should have min=-180, max=180
   - **Validates: Requirements 3.2, 3.3, 6.5**

4. **Transform change callback** - When slider values change, the onChange handler should be called with correct parameters
   - **Validates: Requirements 3.4**

5. **Reset transforms** - When reset button is clicked, all transform values should be set to 0
   - **Validates: Requirements 3.5**

6. **New screen initialization** - When a new screen is created, transform values should be undefined or 0
   - **Validates: Requirements 4.5**

7. **Resize handles appear on hover** - When a device frame is hovered, resize handles should be rendered
   - **Validates: Requirements 7.1**

8. **New frame scale initialization** - When a new frame is added, frameScale should be 100 or undefined
   - **Validates: Requirements 9.5**

9. **Composition scale slider removed** - Sidebar should not render a composition-level scale slider
   - **Validates: Requirements 11.1**

10. **Migration ignores compositionScale** - Loading data with compositionScale should not break and should use frameScale instead
   - **Validates: Requirements 11.3**

11. **Renderer uses per-frame scale** - CompositionRenderer should use frameScale from ScreenImage, not compositionScale from CanvasSettings
   - **Validates: Requirements 11.4**

#### Property-Based Tests

**Test Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations

**Test File:** `components/AppFrames/transforms.pbt.test.tsx` (new file)

**Property Test 1: Tilt X transform application**
- Generate random tiltX values in range [-60, 60]
- Apply to DraggableFrame
- Assert transform string contains `rotateX(${tiltX}deg)`
- **Feature: device-frame-rotation, Property 1: Tilt X transform application**

**Property Test 2: Tilt Y transform application**
- Generate random tiltY values in range [-60, 60]
- Apply to DraggableFrame
- Assert transform string contains `rotateY(${tiltY}deg)`
- **Feature: device-frame-rotation, Property 2: Tilt Y transform application**

**Property Test 3: Rotation transform application**
- Generate random rotateZ values in range [-180, 180]
- Apply to DraggableFrame
- Assert transform string contains `rotateZ(${rotateZ}deg)`
- **Feature: device-frame-rotation, Property 3: Rotation transform application**

**Property Test 4: Combined transform order**
- Generate random combinations of tiltX, tiltY, rotateZ
- Apply all three to DraggableFrame
- Assert transform string contains all three in order: rotateX, then rotateY, then rotateZ
- **Feature: device-frame-rotation, Property 4: Combined transform order**

**Property Test 5: Transform independence across frames**
- Generate random screen with multiple frames
- Set random transforms on frame 0
- Assert frames 1 and 2 have unchanged transform values
- **Feature: device-frame-rotation, Property 5: Transform independence across frames**

**Property Test 6: Transform state persistence per frame**
- Generate random screen index, frame index, and transform values
- Call handleTransformChange
- Assert ScreenImage at that index contains the correct transform values
- **Feature: device-frame-rotation, Property 6: Transform state persistence per frame**

**Property Test 7: Transform state isolation between screens**
- Generate random screens array with at least 2 screens
- Set transforms on frame in screen 0
- Assert all frames in screen 1 have unchanged transform values
- **Feature: device-frame-rotation, Property 7: Transform state isolation between screens**

**Property Test 8: Tilt X value clamping**
- Generate random values including values outside [-60, 60]
- Apply clamping function
- Assert result is within [-60, 60]
- **Feature: device-frame-rotation, Property 8: Tilt X value clamping**

**Property Test 9: Tilt Y value clamping**
- Generate random values including values outside [-60, 60]
- Apply clamping function
- Assert result is within [-60, 60]
- **Feature: device-frame-rotation, Property 9: Tilt Y value clamping**

**Property Test 10: Rotation value clamping**
- Generate random values including values outside [-180, 180]
- Apply clamping function
- Assert result is within [-180, 180]
- **Feature: device-frame-rotation, Property 10: Rotation value clamping**

**Property Test 11: Frame scale transform application**
- Generate random frameScale values in range [20, 200]
- Apply to DraggableFrame
- Assert transform string contains `scale(${frameScale / 100})`
- **Feature: device-frame-rotation, Property 11: Frame scale transform application**

**Property Test 12: Frame scale independence across frames**
- Generate random screen with multiple frames
- Set random frameScale on frame 0
- Assert frames 1 and 2 have unchanged frameScale values
- **Feature: device-frame-rotation, Property 12: Frame scale independence across frames**

**Property Test 13: Scale transform order before rotation**
- Generate random combinations of frameScale and rotation values
- Apply all to DraggableFrame
- Assert transform string contains scale before any rotation transforms
- **Feature: device-frame-rotation, Property 13: Scale transform order before rotation**

**Property Test 14: Complete transform order with scale**
- Generate random combinations of frameScale, tiltX, tiltY, rotateZ
- Apply all to DraggableFrame
- Assert transform string contains all in order: scale, rotateX, rotateY, rotateZ
- **Feature: device-frame-rotation, Property 14: Complete transform order with scale**

**Property Test 15: Frame scale state persistence per frame**
- Generate random screen index, frame index, and frameScale value
- Call handleTransformChange with 'frameScale'
- Assert ScreenImage at that index contains the correct frameScale value
- **Feature: device-frame-rotation, Property 15: Frame scale state persistence per frame**

**Property Test 16: Frame scale state isolation between screens**
- Generate random screens array with at least 2 screens
- Set frameScale on frame in screen 0
- Assert all frames in screen 1 have unchanged frameScale values
- **Feature: device-frame-rotation, Property 16: Frame scale state isolation between screens**

**Property Test 17: Frame scale value clamping**
- Generate random values including values outside [20, 200]
- Apply clamping function
- Assert result is within [20, 200]
- **Feature: device-frame-rotation, Property 17: Frame scale value clamping**

#### Integration Tests

While not part of the core implementation, the following integration tests would provide additional confidence:

1. **Export fidelity** - Export a canvas with transformed frames and verify the PNG contains the transforms
2. **Multi-screen workflow** - Create multiple screens, apply different transforms to each, verify isolation
3. **Composition compatibility** - Test transforms work correctly with all composition types (single, dual, stack, triple, fan)

These integration tests are optional and can be added in a future iteration if needed.
