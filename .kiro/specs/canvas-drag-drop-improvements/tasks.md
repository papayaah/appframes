# Implementation Plan

- [x] 1. Implement smart frame selection logic
  - Create helper functions for determining next empty screen index
  - Add getCompositionFrameCount function to map composition types to frame counts
  - Add findNextEmptyScreenIndex function with empty array handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 1.1 Write property test for empty frame selection
  - **Property 2: Empty frame selection priority**
  - **Validates: Requirements 2.2, 2.5**

- [ ]* 1.2 Write property test for fallback behavior
  - **Property 3: Fallback to selected frame**
  - **Validates: Requirements 2.3**

- [x] 2. Update Canvas drag-and-drop handler in AppFrames.tsx
  - Modify the onReplaceScreen callback to use findNextEmptyScreenIndex
  - Update selectedScreenIndex after filling a frame
  - Handle the case where a new screen needs to be added vs replacing existing
  - _Requirements: 2.1, 2.2, 2.3, 4.3_

- [ ]* 2.1 Write unit tests for drag-and-drop logic
  - Test empty canvas scenario
  - Test single device composition
  - Test multi-device compositions (dual, triple, fan)
  - Test all-frames-filled scenario
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Verify media library persistence
  - Confirm handleMediaUpload is being called correctly
  - Ensure mediaId is properly returned and used
  - Test that files appear in media library after drop
  - _Requirements: 1.1, 1.2, 1.5_

- [ ]* 3.1 Write property test for media library persistence
  - **Property 1: Media library persistence**
  - **Validates: Requirements 1.1, 1.2, 1.5**

- [ ]* 3.2 Write property test for thumbnail generation
  - **Property 5: Thumbnail generation consistency**
  - **Validates: Requirements 1.3**

- [x] 4. Add error handling and user feedback
  - Ensure error messages are shown when upload fails
  - Verify only first file is processed in multi-file drops
  - Add console logging for debugging
  - _Requirements: 3.3, 3.4, 4.4_

- [ ]* 4.1 Write property test for single file processing
  - **Property 4: Single file processing**
  - **Validates: Requirements 3.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
