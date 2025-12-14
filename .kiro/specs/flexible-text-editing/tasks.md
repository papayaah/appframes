# Implementation Plan

## Phase 1: Data Structures & Migration

- [ ] 1. Update TypeScript interfaces
  - Add TextElement interface to types.ts
  - Add textElements array to Screen interface
  - Add selectedTextId to CanvasSettings
  - Remove caption fields from CanvasSettings (captionText, showCaption, captionStyle, captionVertical, captionHorizontal)
  - _Requirements: US-1, US-5_

- [ ] 2. Implement ID generation utility
  - Add generateId function (timestamp-based or nanoid)
  - Test ID uniqueness
  - _Requirements: US-1_

- [ ] 3. Create migration function
  - Implement migrateScreenToTextElements function
  - Convert old caption data to first text element
  - Clean up old caption fields after migration
  - Handle edge cases (missing data, invalid values)
  - _Requirements: Migration Strategy_

- [ ]* 3.1 Write property test for migration data integrity
  - **Property 7: Migration data integrity**
  - **Validates: Migration Strategy**

- [ ] 4. Run migration on app initialization
  - Add migration call in AppFrames.tsx or FramesContext.tsx
  - Migrate all screens in screensByCanvasSize
  - Log migration results for debugging
  - _Requirements: Migration Strategy_

- [ ] 5. Update persistence layer
  - Verify textElements array persists to IndexedDB
  - Test save/load cycle with text elements
  - _Requirements: US-1_

- [ ]* 5.1 Write property test for text element persistence
  - **Property 1: Text element persistence**
  - **Validates: Requirements US-1, US-2, US-3, US-4**

## Phase 2: Core Text Element Component

- [ ] 6. Create TextElement component
  - Create components/AppFrames/TextElement.tsx
  - Implement basic rendering with position transform
  - Add rotation transform: `translate(-50%, -50%) rotate(${rotation}deg)`
  - Render markdown content using react-markdown
  - Apply TextStyle properties to rendered text
  - _Requirements: US-1, US-3, US-4_

- [ ] 7. Implement drag-to-move functionality
  - Reuse drag logic from DraggableText component
  - Handle mousedown, mousemove, mouseup events
  - Update x, y position (0-100% of canvas)
  - Show grab/grabbing cursor
  - Prevent dragging while editing
  - _Requirements: US-3_

- [ ] 8. Implement double-click to edit
  - Enter edit mode on double-click
  - Show textarea with current content
  - Focus and select text automatically
  - Apply same font styles to textarea
  - _Requirements: US-2_

- [ ] 9. Implement edit mode controls
  - Save on Enter key (without Shift)
  - Cancel on Escape key (revert changes)
  - Save on blur (click outside)
  - Show save/cancel hint below textarea
  - _Requirements: US-2_

- [ ] 10. Add hover and selection states
  - Show dashed border on hover
  - Show solid violet border when selected
  - Display tooltip on hover: "Drag to move, double-click to edit"
  - Handle click to select
  - _Requirements: US-3, US-5_

- [ ]* 10.1 Write unit tests for TextElement
  - Test drag updates x, y correctly
  - Test double-click enters edit mode
  - Test Enter saves, Escape cancels
  - Test selection border appears when isSelected=true
  - _Requirements: US-2, US-3, US-5_

## Phase 3: Rotation Functionality

- [ ] 11. Add rotation handle to TextElement
  - Render rotation handle at top center when selected
  - Use IconRotate from @tabler/icons-react
  - Position handle outside bounding box
  - Style as circular button with violet background
  - _Requirements: US-4_

- [ ] 12. Implement rotation drag logic
  - Calculate center point of text element
  - Use Math.atan2 to calculate angle from center
  - Update rotation on mousemove
  - Normalize rotation to 0-360 range
  - _Requirements: US-4_

- [ ] 13. Add rotation angle snapping
  - Snap to 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
  - Snap when within 5° of target angle
  - Show angle tooltip while dragging (e.g., "45°")
  - _Requirements: US-4_

- [ ]* 13.1 Write property test for rotation transform correctness
  - **Property 3: Rotation transform correctness**
  - **Validates: Requirements US-4**

- [ ]* 13.2 Write unit tests for rotation
  - Test rotation handle appears when selected
  - Test rotation updates angle correctly
  - Test angle normalization (negative, >360)
  - Test snapping to common angles
  - _Requirements: US-4_

## Phase 4: State Management Functions

- [ ] 14. Add text element state to FramesContext
  - Add selectedTextId state
  - Export selectedTextId in context value
  - _Requirements: US-5_

