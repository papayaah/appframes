# Implementation Plan

- [x] 1. Install idb library and set up database schema
  - Install idb package via npm (npm install idb)
  - Create lib/PersistenceDB.ts file
  - Define AppFramesDBSchema interface with projects, appState, and mediaFiles stores
  - Implement database initialization with version 2 (with upgrade path from existing version 1)
  - Create projects object store with updatedAt, lastAccessedAt, and name indexes
  - Create appState object store (tracks currentProjectId and UI preferences)
  - Create mediaFiles object store with name and createdAt indexes
  - Remove Dexie dependency
  - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.5, 12.1_

- [ ]* 1.1 Write unit tests for database initialization
  - Test database opens successfully
  - Test object stores are created with correct indexes
  - _Requirements: 7.1, 7.2_

- [x] 2. Implement PersistenceDB class methods
  - Implement init() method to open database
  - Implement createProject(name) method to create new project with default state
  - Implement saveProject(project) method using idb put
  - Implement loadProject(id) method using idb get
  - Implement getAllProjects() method using idb getAll
  - Implement deleteProject(id) method using idb delete
  - Implement renameProject(id, newName) method
  - Implement saveAppState(state) method using idb put
  - Implement loadAppState() method using idb get
  - Add error handling for all database operations
  - Export singleton instance persistenceDB
  - _Requirements: 6.3, 6.4, 6.5, 10.1, 10.2, 10.3_

- [ ]* 2.1 Write property test for screen persistence by canvas size
  - **Property 1: Screen persistence by canvas size**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 2.2 Write property test for screen modification persistence
  - **Property 2: Screen modification persistence**
  - **Validates: Requirements 1.2, 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ]* 2.3 Write property test for screen deletion persistence
  - **Property 3: Screen deletion persistence**
  - **Validates: Requirements 1.3**

- [x] 3. Create usePersistence custom hook
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

- [x] 4. Integrate persistence into FramesContext
  - Import persistenceDB and usePersistence in FramesContext.tsx
  - Add state for currentProjectId, currentProjectName
  - Add state for screensByCanvasSize (Record<string, Screen[]>) and currentCanvasSize (string)
  - Add loadPersistedState() function to load appState and current project on mount
  - Add loadProjectIntoState(project) helper to load project data into React state
  - Add useEffect to call loadPersistedState() on component mount
  - Add saveProjectState() function using debouncedSave
  - Add useEffect watching screensByCanvasSize to trigger saveProjectState
  - Add useEffect watching currentCanvasSize to trigger saveProjectState
  - Add useEffect watching selectedScreenIndices to trigger saveProjectState
  - Add useEffect watching zoom to trigger saveProjectState
  - Add saveAppState() function for UI preferences and currentProjectId
  - Add useEffect watching sidebarTab to trigger saveAppState
  - Handle errors with console logging and fallback to defaults
  - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 10.1, 10.2, 10.3_

- [ ] 4.4 Complete appState persistence + defaults
  - Persist `sidebarPanelOpen` (open/closed)
  - Persist `navWidth` (sidebar width)
  - On load, apply defaults when no saved state exists (Layout tab + panel open)
  - Add validation/sanitization for appState (e.g., clamp navWidth to min/max)
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 4.5 Flush pending writes on reload / tab close (not just unmount)
  - Flush debounced saves on `pagehide` / `visibilitychange` (and/or `beforeunload` as best-effort)
  - Ensure “reload the page” restores latest changes even if React components never unmount cleanly
  - _Requirements: 8.5_

- [ ]* 4.1 Write property test for selection persistence
  - **Property 4: Selection persistence**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]* 4.2 Write property test for zoom persistence
  - **Property 5: Zoom persistence**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ]* 4.3 Write property test for sidebar state persistence
  - **Property 6: Sidebar state persistence**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 5. Implement canvas size switching logic
  - Add switchCanvasSize(newSize: string) method to FramesContext
  - Save current workspace state before switching
  - Update currentCanvasSize to new size
  - Initialize empty screen array for new canvas size if it doesn't exist
  - Reset selection state for new canvas size (select first screen if exists, otherwise clear)
  - Reset selectedFrameIndex to null
  - Add getCurrentScreens() helper that returns screensByCanvasSize[currentCanvasSize]
  - Update all screen operations to use getCurrentScreens()
  - _Requirements: 2.5_

