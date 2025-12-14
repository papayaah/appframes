# Implementation Plan

- [ ] 1. Create ExportService core functionality
  - Create lib/ExportService.ts with ExportService class
  - Implement renderScreenToImage() method to render a screen using CompositionRenderer
  - Implement addWatermark() private method to add watermark overlay for free users
  - Implement isProUser() method to check user subscription status
  - Update renderScreenToImage() to call addWatermark() before converting to image
  - Implement exportScreen() method to export single screen to blob
  - Implement generateFilename() method for consistent filename generation
  - Implement downloadBlob() method to trigger browser download
  - Implement estimateExportSize() method for file size estimation
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.2, 8.3, 8.4, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 1.1 Write property test for PNG format export
  - **Property 2: PNG format export**
  - **Validates: Requirements 2.2**

- [ ]* 1.2 Write property test for JPG format export
  - **Property 3: JPG format export**
  - **Validates: Requirements 2.3**

- [ ]* 1.3 Write property test for filename generation
  - **Property 12: Filename generation**
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 1.4 Write property test for export dimensions accuracy
  - **Property 20: Export dimensions accuracy**
  - **Validates: Requirements 8.3**

- [ ]* 1.5 Write property test for free user watermark application
  - **Property 30: Free user watermark application**
  - **Validates: Requirements 12.1, 12.2**

- [ ]* 1.6 Write property test for pro user watermark exclusion
  - **Property 31: Pro user watermark exclusion**
  - **Validates: Requirements 12.5**

- [ ] 2. Implement ZIP export functionality
  - Add exportScreensToZip() method to ExportService
  - Implement folder structure creation by canvas size
  - Implement sequential screen processing with progress callbacks
  - Implement cancellation token support
  - Add error handling for individual screen failures
  - Generate ZIP blob and return for download
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 10.2_

- [ ]* 2.1 Write property test for ZIP folder structure
  - **Property 15: ZIP folder structure**
  - **Validates: Requirements 6.2, 6.3, 6.4**

- [ ]* 2.2 Write property test for screen order preservation
  - **Property 23: Screen order preservation**
  - **Validates: Requirements 9.2**

- [ ] 3. Create FormatSelector component
  - Create components/AppFrames/FormatSelector.tsx
  - Implement radio group for PNG/JPG selection
  - Add format descriptions and icons
  - Handle format change events
  - Style with Mantine Radio components
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Create QualitySlider component
  - Create components/AppFrames/QualitySlider.tsx
  - Implement slider for quality adjustment (0-100)
  - Display current quality value
  - Disable when PNG format is selected
  - Add quality guidance labels (e.g., "90 = High Quality")
  - Style with Mantine Slider component
  - _Requirements: 2.4, 2.5_

- [ ]* 4.1 Write property test for quality state synchronization
  - **Property 4: Quality state synchronization**
  - **Validates: Requirements 2.5**

- [ ] 5. Create CanvasSizeSelector component
  - Create components/AppFrames/CanvasSizeSelector.tsx
  - Display list of canvas sizes with screens
  - Show canvas size label, dimensions, and screen count for each
  - Implement checkbox selection for each canvas size
  - Add "Select All" and "Deselect All" buttons
  - Group canvas sizes by platform (Apple/Google)
  - Handle selection change events
  - Style with Mantine Checkbox and Stack components
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 5.1 Write property test for canvas size filtering
  - **Property 5: Canvas size filtering**
  - **Validates: Requirements 3.1**

- [ ]* 5.2 Write property test for selection toggle
  - **Property 7: Selection toggle**
  - **Validates: Requirements 3.3**

- [ ]* 5.3 Write property test for export inclusion by selection
  - **Property 8: Export inclusion by selection**
  - **Validates: Requirements 3.4, 3.5**

- [ ] 6. Create ExportPreview component
  - Create components/AppFrames/ExportPreview.tsx
  - Display total number of screens to export
  - Display estimated file size
  - Show selected canvas sizes summary
  - Update in real-time as options change
  - Style with Mantine Text and Badge components
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 6.1 Write property test for screen count accuracy
  - **Property 9: Screen count accuracy**
  - **Validates: Requirements 4.1**

- [ ]* 6.2 Write property test for estimate reactivity
  - **Property 10: Estimate reactivity**
  - **Validates: Requirements 4.2, 4.3**

- [ ] 7. Create WatermarkNotice component
  - Create components/AppFrames/WatermarkNotice.tsx
  - Check if user is pro using isProUser() from ExportService
  - Display watermark notice for free users only
  - Show example text: "Exported images will include 'Made with AppFrames' watermark"
  - Render "Upgrade to Pro" button with upgrade callback
  - Hide component completely for pro users
  - Style with Mantine Alert component (info variant)
  - _Requirements: 12.6, 12.7_

- [ ]* 7.1 Write property test for watermark notice visibility
  - **Property 32: Watermark notice visibility**
  - **Validates: Requirements 12.6**

