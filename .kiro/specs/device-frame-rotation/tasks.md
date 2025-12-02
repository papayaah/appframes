# Implementation Plan

- [ ] 1. Extend data model with transform properties
  - [ ] 1.1 Update ScreenImage interface to include tiltX, tiltY, rotateZ properties
    - Add optional number fields with JSDoc comments documenting ranges
    - Update types.ts file
    - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 2. Implement transform application in CompositionRenderer
  - [ ] 2.1 Create transform extraction helper in CompositionRenderer
    - Add getFrameTransform function to extract tiltX, tiltY, rotateZ from ScreenImage
    - Provide default values of 0 for undefined transforms
    - _Requirements: 1.1, 1.2, 2.1_
  
  - [ ] 2.2 Update DraggableFrame component to accept and apply transforms
    - Add tiltX, tiltY, rotateZ props to DraggableFrame
    - Build CSS transform string with correct order: base transform, translate, rotateX, rotateY, rotateZ
    - Add transformStyle: 'preserve-3d' for 3D transforms
    - _Requirements: 1.1, 1.2, 2.1, 2.3_
  
  - [ ] 2.3 Add perspective container for 3D depth effect
    - Wrap composition content in Box with perspective: '2000px'
    - Set perspectiveOrigin to 'center center'
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.4 Update getFrameProps to pass transform values to DraggableFrame
    - Extract transforms using getFrameTransform helper
    - Pass tiltX, tiltY, rotateZ to DraggableFrame wrapper
    - _Requirements: 1.1, 1.2, 2.1, 2.5_
  
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

- [ ] 3. Implement transform state management in AppFrames
  - [ ] 3.1 Create handleTransformChange callback in AppFrames
    - Accept screenIndex, frameIndex, property name, and value
    - Update ScreenImage in screens state with new transform value
    - Ensure images array has enough slots for frameIndex
    - _Requirements: 4.1, 4.2_
  
  - [ ] 3.2 Create clampTransform utility function
    - Clamp tiltX and tiltY to [-60, 60]
    - Clamp rotateZ to [-180, 180]
    - Export from types.ts or new utils file
    - _Requirements: 6.1, 6.2, 6.3_
  
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

- [ ] 4. Add transform controls to SidebarTabs (Device Tab)
  - [ ] 4.1 Read DeviceTab component to understand current structure
    - Identify where to add transform controls section
    - Understand how current controls access selected frame data
    - _Requirements: 3.1_
  
  - [ ] 4.2 Add Transform section with tilt X slider
    - Add Stack with "Transform" heading
    - Create Slider for tiltX with range [-60, 60], step 1
    - Add marks at -60, 0, 60 with degree labels
    - Wire onChange to call handleTransformChange
    - _Requirements: 1.1, 3.1, 3.2, 3.4, 6.1, 6.5_
  
  - [ ] 4.3 Add tilt Y slider
    - Create Slider for tiltY with range [-60, 60], step 1
    - Add marks at -60, 0, 60 with degree labels
    - Wire onChange to call handleTransformChange
    - _Requirements: 1.2, 3.1, 3.2, 3.4, 6.2, 6.5_
  
  - [ ] 4.4 Add rotation slider
    - Create Slider for rotateZ with range [-180, 180], step 1
    - Add marks at -180, 0, 180 with degree labels
    - Wire onChange to call handleTransformChange
    - _Requirements: 2.1, 3.1, 3.3, 3.4, 6.3, 6.5_
  
  - [ ] 4.5 Add reset transforms button
    - Create Button with "Reset Transforms" label
    - onClick sets all three transforms to 0 for selected frame
    - _Requirements: 3.5_
  
  - [ ] 4.6 Pass handleTransformChange callback from AppFrames to SidebarTabs
    - Add onTransformChange prop to SidebarTabs
    - Pass handleTransformChange from AppFrames
    - Call with correct screenIndex and frameIndex
    - _Requirements: 3.4, 4.1_
  
  - [ ]* 4.7 Write unit tests for transform controls
    - Test controls presence in rendered component
    - Test slider range configuration
    - Test onChange callback invocation
    - Test reset button functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.5_

- [ ] 5. Ensure new screens initialize with default transform values
  - [ ] 5.1 Verify addScreen function initializes transforms correctly
    - Check that new ScreenImage objects have undefined or 0 transforms
    - No explicit initialization needed if using optional properties
    - _Requirements: 4.5_
  
  - [ ]* 5.2 Write unit test for new screen initialization
    - Test that new screens have undefined/0 transform values
    - _Requirements: 4.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Manual testing and refinement
  - [ ] 7.1 Test transform controls with single composition
    - Verify sliders update frame transforms in real-time
    - Verify reset button works
    - _Requirements: 1.1, 1.2, 2.1, 3.4, 3.5_
  
  - [ ] 7.2 Test transforms with multi-frame compositions (dual, stack, triple, fan)
    - Verify each frame can have independent transforms
    - Verify frame selection updates controls to show correct values
    - _Requirements: 2.5_
  
  - [ ] 7.3 Test transform persistence across screen switching
    - Apply transforms to frames in screen 1
    - Switch to screen 2, apply different transforms
    - Switch back to screen 1, verify transforms are preserved
    - _Requirements: 4.2_
  
  - [ ] 7.4 Test export with transformed frames
    - Apply various transforms to frames
    - Export canvas as PNG
    - Verify exported image shows transforms correctly
    - _Requirements: 1.5, 5.1, 5.2_
  
  - [ ] 7.5 Test edge cases
    - Test extreme tilt values (±60°)
    - Test extreme rotation values (±180°)
    - Test combining all three transforms
    - Verify no visual glitches or clipping issues
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