- [ ] 5.3 Preserve per-canvas selection state (aligns with Property 17)
  - Store/restore last selection per canvas size (e.g., `selectedScreenIndicesByCanvasSize` + `primarySelectedIndexByCanvasSize`)
  - When switching canvas sizes, restore that canvas size’s last selection (fallback to first screen / none)
  - Persist this per-canvas selection state inside the project
  - _Requirements: 4.1, 4.4, 2.5, 1.4_

- [ ]* 5.1 Write property test for canvas size isolation
  - **Property 16: Canvas size isolation**
  - **Validates: Requirements 1.1, 2.5**

- [ ]* 5.2 Write property test for canvas size switching preserves state
  - **Property 17: Canvas size switching preserves state**
  - **Validates: Requirements 1.4, 4.1**

- [x] 6. Add project state validation and defaults
  - Implement validateProject() function to check data structure
  - Validate required fields exist (id, name, screensByCanvasSize, currentCanvasSize, selectedScreenIndices, zoom)
  - Validate screensByCanvasSize is an object with string keys and Screen[] values
  - Validate data types are correct
  - Clamp zoom value to valid range (10-400%)
  - Validate selectedScreenIndices are within bounds for current canvas size
  - Return default state if validation fails (empty screensByCanvasSize, default canvas size)
  - _Requirements: 1.5, 4.4, 5.3, 5.4, 10.3_

- [ ]* 6.1 Write property test for default value fallback
  - **Property 13: Default value fallback**
  - **Validates: Requirements 1.5, 3.5, 4.4, 5.3**

- [x] 7. Implement project management methods
  - Add createNewProject(name) method to FramesContext
  - Add switchProject(projectId) method to FramesContext (saves current, loads new)
  - Add deleteProject(projectId) method to FramesContext
  - Add renameProject(newName) method to FramesContext
  - Handle edge cases (deleting current project, no projects exist)
  - Preserve media library across all operations (don't delete mediaFiles)
  - Update appState.currentProjectId when switching projects
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 7.1 Write property test for project deletion completeness
  - **Property 10: Project deletion completeness**
  - **Validates: Requirements 9.2, 9.3**

- [ ]* 7.2 Write property test for media library preservation across projects
  - **Property 11: Media library preservation across projects**
  - **Validates: Requirements 9.4**

- [ ]* 7.3 Write property test for project isolation
  - **Property 18: Project isolation**
  - **Validates: Requirements 1.1**

- [ ]* 7.4 Write property test for project switching preserves state
  - **Property 19: Project switching preserves state**
  - **Validates: Requirements 1.4, 4.1**

- [ ]* 7.5 Write property test for current project persistence
  - **Property 20: Current project persistence**
  - **Validates: Requirements 1.4**

- [x] 8. Add UI for project management in AppFrames
  - Add project dropdown/selector to Header showing current project name
  - Add "New Project" button to create new project
  - Add "Rename Project" option in project menu
  - Add "Delete Project" option in project menu
  - Implement confirmation dialog for delete using Mantine Modal
  - Show warning message about data loss when deleting
  - Show project list with last accessed timestamps
  - Add visual indicator for free tier limit (1 project max for free users)
  - _Requirements: 9.1_

- [x] 9. Hook up canvas size changes to trigger switching
  - Add useEffect in FramesContext watching settings.canvasSize
  - When settings.canvasSize changes, call switchCanvasSize(newSize)
  - Ensure smooth transition between canvas sizes
  - Update screens prop passed to components to use getCurrentScreens()
  - _Requirements: 2.5_

- [x] 10. Implement error handling and user notifications
  - Add error handling for database initialization failures
  - Show Mantine notification when persistence is unavailable
  - Add error handling for save operation failures
  - Implement retry logic (retry once after 1 second)
  - Show notification for quota exceeded errors
  - Suggest clearing workspace when quota exceeded
  - Log all errors to console for debugging
  - Continue operation without crashing on errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10.3 Implement “database corruption detected” recovery flow
  - Detect corruption / open failures consistently (e.g., exceptions on init/read/write)
  - Attempt to delete + recreate the IndexedDB database (or recreate stores) safely
  - Notify user clearly when recovery implies potential local data loss
  - Ensure the app continues in-memory if recovery fails
  - _Requirements: 10.5, 10.2_

- [ ]* 10.1 Write property test for error resilience
  - **Property 12: Error resilience**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ]* 10.2 Write property test for quota handling
  - **Property 14: Quota handling**
  - **Validates: Requirements 10.4**