- [ ] 8. Create ExportProgress component
  - Create components/AppFrames/ExportProgress.tsx
  - Display progress bar
  - Show "Processing X of Y" count
  - Display current screen name being processed
  - Render cancel button
  - Handle cancellation callback
  - Style with Mantine Progress and Button components
  - _Requirements: 7.1, 7.2, 7.3, 10.1_

- [ ]* 8.1 Write property test for progress screen name accuracy
  - **Property 17: Progress screen name accuracy**
  - **Validates: Requirements 7.2**

- [ ]* 8.2 Write property test for progress count accuracy
  - **Property 18: Progress count accuracy**
  - **Validates: Requirements 7.3**

- [ ] 9. Create ExportModal component
  - Create components/AppFrames/ExportModal.tsx
  - Implement modal with Mantine Modal component
  - Add state management for format, quality, and selected canvas sizes
  - Integrate FormatSelector, QualitySlider, CanvasSizeSelector, ExportPreview, and WatermarkNotice
  - Implement export button with validation (disabled when no selection)
  - Implement cancel button
  - Add export processing state with ExportProgress
  - Handle export completion and errors
  - Call ExportService methods for export operations
  - _Requirements: 1.2, 1.3, 1.4, 3.6, 4.4, 5.5, 7.4, 7.5, 10.4, 10.5_

- [ ]* 9.1 Write property test for modal state toggle
  - **Property 1: Modal state toggle**
  - **Validates: Requirements 1.2**

- [ ]* 9.2 Write property test for single screen direct download
  - **Property 11: Single screen direct download**
  - **Validates: Requirements 5.1, 5.4**

- [ ]* 9.3 Write property test for modal closure on completion
  - **Property 13: Modal closure on completion**
  - **Validates: Requirements 5.5**

- [ ]* 9.4 Write property test for multi-screen ZIP creation
  - **Property 14: Multi-screen ZIP creation**
  - **Validates: Requirements 6.1**

- [ ]* 9.5 Write property test for cancellation stops processing
  - **Property 25: Cancellation stops processing**
  - **Validates: Requirements 10.2**

- [ ]* 9.6 Write property test for cancellation prevents download
  - **Property 26: Cancellation prevents download**
  - **Validates: Requirements 10.3**

- [ ]* 9.7 Write property test for cancellation modal state
  - **Property 27: Cancellation modal state**
  - **Validates: Requirements 10.5**

- [ ] 10. Create ExportButton component
  - Create components/AppFrames/ExportButton.tsx
  - Render prominent "Export" button
  - Handle click to open export modal
  - Show disabled state when no screens exist
  - Style with Mantine Button component
  - _Requirements: 1.1_

- [ ] 11. Create QuickExportButton component
  - Create components/AppFrames/QuickExportButton.tsx
  - Render "Quick Export All" button
  - Implement one-click export all screens as PNG
  - Show loading state during export
  - Display success notification on completion
  - Display error notification on failure
  - Use ExportService for export operation
  - Style with Mantine Button component
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ]* 11.1 Write property test for quick export format and scope
  - **Property 28: Quick export format and scope**
  - **Validates: Requirements 11.2**

- [ ]* 11.2 Write property test for quick export modal bypass
  - **Property 29: Quick export modal bypass**
  - **Validates: Requirements 11.3**

- [ ] 12. Create QuickExportCanvasSizeButton component
  - Create components/AppFrames/QuickExportCanvasSizeButton.tsx
  - Render "Export" button for individual canvas size
  - Implement one-click export for single canvas size as PNG
  - Show loading state during export
  - Display success notification on completion
  - Display error notification on failure
  - Use ExportService for export operation
  - Style with Mantine Button component
  - _Requirements: 11.5_

- [ ] 13. Update StorePreviewRenderer with export functionality
  - Import and integrate ExportButton and QuickExportButton
  - Add state for export modal (opened/closed)
  - Implement export handler that calls ExportService
  - Add ExportModal component with proper props
  - Handle export success and error notifications
  - Position export buttons prominently in the UI
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 14. Update CanvasSizeHeader with quick export button
  - Import QuickExportCanvasSizeButton
  - Add quick export button to canvas size header
  - Position button next to "Edit" button
  - Pass canvas size and screens as props
  - _Requirements: 11.5_

- [ ] 15. Remove export functionality from Header component
  - Remove onExport prop from HeaderProps interface
  - Remove Export button (IconFileZip) from Header render
  - Keep Download button for current screen download
  - Update Download button tooltip to mention Preview for full export
  - Update Header component documentation
  - _Requirements: 13.1, 13.3, 13.5_

- [ ] 16. Remove export handler from AppFrames component
  - Remove handleExport function from AppFrames.tsx
  - Remove onExport prop from Header component usage
  - Keep handleDownload function for current screen download
  - Update AppFrames component documentation
  - _Requirements: 13.1, 13.5_

- [ ] 17. Update Preview navigation button styling
  - Update "Preview" button in Header to be more prominent
  - Add tooltip: "View and export all screenshots"
  - Consider using primary button variant
  - _Requirements: 13.2_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
