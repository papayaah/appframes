# Implementation Plan

- [ ] 1. Add Framer Motion dependency and verify compatibility
  - Install framer-motion package via npm
  - Verify build succeeds without errors
  - Check bundle size impact using bundle analyzer
  - Verify no console warnings about peer dependencies
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2. Migrate image panning in DeviceFrame component
  - [ ] 2.1 Replace screen container Box with motion.div
    - Import motion from framer-motion
    - Convert screen container to motion.div
    - Add drag prop conditionally based on displayImage
    - Set dragMomentum={false} and dragElastic={0}
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 2.2 Implement drag event handlers for pan conversion
    - Create offsetToPan helper function to convert pixels to percentage
    - Implement onDrag handler to calculate newPanX and newPanY
    - Call onPanChange callback with converted values
    - Implement onDragEnd handler for cleanup
    - _Requirements: 1.3, 1.4_

  - [ ] 2.3 Remove old manual event listeners
    - Remove handleMouseDown function
    - Remove manual RAF throttling code
    - Remove document event listeners for mousemove/mouseup
    - Clean up isDragging state if no longer needed
    - _Requirements: 1.2_

  - [ ]* 2.4 Write property test for pan value constraints
    - **Property 1: Pan value constraints**
    - **Validates: Requirements 1.3, 4.1**
    - Generate random drag offsets and screen dimensions
    - Apply drag operation
    - Assert panX and panY are always in [0, 100]

  - [ ]* 2.5 Write property test for pan persistence
    - **Property 2: Frame position persistence (pan)**
    - **Validates: Requirements 1.4**
    - Generate random pan operations
    - Verify onPanChange callback is invoked with correct final values
    - Verify values are persisted to state

  - [ ]* 2.6 Write unit test for drag enablement
    - Test device frame without image has drag disabled
    - Test device frame with image has drag enabled
    - _Requirements: 1.5_

- [ ] 3. Migrate frame positioning in CompositionRenderer
  - [ ] 3.1 Convert DraggableFrame to use motion.div
    - Import motion and useDragControls from framer-motion
    - Replace Box with motion.div
    - Add drag prop and dragControls
    - Set dragListener={false} for handle-only dragging
    - Use style={{ x: frameX, y: frameY }} for positioning
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Implement drag handle with dragControls
    - Create dragControls instance with useDragControls()
    - Add drag handle element with IconGripVertical
    - Implement onPointerDown to call dragControls.start(e)
    - Style handle with grab cursor
    - _Requirements: 2.2_

  - [ ] 3.3 Implement frame drag event handlers
    - Implement onDrag handler to update frameX/frameY
    - Call onFramePositionChange callback with new position
    - Implement onDragEnd for cleanup if needed
    - _Requirements: 2.3, 2.4_

  - [ ] 3.4 Update all composition layouts to use new DraggableFrame
    - Update single composition
    - Update dual composition
    - Update stack composition
    - Update triple composition
    - Update fan composition
    - _Requirements: 2.1_

  - [ ]* 3.5 Write property test for frame position persistence
    - **Property 2: Frame position persistence (frame)**
    - **Validates: Requirements 2.4**
    - Generate random frame drag operations
    - Verify onFramePositionChange callback is invoked correctly
    - Verify values are persisted to state

  - [ ]* 3.6 Write property test for drag independence
    - **Property 3: Drag independence**
    - **Validates: Requirements 2.5**
    - Generate random compositions with N frames
    - Drag one frame
    - Verify other frames' positions remain unchanged

- [ ] 4. Ensure compatibility with existing features
  - [ ] 4.1 Test zoom interaction with Framer Motion drag
    - Test drag at 50% zoom
    - Test drag at 100% zoom
    - Test drag at 200% zoom
    - Verify position calculations are correct at all zoom levels
    - _Requirements: 4.4_

  - [ ] 4.2 Test middle-mouse canvas panning compatibility
    - Test middle-mouse pan works independently
    - Test Framer Motion drag works independently
    - Test both operations in sequence
    - Verify no conflicts or interference
    - _Requirements: 4.5_

  - [ ] 4.3 Verify selection, hover, and highlight behaviors
    - Test frame selection works with new implementation
    - Test hover states work correctly
    - Test highlight during drag-over works
    - _Requirements: 4.2_

  - [ ]* 4.4 Write property test for zoom compatibility
    - **Property 4: Zoom compatibility**
    - **Validates: Requirements 4.4**
    - Generate random zoom levels
    - Perform drag operations at each zoom level
    - Verify position calculations account for zoom scale correctly

  - [ ]* 4.5 Write property test for callback interface preservation
    - **Property 5: Callback interface preservation**
    - **Validates: Requirements 4.3**
    - Generate random drag scenarios
    - Verify all callbacks receive correct parameter types
    - Compare with expected callback signatures

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Performance testing and evaluation
  - [ ] 6.1 Baseline performance measurement (current implementation)
    - Open Chrome DevTools Performance tab
    - Create composition with 10 device frames
    - Record while dragging for 5 seconds
    - Document average frame time and dropped frames
    - _Requirements: 5.4_

  - [ ] 6.2 Framer Motion performance measurement
    - Repeat test with Framer Motion implementation
    - Test with 1 device frame
    - Test with 5 device frames
    - Test with 10 device frames
    - Document average frame time and dropped frames for each
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 6.3 Compare and analyze results
    - Compare frame timing metrics
    - Evaluate subjective smoothness
    - Check for any visual artifacts or issues
    - Verify bundle size impact is acceptable
    - _Requirements: 5.4_

  - [ ] 6.4 Document findings and make recommendation
    - Document performance comparison results
    - Document bundle size impact
    - Document any issues encountered
    - Make recommendation: keep or rollback
    - If keeping: update component documentation
    - If rolling back: document learnings
    - _Requirements: 6.4_

- [ ] 7. Final decision and cleanup
  - [ ] 7.1 If keeping Framer Motion implementation
    - Remove any commented-out old code
    - Update component documentation
    - Update README if needed
    - Close this spec as successful

  - [ ] 7.2 If rolling back
    - Revert all Framer Motion changes
    - Remove framer-motion dependency
    - Verify old implementation works correctly
    - Run full test suite
    - Document why rollback was necessary
    - _Requirements: 6.2, 6.5_
