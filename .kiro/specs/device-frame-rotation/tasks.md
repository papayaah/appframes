# Implementation Plan

- [ ] 1. Extend data model with transform properties
  - [ ] 1.1 Update ScreenImage interface to include tiltX, tiltY, rotateZ, frameScale properties
    - Add optional number fields with JSDoc comments documenting ranges
    - Update types.ts file
    - _Requirements: 1.1, 1.2, 2.1, 4.1, 7.4, 9.1_
  
  - [ ] 1.2 Remove compositionScale from CanvasSettings interface
    - Remove compositionScale property from CanvasSettings in types.ts
    - _Requirements: 11.2_

- [ ] 2. Implement transform application in CompositionRenderer
  - [ ] 2.1 Create transform extraction helper in CompositionRenderer
    - Add getFrameTransform function to extract tiltX, tiltY, rotateZ from ScreenImage
    - Provide default values of 0 for undefined transforms
    - _Requirements: 1.1, 1.2, 2.1_
  
  - [ ] 2.2 Update DraggableFrame component to accept and apply transforms
    - Add tiltX, tiltY, rotateZ, frameScale props to DraggableFrame
    - Build CSS transform string with correct order: base transform, translate, scale, rotateX, rotateY, rotateZ
    - Add transformStyle: 'preserve-3d' for 3D transforms
    - Add hover state tracking for showing resize handles
    - _Requirements: 1.1, 1.2, 2.1, 2.3, 7.4, 8.3, 8.4_
  
  - [ ] 2.3 Add perspective container for 3D depth effect
    - Wrap composition content in Box with perspective: '2000px'
    - Set perspectiveOrigin to 'center center'
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.4 Update getFrameProps to pass transform values to DraggableFrame
    - Extract transforms using getFrameTransform helper
    - Pass tiltX, tiltY, rotateZ, frameScale to DraggableFrame wrapper
    - Remove usage of compositionScale from CanvasSettings
    - Use per-frame frameScale instead of global compositionScale
    - _Requirements: 1.1, 1.2, 2.1, 2.5, 7.4, 11.4_
  
  - [ ]* 2.5 Write property test for tilt X transform application
    - **Property 1: Tilt X transform application**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.6 Write property test for tilt Y transform application
    - **Property 2: Tilt Y transform application**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.7 Write property test for rotation transform application
    - **Property 3: Rotation transform application**
    - **Validates: Requirements 2.1**
  
  - [ ]* 2.8 Write property test for combined transform order
    - **Property 4: Combined transform order**
    - **Validates: Requirements 2.3**
  
  - [ ]* 2.9 Write property test for transform independence across frames
    - **Property 5: Transform independence across frames**
    - **Validates: Requirements 2.5**
  
  - [ ]* 2.10 Write unit test for zero transform example
    - Test that zero/undefined transforms result in no rotation transforms
    - _Requirements: 1.4, 2.4_
  
  - [ ]* 2.11 Write property test for frame scale transform application
    - **Property 11: Frame scale transform application**
    - **Validates: Requirements 7.4**
  
  - [ ]* 2.12 Write property test for frame scale independence across frames
    - **Property 12: Frame scale independence across frames**
    - **Validates: Requirements 7.6**
  
  - [ ]* 2.13 Write property test for scale transform order before rotation
    - **Property 13: Scale transform order before rotation**
    - **Validates: Requirements 8.3**
  
  - [ ]* 2.14 Write property test for complete transform order with scale
    - **Property 14: Complete transform order with scale**
    - **Validates: Requirements 8.4**