- [ ] 15. Implement addTextElement function
  - Create new TextElement with defaults
  - Add to current screen's textElements array
  - Set as selected text
  - Trigger auto-save
  - _Requirements: US-1_

- [ ] 16. Implement updateTextElement function
  - Find text element by ID
  - Apply partial updates
  - Trigger auto-save
  - _Requirements: US-2, US-3, US-4, US-5_

- [ ]* 16.1 Write property test for independent text styling
  - **Property 2: Independent text styling**
  - **Validates: Requirements US-5**

- [ ] 17. Implement deleteTextElement function
  - Remove text element from array
  - Clear selection if deleted element was selected
  - Trigger auto-save
  - _Requirements: US-6_

- [ ] 18. Implement selectTextElement function
  - Update selectedTextId state
  - Ensure only one text selected at a time
  - _Requirements: US-5_

- [ ]* 18.1 Write property test for selection state consistency
  - **Property 5: Selection state consistency**
  - **Validates: Requirements US-5**

- [ ] 19. Implement reorderTextElements function
  - Move element from one index to another
  - Update zIndex values based on new order
  - Trigger auto-save
  - _Requirements: US-7_

- [ ]* 19.1 Write property test for layer order consistency
  - **Property 4: Layer order consistency**
  - **Validates: Requirements US-7**

- [ ] 20. Implement duplicateTextElement function
  - Clone text element with new ID
  - Offset position slightly (x+5, y+5)
  - Append " Copy" to name
  - Set as selected text
  - _Requirements: Future enhancement_

- [ ]* 20.1 Write unit tests for FramesContext functions
  - Test addTextElement creates element with correct defaults
  - Test updateTextElement modifies only target element
  - Test deleteTextElement removes element and clears selection
  - Test reorderTextElements updates zIndex correctly
  - Test duplicateTextElement creates copy with offset
  - _Requirements: US-1, US-2, US-5, US-6, US-7_

## Phase 5: Layer Management UI

- [ ] 21. Create TextLayerList component
  - Create components/AppFrames/TextLayerList.tsx
  - Render list of text elements sorted by zIndex (highest first)
  - Show eye icon, name, drag handle for each item
  - _Requirements: US-7, US-8, US-9_

- [ ] 22. Implement layer selection
  - Click item to select text element
  - Highlight selected item
  - Sync with canvas selection
  - _Requirements: US-5, US-7_

- [ ] 23. Implement visibility toggle
  - Click eye icon to toggle visible property
  - Update icon state (eye vs eye-off)
  - Hide text on canvas when visible=false
  - _Requirements: US-8_

- [ ]* 23.1 Write property test for visibility toggle correctness
  - **Property 6: Visibility toggle correctness**
  - **Validates: Requirements US-8**

- [ ] 24. Implement inline rename
  - Click name to enter edit mode
  - Show text input with current name
  - Save on Enter or blur
  - Cancel on Escape
  - _Requirements: US-9_

- [ ] 25. Implement drag-to-reorder
  - Add drag handle icon (IconGripVertical)
  - Implement drag-and-drop using mouse events or @dnd-kit
  - Update zIndex on drop
  - Show visual feedback during drag
  - _Requirements: US-7_

- [ ]* 25.1 Write unit tests for TextLayerList
  - Test reorder updates zIndex correctly
  - Test visibility toggle updates visible property
  - Test rename updates name property
  - Test selection highlights correct item
  - _Requirements: US-7, US-8, US-9_

## Phase 6: Text Tab UI

- [ ] 26. Update TextTab component
  - Remove "Show Caption" toggle
  - Remove "Caption Text" input
  - Add "Add Text" button with IconPlus
  - Add "Delete" button with IconTrash (disabled when no selection)
  - _Requirements: US-1, US-6_

- [ ] 27. Integrate TextLayerList
  - Render TextLayerList component
  - Pass text elements from current screen
  - Wire up selection, reorder, visibility, rename callbacks
  - _Requirements: US-7, US-8, US-9_

- [ ] 28. Update style panel section
  - Show TextStylePanel only when text is selected
  - Display "Select a text element to edit" message when none selected
  - Wire up style changes to updateTextElement
  - _Requirements: US-5_

- [ ] 29. Add layer management buttons
  - Add "Bring to Front" button
  - Add "Send to Back" button
  - Add "Duplicate" button
  - Enable/disable based on selection
  - _Requirements: US-7_

- [ ]* 29.1 Write integration tests for TextTab
  - Test add text creates new element
  - Test delete removes selected element
  - Test style changes apply to selected element only
  - Test layer buttons update zIndex correctly
  - _Requirements: US-1, US-5, US-6, US-7_

## Phase 7: Canvas Integration

