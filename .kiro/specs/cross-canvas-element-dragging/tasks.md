# Implementation Plan

- [ ] 1. Set up core data structures and interfaces
  - Add `partialElements` field to Screen interface in types.ts
  - Create PartialElementData interface with element type, position, clipping, and element-specific data
  - Create CrossCanvasDragState interface for drag state management
  - _Requirements: 2.2, 2.4_

- [ ] 2. Implement CrossCanvasDragContext for global drag state management
  - Create CrossCanvasDragContext.tsx with React Context provider
  - Implement `startDrag()` method to initiate cross-canvas drag operations
  - Implement `updateDragPosition()` method to track drag position and recalculate intersections
  - Implement `endDrag()` method to finalize drag and create partial elements
  - Implement `calculateIntersections()` method using rectangle intersection algorithm
  - Implement `getOverlappingScreens()` method to return screens that overlap with dragged element
  - Add useCrossCanvasDrag hook for consuming context
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 6.4, 9.1_

- [ ]* 2.1 Write property test for intersection calculation correctness
  - **Property 5: Intersection calculation correctness**
  - **Validates: Requirements 2.1, 2.3**

- [ ]* 2.2 Write property test for non-overlapping screens unchanged
  - **Property 7: Non-overlapping screens unchanged**
  - **Validates: Requirements 2.5**

- [ ]* 2.3 Write property test for continuous intersection calculation
  - **Property 30: Continuous intersection calculation**
  - **Validates: Requirements 9.1**

- [ ]* 2.4 Write property test for grid layout intersection correctness
  - **Property 23: Grid layout intersection correctness**
  - **Validates: Requirements 6.4**

- [ ] 3. Integrate CrossCanvasDragContext into AppFrames
  - Wrap AppFrames component tree with CrossCanvasDragProvider
  - Implement `addPartialElement()` handler to add partial element data to screens
  - Implement `removePartialElements()` handler to remove partial elements by element ID
  - Implement `updatePartialElement()` handler for repositioning operations
  - Pass handlers down to child components via props
  - _Requirements: 2.2, 2.4, 7.1, 7.2, 10.2, 10.3_

- [ ]* 3.1 Write property test for partial element data storage
  - **Property 6: Partial element data storage**
  - **Validates: Requirements 2.2, 2.4**

- [ ]* 3.2 Write property test for screen removal cleanup
  - **Property 25: Screen removal cleanup**
  - **Validates: Requirements 7.2**

- [ ] 4. Implement PartialElementRenderer component
  - Create PartialElementRenderer.tsx component
  - Accept partialElement, screenDimensions, and scale props
  - Calculate CSS clip-path using inset() function based on clip region
  - Position element relative to screen using screenX and screenY
  - Render device frame type with proper clipping when elementType is 'deviceFrame'
  - Render text type with proper clipping when elementType is 'text'
  - Apply CSS transforms for scale parameter
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.3, 4.4, 5.1, 5.4_

- [ ]* 4.1 Write property test for thumbnail renders only visible portion
  - **Property 8: Thumbnail renders only visible portion**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 4.2 Write property test for device frame content clipping proportionality
  - **Property 10: Device frame content clipping proportionality**
  - **Validates: Requirements 3.4, 4.3, 5.1**

- [ ]* 4.3 Write property test for text element clipping
  - **Property 11: Text element clipping**
  - **Validates: Requirements 3.5, 4.4, 5.4**

- [ ]* 4.4 Write property test for export scale invariance
  - **Property 14: Export scale invariance**
  - **Validates: Requirements 4.2**

- [ ] 5. Add drag detection to ScreensPanel
  - Add draggable="true" attribute to device frame elements in thumbnails
  - Add draggable="true" attribute to text elements in thumbnails
  - Implement onDragStart handler to capture element data and call CrossCanvasDragContext.startDrag()
  - Implement onDrag handler to update drag position via CrossCanvasDragContext.updateDragPosition()
  - Implement onDragEnd handler to call CrossCanvasDragContext.endDrag()
  - Use dataTransfer to pass element type, source screen index, and element-specific data
  - Calculate drag position relative to ScreensPanel bounds
  - _Requirements: 1.1, 1.3, 11.1, 11.2_

- [ ]* 5.1 Write property test for consistent drag mechanism
  - **Property 37: Consistent drag mechanism**
  - **Validates: Requirements 11.1, 11.2**

- [ ]* 5.2 Write property test for drag preview visibility
  - **Property 1: Drag preview visibility**
  - **Validates: Requirements 1.1**