- [ ] 3. Implement transform state management in AppFrames
  - [ ] 3.1 Create handleTransformChange callback in AppFrames
    - Accept screenIndex, frameIndex, property name, and value
    - Update ScreenImage in screens state with new transform value
    - Ensure images array has enough slots for frameIndex
    - _Requirements: 4.1, 4.2_
  
  - [ ] 3.2 Create clampTransform utility function
    - Clamp tiltX and tiltY to [-60, 60]
    - Clamp rotateZ to [-180, 180]
    - Clamp frameScale to [20, 200]
    - Export from types.ts or new utils file
    - _Requirements: 6.1, 6.2, 6.3, 10.1_
  
  - [ ] 3.3 Apply clamping in handleTransformChange
    - Call clampTransform before storing value
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 3.4 Write property test for transform state persistence
    - **Property 6: Transform state persistence per frame**
    - **Validates: Requirements 4.1**
  
  - [ ]* 3.5 Write property test for transform state isolation between screens
    - **Property 7: Transform state isolation between screens**
    - **Validates: Requirements 4.2**
  
  - [ ]* 3.6 Write property test for tilt X value clamping
    - **Property 8: Tilt X value clamping**
    - **Validates: Requirements 6.1**
  
  - [ ]* 3.7 Write property test for tilt Y value clamping
    - **Property 9: Tilt Y value clamping**
    - **Validates: Requirements 6.2**
  
  - [ ]* 3.8 Write property test for rotation value clamping
    - **Property 10: Rotation value clamping**
    - **Validates: Requirements 6.3**
  
  - [ ]* 3.9 Write property test for frame scale state persistence
    - **Property 15: Frame scale state persistence per frame**
    - **Validates: Requirements 9.1**
  
  - [ ]* 3.10 Write property test for frame scale state isolation between screens
    - **Property 16: Frame scale state isolation between screens**
    - **Validates: Requirements 9.2**
  
  - [ ]* 3.11 Write property test for frame scale value clamping
    - **Property 17: Frame scale value clamping**
    - **Validates: Requirements 10.1**

- [ ] 4. Create ResizeHandles component for interactive resizing
  - [ ] 4.1 Create ResizeHandles component file
    - Create new file components/AppFrames/ResizeHandles.tsx
    - Define ResizeHandlesProps interface with frameIndex, callbacks, isActive
    - Define ResizeHandle type for handle positions
    - _Requirements: 7.1_
  
  - [ ] 4.2 Implement handle rendering
    - Render 8 handles: 4 corners (top-left, top-right, bottom-left, bottom-right) + 4 edges (top, right, bottom, left)
    - Position handles absolutely relative to frame bounds
    - Style handles with hover effects
    - Show handles only when isActive is true
    - _Requirements: 7.1, 7.5_
  
  - [ ] 4.3 Implement drag interaction logic
    - Add onMouseDown handler to initiate drag
    - Track initial mouse position and current scale
    - Add document-level onMouseMove to track drag delta
    - Add document-level onMouseUp to finalize drag
    - Clean up event listeners on unmount
    - _Requirements: 7.2, 7.3_
  
  - [ ] 4.4 Implement resize calculation
    - Corner handles: calculate proportional resize maintaining aspect ratio
    - Edge handles: calculate single-dimension resize
    - Apply sensitivity factor to delta for smooth control
    - Call onResize callback with calculated delta
    - _Requirements: 7.2, 7.3_
  
  - [ ] 4.5 Integrate ResizeHandles into DraggableFrame
    - Import ResizeHandles component
    - Render ResizeHandles when frame is hovered
    - Pass frameIndex and resize callbacks
    - _Requirements: 7.1_
  
  - [ ]* 4.6 Write unit test for resize handles appearance
    - Test that handles render when isActive is true
    - Test that handles don't render when isActive is false
    - _Requirements: 7.1_

- [ ] 5. Remove compositionScale from codebase
  - [ ] 5.1 Remove compositionScale from FramesContext default settings
    - Update defaultSettings in FramesContext.tsx
    - _Requirements: 11.2_
  
  - [ ] 5.2 Remove compositionScale slider from Sidebar component
    - Remove the composition scale slider and label from Sidebar.tsx
    - _Requirements: 11.1_
  
  - [ ] 5.3 Update CompositionRenderer to remove compositionScale usage
    - Remove scale calculation from compositionScale
    - Verify no references to settings.compositionScale remain
    - _Requirements: 11.4_
  
  - [ ] 5.4 Update OverflowDeviceRenderer to remove compositionScale usage
    - Remove scale calculation from compositionScale
    - Verify no references to settings.compositionScale remain
    - _Requirements: 11.4_
  
  - [ ] 5.5 Remove compositionScale from PersistenceDB
    - Remove compositionScale validation and defaults
    - Update migration to ignore compositionScale when loading
    - _Requirements: 11.2, 11.3_
  
  - [ ] 5.6 Remove compositionScale from test fixtures
    - Update PersistenceDB.test.ts to remove compositionScale
    - _Requirements: 11.2_
  
  - [ ]* 5.7 Write unit tests for compositionScale removal
    - Test that sidebar doesn't render composition scale slider
    - Test that loading data with compositionScale doesn't break
    - Test that CompositionRenderer uses frameScale from ScreenImage
    - _Requirements: 11.1, 11.3, 11.4_

