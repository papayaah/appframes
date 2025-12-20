# Design Document

## Overview

This design outlines an experimental migration from manual requestAnimationFrame-based drag handling to Framer Motion's optimized gesture system. The goal is to evaluate whether Framer Motion's built-in performance optimizations improve the smoothness of canvas interactions, particularly when rendering 10+ device frames simultaneously.

Framer Motion provides:
- Hardware-accelerated transforms using GPU composite layers
- Optimized pointer event handling with automatic RAF batching
- Built-in drag constraints and momentum
- Declarative API that reduces manual state management

The migration will be implemented incrementally, maintaining all existing functionality while replacing the drag implementation. If performance improvements are not observed, the changes can be cleanly rolled back.

## Architecture

### Current Implementation

The current drag system uses:
- Manual `mousedown`/`mousemove`/`mouseup` event listeners
- `requestAnimationFrame` for throttling updates
- Direct state updates via callbacks (`onPanChange`, `onFramePositionChange`)
- CSS transforms applied via inline styles

**DeviceFrame.tsx** handles image panning:
```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  // Manual RAF throttling
  let rafId: number | null = null;
  let pendingUpdate: { x: number; y: number } | null = null;
  
  const handleMove = (moveEvent: MouseEvent) => {
    pendingUpdate = { x: newPanX, y: newPanY };
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (pendingUpdate) {
          onPanChange(pendingUpdate.x, pendingUpdate.y);
        }
        rafId = null;
      });
    }
  };
}
```

**CompositionRenderer.tsx** handles frame positioning via DraggableFrame wrapper.

### Proposed Architecture

Replace manual event handling with Framer Motion's declarative drag system:

```typescript
<motion.div
  drag
  dragMomentum={false}
  dragElastic={0}
  onDrag={(event, info) => {
    // Convert offset to percentage
    const newPanX = calculatePanX(info.offset.x);
    const newPanY = calculatePanY(info.offset.y);
    onPanChange(newPanX, newPanY);
  }}
  onDragEnd={(event, info) => {
    // Persist final position
  }}
/>
```

**Key architectural changes:**
1. Replace `<Box>` with `<motion.div>` for draggable elements
2. Remove manual event listeners and RAF management
3. Use Framer Motion's `drag` prop and drag event handlers
4. Convert Framer Motion's pixel offsets to percentage-based pan values
5. Maintain existing callback interfaces for state updates

### Component Hierarchy

```
Canvas.tsx (unchanged)
  └─ CompositionRenderer.tsx (minor changes)
      └─ DraggableFrame (convert to motion.div)
          └─ DeviceFrame.tsx (major changes)
              └─ motion.div (screen container with drag)
```

## Components and Interfaces

### 1. DeviceFrame Component

**Changes:**
- Replace screen container `<Box>` with `<motion.div>`
- Remove `handleMouseDown` and manual event listeners
- Add Framer Motion drag props and handlers
- Convert drag offsets to pan percentages

**Interface (unchanged):**
```typescript
interface DeviceFrameProps {
  // ... existing props remain the same
  onPanChange?: (panX: number, panY: number) => void;
  onFramePositionChange?: (frameX: number, frameY: number) => void;
}
```

**Implementation approach:**
```typescript
// Calculate drag constraints based on screen dimensions
const screenRef = useRef<HTMLDivElement>(null);
const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

// Convert Framer Motion offset to percentage
const offsetToPan = (offset: number, dimension: number) => {
  const percentageChange = (offset / dimension) * 100;
  return Math.max(0, Math.min(100, panX + percentageChange));
};

<motion.div
  ref={screenRef}
  drag={displayImage ? true : false}
  dragMomentum={false}
  dragElastic={0}
  dragConstraints={dragConstraints}
  onDrag={(event, info) => {
    if (onPanChange && screenRef.current) {
      const rect = screenRef.current.getBoundingClientRect();
      const newPanX = offsetToPan(info.offset.x, rect.width);
      const newPanY = offsetToPan(info.offset.y, rect.height);
      onPanChange(newPanX, newPanY);
    }
  }}
  onDragEnd={() => {
    // Reset drag offset for next interaction
  }}
  style={{
    cursor: displayImage ? 'grab' : 'default',
    // ... other styles
  }}
>
  {/* Screen content */}
</motion.div>
```

### 2. DraggableFrame Component

**Changes:**
- Convert from `<Box>` to `<motion.div>`
- Add drag handling for frame positioning
- Use `dragControls` for handle-initiated dragging