- [x] 11. Add frame-specific settings persistence
  - Ensure ScreenImage interface includes panX, panY, frameX, frameY
  - Save frame-specific settings when screensByCanvasSize is saved
  - Restore frame-specific settings when workspace is loaded
  - Validate frame settings on load
  - Handle missing frame settings gracefully with defaults
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 11.1 Write property test for frame-specific settings persistence
  - **Property 7: Frame-specific settings persistence**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [x] 12. Optimize persistence performance
  - Implement selective saves (only save changed portions)
  - Add check to skip save if state hasn't changed
  - Use transaction batching for multiple operations
  - Tune debounce delays for different interactions (slider: 500ms, text: 1000ms, selection: 300ms)
  - Add lazy database initialization (init on first access)
  - Implement lazy canvas size array creation (only create when first accessed)
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 12.1 Confirm “immediate save” semantics for discrete actions
  - Ensure discrete events (add/remove screen, project switch) trigger a save immediately (or flush debounce)
  - Keep debouncing for high-frequency interactions (sliders/pan/drag)
  - _Requirements: 1.1, 1.3, 8.1, 8.2_

- [x] 13. Add persistence status indicators
  - Add "Saving..." indicator to UI when save is in progress
  - Add "All changes saved" confirmation when save completes
  - Add error indicator when save fails
  - Use Mantine Badge or Text component for status
  - Position status indicator in Header or bottom corner
  - _Requirements: 1.1, 1.2_

- [x] 14. Update package.json Node.js requirement
  - Verify package.json has "engines": { "node": ">=24.0.0" }
  - Verify .nvmrc specifies Node.js 24
  - Add engine check script if needed
  - Update documentation to mention Node.js 24 requirement
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 15. Add database migration testing
  - Test migration from version 1 to version 2
  - Verify existing mediaFiles data is preserved
  - Verify new object stores are created (projects with proper indexes, appState)
  - Verify default project is created during migration
  - Test upgrade function runs correctly
  - Handle migration errors gracefully
  - _Requirements: 7.3, 7.4_

- [ ]* 15.1 Write property test for database migration safety
  - **Property 15: Database migration safety**
  - **Validates: Requirements 7.3, 7.4**

- [x] 16. Add integration tests for persistence workflow
  - Test complete save and restore workflow
  - Test creating project → add screens → reload → verify project and screens restored
  - Test creating multiple projects → reload → verify all projects exist
  - Test switching projects → reload → verify last opened project is current
  - Test adding screens to canvas size A → reload → verify screens restored for canvas size A
  - Test switching to canvas size B → add screens → reload → verify screens for both sizes restored
  - Test changing canvas size → verify correct screen set displayed
  - Test changing settings → reload → verify settings restored
  - Test selecting screens → reload → verify selection restored
  - Test changing sidebar tab → reload → verify tab restored
  - Test deleting project → verify project removed and media preserved
  - Test canvas size switching → verify screens isolated by canvas size
  - Test project switching → verify screens isolated by project
  - Test switching projects rapidly → verify no data loss
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