- [ ] 30. Update Canvas component to render text elements
  - Get textElements from current screen
  - Filter by visible property
  - Sort by zIndex (lowest first for correct layering)
  - Render TextElement for each
  - _Requirements: US-1, US-8_

- [ ] 31. Implement canvas click to deselect
  - Add onClick handler to canvas background
  - Call selectTextElement(null) when background clicked
  - Prevent deselection when clicking text element
  - _Requirements: US-5_

- [ ] 32. Pass callbacks to TextElement
  - Wire up onUpdate to updateTextElement
  - Wire up onSelect to selectTextElement
  - Wire up onDelete to deleteTextElement
  - Pass isSelected based on selectedTextId
  - _Requirements: US-2, US-3, US-4, US-5, US-6_

- [ ] 33. Add keyboard shortcuts
  - Listen for Delete/Backspace key
  - Delete selected text element
  - Prevent deletion when editing text (check activeElement)
  - _Requirements: US-6_

- [ ]* 33.1 Write integration tests for Canvas
  - Test text elements render in correct z-order
  - Test click background deselects
  - Test keyboard shortcut deletes selected text
  - Test hidden text elements don't render
  - _Requirements: US-5, US-6, US-8_

## Phase 8: Export Integration

- [ ] 34. Update CompositionRenderer to render text elements
  - Get textElements from screen
  - Filter by visible property
  - Sort by zIndex
  - Render each text element with same transforms
  - _Requirements: US-8_

- [ ] 35. Ensure text quality in export
  - Verify text is crisp at 2x resolution
  - Test rotation renders correctly in export
  - Test markdown formatting exports correctly
  - Test text shadows and backgrounds export correctly
  - _Requirements: US-4, US-5_

- [ ] 36. Test export with multiple text elements
  - Create screen with 5+ text elements
  - Export to PNG
  - Verify all visible text appears
  - Verify hidden text doesn't appear
  - Verify layer order is correct
  - _Requirements: US-1, US-7, US-8_

- [ ]* 36.1 Write integration tests for export
  - Test export includes all visible text elements
  - Test export excludes hidden text elements
  - Test export preserves rotation and positioning
  - Test export preserves text styling
  - _Requirements: US-4, US-5, US-8_

## Phase 9: Cleanup & Polish

- [ ] 37. Remove deprecated caption components
  - Delete or deprecate old caption-specific code
  - Remove unused imports
  - Update comments and documentation
  - _Requirements: Migration Strategy_

- [ ] 38. Add delete button to TextElement
  - Show X button in top-right corner when selected
  - Style as circular button with red background
  - Call onDelete when clicked
  - _Requirements: US-6_

- [ ] 39. Improve visual feedback
  - Add smooth transitions for selection states
  - Add hover effects to rotation handle
  - Add loading state if needed
  - Polish tooltip positioning and styling
  - _Requirements: US-3, US-4, US-5_

- [ ] 40. Add error boundaries
  - Wrap TextElement in error boundary
  - Handle rendering errors gracefully
  - Log errors for debugging
  - _Requirements: Error Handling_

- [ ] 41. Performance optimization
  - Add React.memo to TextElement if needed
  - Debounce auto-save to 500ms
  - Use requestAnimationFrame for smooth dragging if needed
  - _Requirements: Performance Considerations_

## Phase 10: Testing & Documentation

- [ ] 42. Run all property-based tests
  - Execute all 7 property tests with 100+ iterations
  - Fix any failures
  - Document test results
  - _Requirements: All properties_

- [ ] 43. Run all unit tests
  - Ensure 100% coverage of new functions
  - Test edge cases and error scenarios
  - _Requirements: All user stories_

- [ ] 44. Run all integration tests
  - Test full user flows
  - Test migration from old caption system
  - Test multi-text scenarios
  - _Requirements: All user stories_

- [ ] 45. Manual testing
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test with various canvas sizes
  - Test with different device frames
  - Test export quality
  - Test performance with 10+ text elements
  - _Requirements: All user stories_

- [ ] 46. Update documentation
  - Update README with new text features
  - Update USAGE_GUIDE with text editing instructions
  - Add screenshots/GIFs of text editing
  - Document keyboard shortcuts
  - _Requirements: All user stories_

- [ ] 47. Checkpoint - Final review
  - Ensure all tests pass
  - Verify no regressions in existing features
  - Check for console errors/warnings
  - Review code for cleanup opportunities
  - Ask user for feedback before marking complete

## Notes

- Tasks marked with `*` are property-based or unit tests
- Each phase builds on the previous phase
- Run tests frequently during development
- Migration should be tested thoroughly to avoid data loss
- Consider feature flag for gradual rollout if needed