**Implementation approach:**
```typescript
import { motion, useDragControls } from 'framer-motion';

const DraggableFrame = ({
  children,
  baseStyle,
  fixedWidth,
  frameX,
  frameY,
  onFramePositionChange
}: {
  children: React.ReactNode;
  baseStyle?: React.CSSProperties;
  fixedWidth?: boolean;
  frameX: number;
  frameY: number;
  onFramePositionChange?: (x: number, y: number) => void;
}) => {
  const dragControls = useDragControls();
  
  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false} // Only drag via handle
      style={{
        ...baseStyle,
        x: frameX,
        y: frameY,
        willChange: 'transform',
      }}
      onDrag={(event, info) => {
        onFramePositionChange?.(info.point.x, info.point.y);
      }}
    >
      {children}
      {/* Drag handle */}
      <motion.div
        onPointerDown={(e) => dragControls.start(e)}
        style={{
          position: 'absolute',
          cursor: 'grab',
          // ... handle styles
        }}
      >
        <IconGripVertical />
      </motion.div>
    </motion.div>
  );
};
```

### 3. Package Dependencies

Add Framer Motion to package.json:
```json
{
  "dependencies": {
    "framer-motion": "^11.0.0"
  }
}
```

**Compatibility:**
- React 19.2.0 ✓ (Framer Motion supports React 18+)
- Next.js 16.0.3 ✓ (Works with App Router)
- TypeScript 5.9.3 ✓ (Full TypeScript support)

**Bundle impact:**
- Framer Motion: ~35KB gzipped
- Tree-shaking: Only import used features (motion, useDragControls)

## Data Models

No changes to existing data models. The migration maintains the same state structure:

```typescript
interface ScreenImage {
  image?: string;
  mediaId?: number;
  deviceFrame?: string;
  panX: number;      // 0-100 percentage
  panY: number;      // 0-100 percentage
  frameX: number;    // Pixel offset
  frameY: number;    // Pixel offset
}
```

Framer Motion's drag offsets are converted to these existing formats in the event handlers.

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pan value constraints

*For any* drag operation on an image within a device frame, the resulting panX and panY values should remain within the range [0, 100]
**Validates: Requirements 1.3, 4.1**

### Property 2: Frame position persistence

*For any* completed drag operation (pan or frame move), the final position should be accurately persisted to state via the appropriate callback
**Validates: Requirements 1.4, 2.4**

### Property 3: Drag independence

*For any* composition with multiple device frames, dragging one frame should not trigger re-renders or position changes in other frames
**Validates: Requirements 2.3, 2.5**

### Property 4: Zoom compatibility

*For any* canvas zoom level, Framer Motion drag operations should correctly account for the scale transform and produce accurate position values
**Validates: Requirements 4.4**

### Property 5: Callback interface preservation

*For any* drag operation, the system should invoke the same callbacks (onPanChange, onFramePositionChange) with the same parameter types as the previous implementation
**Validates: Requirements 4.3**

Note: Requirements 1.5 (drag enablement for empty frames) and 5.1-5.5 (performance testing) are edge cases and manual performance tests respectively, and are not represented as formal properties. These will be validated through unit tests and manual performance profiling.

## Error Handling

### Drag Event Errors

**Scenario:** Framer Motion drag events fail or provide invalid data
- **Handling:** Validate `info.offset` and `info.point` values before processing
- **Fallback:** If values are NaN or undefined, skip the update and log warning
- **Recovery:** Next drag event will provide valid data

### Constraint Calculation Errors

**Scenario:** Screen dimensions cannot be determined (ref not ready)
- **Handling:** Defer drag enablement until ref is populated
- **Fallback:** Use default constraints or disable drag temporarily
- **Recovery:** Re-enable drag once dimensions are available

### State Update Errors

**Scenario:** Callback functions throw errors during drag
- **Handling:** Wrap callback invocations in try-catch
- **Fallback:** Log error but allow drag to continue
- **Recovery:** User can retry the operation

### Bundle Size Concerns

**Scenario:** Framer Motion significantly increases bundle size
- **Handling:** Use bundle analyzer to measure impact
- **Mitigation:** Import only needed features (motion, useDragControls)
- **Rollback:** If bundle increase is unacceptable (>50KB), revert migration

### Performance Regression

**Scenario:** Framer Motion performs worse than manual implementation
- **Handling:** Profile with Chrome DevTools Performance tab
- **Measurement:** Compare frame timing with 10 device frames
- **Rollback:** If average frame time increases by >20%, revert migration

## Testing Strategy

### Unit Tests

**Test 1: Pan value conversion**
- Create a device frame with known dimensions
- Simulate drag with specific offset values
- Verify panX/panY are calculated correctly and constrained to [0, 100]

**Test 2: Callback invocation**
- Mock onPanChange and onFramePositionChange
- Trigger drag operations
- Verify callbacks are called with correct parameters

**Test 3: Drag enablement**
- Render device frame without image
- Verify drag is disabled
- Add image and verify drag is enabled

**Test 4: Drag controls**
- Render DraggableFrame with handle
- Verify drag only initiates from handle, not from frame body

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript property testing library).

Each property-based test should run a minimum of 100 iterations.