- [ ] 6. Implement DragOverlay component for visual feedback
  - Create DragOverlay.tsx component
  - Render semi-transparent preview of dragged element at current drag position
  - Highlight borders on all overlapping screens
  - Display split region indicators showing clip boundaries
  - Position absolutely over ScreensPanel
  - Use pointer-events: none to avoid interfering with drag
  - Update in real-time as drag position changes
  - Remove overlay when drag ends
  - _Requirements: 1.2, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 6.1 Write property test for overlapping screen highlighting
  - **Property 2: Overlapping screen highlighting**
  - **Validates: Requirements 1.2**

- [ ]* 6.2 Write property test for preview intersection accuracy
  - **Property 3: Preview intersection accuracy**
  - **Validates: Requirements 1.4**

- [ ]* 6.3 Write property test for overlay indicators during drag
  - **Property 27: Overlay indicators during drag**
  - **Validates: Requirements 8.1**

- [ ]* 6.4 Write property test for overlapping screen visual feedback
  - **Property 28: Overlapping screen visual feedback**
  - **Validates: Requirements 8.3, 8.4**

- [ ]* 6.5 Write property test for drag end cleanup
  - **Property 29: Drag end cleanup**
  - **Validates: Requirements 8.5**

- [ ] 7. Integrate DragOverlay into ScreensPanel
  - Render DragOverlay component when CrossCanvasDragContext.isDragging is true
  - Pass drag state from context to DragOverlay
  - Calculate screen bounds for all visible screens
  - Pass screen bounds to DragOverlay for highlighting
  - _Requirements: 1.2, 8.1, 8.3, 8.4_

- [ ] 8. Implement drop handling in ScreensPanel
  - Implement onDrop handler to receive drop events
  - Get overlapping screens from CrossCanvasDragContext
  - For each overlapping screen, calculate PartialElementData using intersection results
  - Call AppFrames.addPartialElement() for each overlapping screen
  - Handle drop on single screen vs multiple screens
  - _Requirements: 1.5, 2.1, 2.2, 2.4, 9.5_

- [ ]* 8.1 Write property test for drop applies to all overlapping screens
  - **Property 4: Drop applies to all overlapping screens**
  - **Validates: Requirements 1.5, 9.5**

- [ ]* 8.2 Write property test for consistent intersection logic
  - **Property 38: Consistent intersection logic**
  - **Validates: Requirements 11.3**

- [ ]* 8.3 Write property test for consistent storage logic
  - **Property 39: Consistent storage logic**
  - **Validates: Requirements 11.4**

- [ ] 9. Add partial element rendering to Canvas
  - Render partial elements from screen.partialElements array in Canvas.tsx
  - Use PartialElementRenderer component for each partial element
  - Render partial elements after composition but before text captions
  - Pass screen dimensions to PartialElementRenderer
  - Handle empty partialElements array gracefully
  - _Requirements: 3.1, 4.1, 4.6_

- [ ]* 9.1 Write property test for export renders only visible portion
  - **Property 13: Export renders only visible portion**
  - **Validates: Requirements 4.1**

- [ ]* 9.2 Write property test for export positioning and scale accuracy
  - **Property 16: Export positioning and scale accuracy**
  - **Validates: Requirements 4.6**

- [ ] 10. Add partial element rendering to screen thumbnails
  - Render partial elements in ScreensPanel thumbnail rendering
  - Use PartialElementRenderer with scale prop for thumbnail size
  - Render partial elements after main screen content
  - Calculate appropriate scale factor for thumbnail dimensions
  - _Requirements: 3.1, 3.2, 3.6_

- [ ]* 10.1 Write property test for independent thumbnail rendering
  - **Property 9: Independent thumbnail rendering**
  - **Validates: Requirements 3.2**

- [ ]* 10.2 Write property test for thumbnail updates on state change
  - **Property 12: Thumbnail updates on state change**
  - **Validates: Requirements 3.6**

- [ ] 11. Implement device frame partial element rendering
  - In PartialElementRenderer, handle 'deviceFrame' element type
  - Render device frame using frameType from deviceFrameData
  - Apply screenshot content with screenScale, screenPanX, screenPanY from deviceFrameData
  - Clip both frame and screenshot content using clip-path
  - Ensure screenshot is clipped proportionally with frame
  - _Requirements: 3.4, 4.3, 5.1, 5.2, 5.3_

- [ ]* 11.1 Write property test for screenshot aspect ratio preservation
  - **Property 17: Screenshot aspect ratio preservation**
  - **Validates: Requirements 5.2**

- [ ]* 11.2 Write property test for dynamic screenshot visibility updates
  - **Property 18: Dynamic screenshot visibility updates**
  - **Validates: Requirements 5.3**

- [ ] 12. Implement text partial element rendering
  - In PartialElementRenderer, handle 'text' element type
  - Render text using text, fontSize, fontWeight, color, alignment from textData
  - Apply clip-path to clip text at screen boundaries
  - Maintain font styling when clipped
  - _Requirements: 3.5, 4.4, 5.4, 5.5_