- [ ] 6. Add transform controls to SidebarTabs (Device Tab)
  - [ ] 6.1 Read DeviceTab component to understand current structure
    - Identify where to add transform controls section
    - Understand how current controls access selected frame data
    - _Requirements: 3.1_
  
  - [ ] 6.2 Add Transform section with tilt X slider
    - Add Stack with "Transform" heading
    - Create Slider for tiltX with range [-60, 60], step 1
    - Add marks at -60, 0, 60 with degree labels
    - Wire onChange to call handleTransformChange
    - _Requirements: 1.1, 3.1, 3.2, 3.4, 6.1, 6.5_
  
  - [ ] 6.3 Add tilt Y slider
    - Create Slider for tiltY with range [-60, 60], step 1
    - Add marks at -60, 0, 60 with degree labels
    - Wire onChange to call handleTransformChange
    - _Requirements: 1.2, 3.1, 3.2, 3.4, 6.2, 6.5_
  
  - [ ] 6.4 Add rotation slider
    - Create Slider for rotateZ with range [-180, 180], step 1
    - Add marks at -180, 0, 180 with degree labels
    - Wire onChange to call handleTransformChange
    - _Requirements: 2.1, 3.1, 3.3, 3.4, 6.3, 6.5_
  
  - [ ] 6.5 Add reset transforms button
    - Create Button with "Reset Transforms" label
    - onClick sets all transforms (tiltX, tiltY, rotateZ, frameScale) to defaults
    - _Requirements: 3.5_
  
  - [ ] 6.6 Pass handleTransformChange callback from AppFrames to SidebarTabs
    - Add onTransformChange prop to SidebarTabs
    - Pass handleTransformChange from AppFrames
    - Call with correct screenIndex and frameIndex
    - _Requirements: 3.4, 4.1_
  
  - [ ]* 6.7 Write unit tests for transform controls
    - Test controls presence in rendered component
    - Test slider range configuration
    - Test onChange callback invocation
    - Test reset button functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.5_

- [ ] 7. Ensure new screens initialize with default transform values
  - [ ] 7.1 Verify addScreen function initializes transforms correctly
    - Check that new ScreenImage objects have undefined or 0 transforms
    - Check that frameScale defaults to 100 or undefined
    - No explicit initialization needed if using optional properties
    - _Requirements: 4.5, 9.5_
  
  - [ ]* 7.2 Write unit test for new screen initialization
    - Test that new screens have undefined/0 transform values
    - Test that new frames have frameScale of 100 or undefined
    - _Requirements: 4.5, 9.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Manual testing and refinement
  - [ ] 9.1 Test transform controls with single composition
    - Verify sliders update frame transforms in real-time
    - Verify reset button works
    - _Requirements: 1.1, 1.2, 2.1, 3.4, 3.5_
  
  - [ ] 9.2 Test resize handles with single frame
    - Verify handles appear on hover
    - Verify corner handles resize proportionally
    - Verify edge handles resize single dimension
    - Verify scale constraints (20-200%)
    - _Requirements: 7.1, 7.2, 7.3, 10.1_
  
  - [ ] 9.3 Test transforms with multi-frame compositions (dual, stack, triple, fan)
    - Verify each frame can have independent transforms and scales
    - Verify frame selection updates controls to show correct values
    - _Requirements: 2.5, 7.6_
  
  - [ ] 9.4 Test transform persistence across screen switching
    - Apply transforms and scales to frames in screen 1
    - Switch to screen 2, apply different transforms and scales
    - Switch back to screen 1, verify all values are preserved
    - _Requirements: 4.2, 9.2_
  
  - [ ] 9.5 Test export with transformed and resized frames
    - Apply various transforms and scales to frames
    - Export canvas as PNG
    - Verify exported image shows all transforms correctly
    - _Requirements: 1.5, 5.1, 5.2_
  
  - [ ] 9.6 Test compositionScale removal
    - Verify sidebar doesn't show composition scale slider
    - Load an old composition with compositionScale value
    - Verify it loads without errors and uses per-frame scales
    - _Requirements: 11.1, 11.3_
  
  - [ ] 9.7 Test edge cases
    - Test extreme tilt values (±60°)
    - Test extreme rotation values (±180°)
    - Test extreme scale values (20%, 200%)
    - Test combining all transforms together
    - Verify no visual glitches or clipping issues
    - _Requirements: 6.1, 6.2, 6.3, 10.1_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