**Property Test 1: Pan constraints**
- **Feature: smooth-canvas-performance, Property 1: Pan value constraints**
- Generate random drag offsets and screen dimensions
- Apply drag operation
- Assert panX and panY are always in [0, 100]

**Property Test 2: Callback consistency**
- **Feature: smooth-canvas-performance, Property 5: Callback interface preservation**
- Generate random drag scenarios
- Verify all callbacks receive correct parameter types
- Compare with expected callback signature

**Property Test 3: Multi-frame independence**
- **Feature: smooth-canvas-performance, Property 3: Drag independence**
- Generate random compositions with N frames
- Drag one frame
- Verify other frames' positions remain unchanged

### Integration Tests

**Test 1: Full drag workflow**
- Render Canvas with multiple screens
- Simulate complete drag operation (mousedown → mousemove → mouseup)
- Verify state updates correctly
- Verify UI reflects new position

**Test 2: Zoom interaction**
- Render Canvas with zoom applied
- Perform drag operation
- Verify drag works correctly at different zoom levels (50%, 100%, 200%)

**Test 3: Middle-mouse pan compatibility**
- Enable middle-mouse canvas panning
- Verify it doesn't conflict with Framer Motion drag
- Test both operations in sequence

### Performance Tests

**Manual Performance Testing:**

1. **Baseline measurement (current implementation):**
   - Open Chrome DevTools Performance tab
   - Create composition with 10 device frames
   - Record while dragging for 5 seconds
   - Note average frame time and dropped frames

2. **Framer Motion measurement:**
   - Repeat same test with Framer Motion implementation
   - Compare frame timing metrics
   - Look for improvements in consistency

3. **Success criteria:**
   - Average frame time ≤ 16.67ms (60 FPS)
   - No increase in dropped frames
   - Subjective smoothness improvement

**Automated Performance Monitoring:**
- Use React DevTools Profiler to measure render times
- Compare component render counts before/after
- Verify no unnecessary re-renders introduced

### Rollback Testing

**Test 1: Clean removal**
- Remove Framer Motion dependency
- Restore previous implementation
- Verify all functionality works
- Run full test suite

**Test 2: Git revert**
- Verify changes are in clean commits
- Test git revert of migration commits
- Ensure no orphaned code or imports

## Implementation Notes

### Migration Strategy

**Phase 1: Add dependency**
- Install framer-motion
- Verify build succeeds
- Check for any peer dependency warnings

**Phase 2: Migrate image panning (DeviceFrame)**
- Replace screen container with motion.div
- Implement drag handlers
- Test with single frame
- Verify existing tests pass

**Phase 3: Migrate frame positioning (DraggableFrame)**
- Convert to motion.div with dragControls
- Implement handle-based dragging
- Test with multiple frames
- Verify composition layouts work

**Phase 4: Performance testing**
- Test with 1, 5, 10 frames
- Profile and compare metrics
- Document findings

**Phase 5: Decision**
- If successful: Clean up old code, update documentation
- If unsuccessful: Rollback changes, document learnings

### Framer Motion Configuration

**Recommended settings for this use case:**
```typescript
<motion.div
  drag
  dragMomentum={false}        // Disable momentum for precise control
  dragElastic={0}             // Disable elastic bounds
  dragTransition={{           // Smooth drag response
    power: 0,
    timeConstant: 0
  }}
  whileDrag={{                // Visual feedback
    cursor: 'grabbing'
  }}
/>
```

### Potential Issues and Solutions

**Issue 1: Transform conflicts**
- Problem: Canvas zoom uses transform, Framer Motion uses transform
- Solution: Use Framer Motion's `style` prop with x/y instead of transform
- Alternative: Nest transforms carefully (zoom on parent, drag on child)

**Issue 2: Percentage-based positioning**
- Problem: Framer Motion works in pixels, we need percentages
- Solution: Convert in event handlers using element dimensions
- Cache: Store element rect to avoid repeated getBoundingClientRect calls

**Issue 3: Drag constraints**
- Problem: Image panning needs to stay within bounds
- Solution: Calculate constraints dynamically based on image/screen size
- Update: Recalculate when image or scale changes

**Issue 4: Event propagation**
- Problem: Multiple nested draggable elements
- Solution: Use `dragListener={false}` and `dragControls` for handle-only drag
- Prevent: Stop propagation in handle's onPointerDown

### Performance Optimization Tips

1. **Avoid inline functions:** Define drag handlers outside render
2. **Memoize calculations:** Use useMemo for constraint calculations
3. **Batch updates:** Let Framer Motion handle RAF batching
4. **Minimize re-renders:** Use React.memo for DeviceFrame if needed
5. **Profile first:** Measure before optimizing further

### Documentation Requirements

After implementation, document:
- Performance comparison results (frame timing, subjective feel)
- Bundle size impact (before/after)
- Any issues encountered and solutions
- Recommendation: Keep or rollback
- If keeping: Update component documentation
- If rolling back: Document why and what was learned
