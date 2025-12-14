# Implementation Plan

- [ ] 1. Create helper functions for canvas size organization
  - Create utility functions for grouping, sorting, and filtering canvas sizes
  - Implement getPlatform() to determine platform from canvas size ID
  - Implement groupCanvasSizesByPlatform() to group canvas sizes by Apple/Google
  - Implement sortCanvasSizes() to sort canvas sizes by dimensions
  - Implement filterNonEmptyCanvasSizes() to filter out empty canvas sizes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.3, 10.4, 10.5_

- [ ]* 1.1 Write property test for platform grouping
  - **Property 2: Platform grouping**
  - **Validates: Requirements 1.3, 2.3**

- [ ]* 1.2 Write property test for canvas size sorting
  - **Property 3: Canvas size sorting**
  - **Validates: Requirements 1.4**

- [ ]* 1.3 Write property test for canvas size filtering
  - **Property 1: Canvas size filtering**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 2. Create PreviewFrame component
  - Create PreviewFrame component that renders a single screen preview
  - Accept screen, scale, and canvasSize as props
  - Render screen name with truncation/wrapping for long names
  - Use CompositionRenderer to render the screen with its settings
  - Apply scaling transformation while maintaining aspect ratio
  - Add error boundary for rendering failures
  - _Requirements: 3.1, 3.2, 4.1, 4.3, 8.4_

- [ ]* 2.1 Write property test for screen name rendering
  - **Property 6: Screen name rendering**
  - **Validates: Requirements 4.1**

- [ ]* 2.2 Write property test for settings application
  - **Property 5: Settings application**
  - **Validates: Requirements 3.2**

- [ ] 3. Create PreviewGrid component
  - Create PreviewGrid component for responsive grid layout
  - Accept screens and canvasSize as props
  - Calculate appropriate scaling for preview frames based on viewport
  - Implement responsive grid that adjusts to viewport width
  - Ensure consistent scaling across all frames in the group
  - Render PreviewFrame for each screen
  - _Requirements: 3.1, 4.2, 8.1, 8.2, 8.3, 8.5_

- [ ]* 3.1 Write property test for screen count rendering
  - **Property 4: Screen count rendering**
  - **Validates: Requirements 3.1**

- [ ]* 3.2 Write property test for screen order preservation
  - **Property 7: Screen order preservation**
  - **Validates: Requirements 4.2**

- [ ]* 3.3 Write property test for scaling calculation
  - **Property 9: Scaling calculation**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 4. Create CanvasSizeHeader component
  - Create CanvasSizeHeader component for canvas size metadata
  - Accept canvasSize, screenCount, and onEdit callback as props
  - Display canvas size label using getCanvasSizeLabel()
  - Display dimensions using getCanvasDimensions()
  - Display screen count indicator
  - Render "Edit" button that calls onEdit callback
  - Style with Mantine components (Group, Text, Button)
  - _Requirements: 2.1, 2.2, 4.4, 7.1, 10.1, 10.2_

- [ ]* 4.1 Write property test for count indicator accuracy
  - **Property 8: Count indicator accuracy**
  - **Validates: Requirements 4.4**

- [ ]* 4.2 Write property test for metadata display
  - **Property 10: Metadata display**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 5. Create CanvasSizeGroup component
  - Create CanvasSizeGroup component to render all screens for a canvas size
  - Accept canvasSize, screens, and onEdit callback as props
  - Render CanvasSizeHeader with metadata
  - Render PreviewGrid with all screens
  - Handle edit button click by calling onEdit with canvasSize
  - Style with Mantine Stack for vertical layout
  - _Requirements: 2.1, 2.2, 3.1, 4.4, 7.1_

- [ ] 6. Create PlatformSection component
  - Create PlatformSection component for platform grouping
  - Accept platform, canvasSizes, screensByCanvasSize, and onEdit as props
  - Render platform header ("Apple App Store" or "Google Play Store")
  - Render CanvasSizeGroup for each canvas size in the platform
  - Provide visual separation with section styling
  - Style with Mantine Stack and Title components
  - _Requirements: 1.3, 2.3, 2.4_

- [ ] 7. Create StorePreviewRenderer component
  - Create main StorePreviewRenderer component
  - Access screensByCanvasSize from FramesContext using useFrames hook
  - Access switchCanvasSize function from FramesContext
  - Filter out canvas sizes with empty screen arrays
  - Group canvas sizes by platform using helper functions
  - Sort canvas sizes within each platform
  - Render PlatformSection for Apple if canvas sizes exist
  - Render PlatformSection for Google if canvas sizes exist
  - Render empty state if no screens exist anywhere
  - Implement onEdit handler that calls switchCanvasSize and navigates to editor
  - Style with Mantine Container and Stack
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Create preview page route
  - Create app/preview/page.tsx for the preview route
  - Mark as client component with 'use client'
  - Wrap StorePreviewRenderer in page layout
  - Add page metadata (title, description)
  - Add "Back to Editor" button that navigates to home route
  - Style with Mantine AppShell or Box for layout
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Add navigation to preview from editor
  - Update Header component to add "Preview" button
  - Position Preview button near Export button
  - Use Next.js Link or router.push to navigate to /preview
  - Style button consistently with other header buttons
  - _Requirements: 5.1_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