- [ ]* 12.1 Write property test for text styling preservation
  - **Property 19: Text styling preservation**
  - **Validates: Requirements 5.5**

- [ ] 13. Implement directional split handling
  - Ensure horizontal drags produce vertical splits (left/right boundaries)
  - Ensure vertical drags produce horizontal splits (top/bottom boundaries)
  - Ensure diagonal drags produce both vertical and horizontal splits
  - Test with various screen arrangements (horizontal row, vertical column, grid)
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 13.1 Write property test for horizontal drag produces vertical splits
  - **Property 20: Horizontal drag produces vertical splits**
  - **Validates: Requirements 6.1**

- [ ]* 13.2 Write property test for vertical drag produces horizontal splits
  - **Property 21: Vertical drag produces horizontal splits**
  - **Validates: Requirements 6.2**

- [ ]* 13.3 Write property test for diagonal drag produces both split types
  - **Property 22: Diagonal drag produces both split types**
  - **Validates: Requirements 6.3**

- [ ] 14. Implement element replacement functionality
  - When dropping a new element on a screen with existing partial elements, replace them
  - When dropping a full element on a screen with partial elements, replace partial with full
  - Update screen.partialElements array to remove old elements and add new ones
  - _Requirements: 7.1, 7.3_

- [ ]* 14.1 Write property test for element replacement
  - **Property 24: Element replacement**
  - **Validates: Requirements 7.1, 7.3**

- [ ] 15. Implement partial element modification isolation
  - Ensure modifying a partial element on one screen doesn't affect other screens
  - Use unique elementId for each partial element instance
  - Update only the specific screen's partialElements array when modifying
  - _Requirements: 7.5_

- [ ]* 15.1 Write property test for partial element modification isolation
  - **Property 26: Partial element modification isolation**
  - **Validates: Requirements 7.5**

- [ ] 16. Implement dynamic preview appearance and removal
  - Show preview when dragged element enters a screen's boundary
  - Remove preview when dragged element exits a screen's boundary
  - Update overlappingScreens state in real-time during drag
  - _Requirements: 9.2, 9.3_

- [ ]* 16.1 Write property test for dynamic preview appearance
  - **Property 31: Dynamic preview appearance**
  - **Validates: Requirements 9.2**

- [ ]* 16.2 Write property test for dynamic preview removal
  - **Property 32: Dynamic preview removal**
  - **Validates: Requirements 9.3**

- [ ] 17. Implement partial element repositioning
  - Allow dragging existing partial elements to new positions
  - Remove previous partial element data from all previously affected screens
  - Calculate new intersections at drop position
  - Create new partial element data for newly overlapping screens
  - Update all affected thumbnails
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 17.1 Write property test for repositioning removes old data
  - **Property 33: Repositioning removes old data**
  - **Validates: Requirements 10.2**

- [ ]* 17.2 Write property test for repositioning creates new data
  - **Property 34: Repositioning creates new data**
  - **Validates: Requirements 10.3**

- [ ]* 17.3 Write property test for repositioning updates UI
  - **Property 35: Repositioning updates UI**
  - **Validates: Requirements 10.4**

- [ ]* 17.4 Write property test for repositioning cleanup for non-overlapping screens
  - **Property 36: Repositioning cleanup for non-overlapping screens**
  - **Validates: Requirements 10.5**

- [ ] 18. Implement consistent visual indicators across element types
  - Use same drag overlay styling for device frames and text elements
  - Use same highlight styling for overlapping screens regardless of element type
  - Use same split region indicators for all element types
  - _Requirements: 11.5_

- [ ]* 18.1 Write property test for consistent visual indicators
  - **Property 40: Consistent visual indicators**
  - **Validates: Requirements 11.5**

- [ ] 19. Ensure export includes partial elements
  - Verify partial elements are rendered in DOM before export
  - Ensure clip-path CSS is applied during html-to-image capture
  - Test export at 1x and 2x resolutions
  - Validate clipping in exported images
  - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [ ]* 19.1 Write property test for independent export rendering
  - **Property 15: Independent export rendering**
  - **Validates: Requirements 4.5**

- [ ] 20. Add performance optimizations
  - Throttle drag position updates to 16ms (60fps)
  - Memoize screen bounds calculation
  - Use React.memo for PartialElementRenderer
  - Only render partial elements for visible screens
  - Use requestAnimationFrame for smooth drag updates
  - _Requirements: 1.3, 8.2, 9.1_

- [ ] 21. Add error handling and validation
  - Validate element type before starting drag
  - Validate PartialElementData structure before rendering
  - Clamp clip region values to element bounds
  - Validate screen indices before access
  - Handle missing element data gracefully in PartialElementRenderer
  - Show placeholder if element cannot be rendered
  - _Requirements: All_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
