# Implementation Plan

- [ ] 1. Install idb library and set up database schema
  - Install idb package via npm (npm install idb)
  - Create lib/PersistenceDB.ts file
  - Define AppFramesDBSchema interface with workspace, uiState, and mediaFiles stores
  - Implement database initialization with version 2
  - Add migration logic from version 1 to version 2
  - Create workspace object store with updatedAt index
  - Create uiState object store
  - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.5, 12.1_

- [ ]* 1.1 Write unit tests for database initialization
  - Test database opens successfully
  - Test version 2 migration runs
  - Test object stores are created
  - _Requirements: 7.1, 7.2_

- [ ] 2. Implement PersistenceDB class methods
  - Implement init() method to open database
  - Implement saveWorkspace() method using idb put
  - Implement loadWorkspace() method using idb get
  - Implement clearWorkspace() method using idb delete
  - Implement saveUIState() method using idb put
  - Implement loadUIState() method using idb get
  - Add error handling for all database operations
  - Export singleton instance persistenceDB
  - _Requirements: 6.3, 6.4, 6.5, 10.1, 10.2, 10.3_

- [ ]* 2.1 Write property test for screen persistence
  - **Property 1: Screen persistence**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 2.2 Write property test for screen modification persistence
  - **Property 2: Screen modification persistence**
  - **Validates: Requirements 1.2, 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ]* 2.3 Write property test for screen deletion persistence
  - **Property 3: Screen deletion persistence**
  - **Validates: Requirements 1.3**

- [ ] 3. Create usePersistence custom hook
  - Create hooks/usePersistence.ts file
  - Implement debounced save function with configurable delay (default 500ms)
  - Use useRef to store timeout and pending save function
  - Implement useCallback for debouncedSave
  - Add useEffect cleanup to flush pending saves on unmount
  - Add error callback parameter
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 3.1 Write property test for debounce batching
  - **Property 8: Debounce batching**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ]* 3.2 Write property test for flush on unmount
  - **Property 9: Flush on unmount**
  - **Validates: Requirements 8.5**

- [ ] 4. Integrate persistence into FramesContext
  - Import persistenceDB and usePersistence in FramesContext.tsx
  - Add loadPersistedState() function to load workspace and UI state on mount
  - Add useEffect to call loadPersistedState() on component mount
  - Add saveWorkspaceState() function using debouncedSave
  - Add useEffect watching screens array to trigger saveWorkspaceState
  - Add useEffect watching selectedScreenIndices to trigger saveWorkspaceState
  - Add useEffect watching zoom to trigger saveWorkspaceState
  - Add saveUIState() function for sidebar preferences
  - Add useEffect watching sidebarTab to trigger saveUIState
  - Handle errors with console logging and fallback to defaults
  - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 10.1, 10.2, 10.3_

- [ ]* 4.1 Write property test for selection persistence
  - **Property 4: Selection persistence**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]* 4.2 Write property test for zoom persistence
  - **Property 5: Zoom persistence**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ]* 4.3 Write property test for sidebar state persistence
  - **Property 6: Sidebar state persistence**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ] 5. Add workspace state validation and defaults
  - Implement validateWorkspaceState() function to check data structure
  - Validate required fields exist (screens, selectedScreenIndices, zoom)
  - Validate data types are correct
  - Clamp zoom value to valid range (10-400%)
  - Validate selectedScreenIndices are within bounds
  - Return default state if validation fails
  - _Requirements: 1.5, 4.4, 5.3, 5.4, 10.3_

- [ ]* 5.1 Write property test for default value fallback
  - **Property 13: Default value fallback**
  - **Validates: Requirements 1.5, 3.5, 4.4, 5.3**

- [ ] 6. Implement clearWorkspace functionality
  - Add clearWorkspace() method to FramesContext
  - Call persistenceDB.clearWorkspace() to delete from IndexedDB
  - Reset screens array to empty
  - Reset selectedScreenIndices to empty
  - Reset zoom to 100
  - Reset other state to defaults
  - Call addScreen() to create one empty screen
  - Preserve media library (don't delete mediaFiles)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 6.1 Write property test for workspace clear completeness
  - **Property 10: Workspace clear completeness**
  - **Validates: Requirements 9.2, 9.3**

- [ ]* 6.2 Write property test for media library preservation
  - **Property 11: Media library preservation**
  - **Validates: Requirements 9.4**

- [ ] 7. Add UI for workspace management in AppFrames
  - Add "Clear Workspace" button to Header or settings menu
  - Implement confirmation dialog using Mantine Modal
  - Show warning message about data loss
  - Call FramesContext.clearWorkspace() on confirmation
  - Show success notification after clearing
  - _Requirements: 9.1_

- [ ] 8. Implement error handling and user notifications
  - Add error handling for database initialization failures
  - Show Mantine notification when persistence is unavailable
  - Add error handling for save operation failures
  - Implement retry logic (retry once after 1 second)
  - Show notification for quota exceeded errors
  - Suggest clearing workspace when quota exceeded
  - Log all errors to console for debugging
  - Continue operation without crashing on errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 8.1 Write property test for error resilience
  - **Property 12: Error resilience**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ]* 8.2 Write property test for quota handling
  - **Property 14: Quota handling**
  - **Validates: Requirements 10.4**

- [ ] 9. Add frame-specific settings persistence
  - Ensure ScreenImage interface includes panX, panY, frameX, frameY
  - Save frame-specific settings when screens array is saved
  - Restore frame-specific settings when workspace is loaded
  - Validate frame settings on load
  - Handle missing frame settings gracefully with defaults
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 9.1 Write property test for frame-specific settings persistence
  - **Property 7: Frame-specific settings persistence**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ] 10. Optimize persistence performance
  - Implement selective saves (only save changed portions)
  - Add check to skip save if state hasn't changed
  - Use transaction batching for multiple operations
  - Tune debounce delays for different interactions (slider: 500ms, text: 1000ms, selection: 300ms)
  - Add lazy database initialization (init on first access)
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11. Add persistence status indicators
  - Add "Saving..." indicator to UI when save is in progress
  - Add "All changes saved" confirmation when save completes
  - Add error indicator when save fails
  - Use Mantine Badge or Text component for status
  - Position status indicator in Header or bottom corner
  - _Requirements: 1.1, 1.2_

- [ ] 12. Update package.json Node.js requirement
  - Verify package.json has "engines": { "node": ">=24.0.0" }
  - Verify .nvmrc specifies Node.js 24
  - Add engine check script if needed
  - Update documentation to mention Node.js 24 requirement
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 13. Add database migration testing
  - Test migration from version 1 to version 2
  - Verify existing mediaFiles data is preserved
  - Verify new object stores are created
  - Test upgrade function runs correctly
  - Handle migration errors gracefully
  - _Requirements: 7.3, 7.4_

- [ ]* 13.1 Write property test for database migration safety
  - **Property 15: Database migration safety**
  - **Validates: Requirements 7.3, 7.4**

- [ ] 14. Add integration tests for persistence workflow
  - Test complete save and restore workflow
  - Test adding screens → reload → verify screens restored
  - Test changing settings → reload → verify settings restored
  - Test selecting screens → reload → verify selection restored
  - Test changing sidebar tab → reload → verify tab restored
  - Test clear workspace → verify all data cleared except media
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
