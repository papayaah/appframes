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

- [ ] 16. Set up cloud storage infrastructure (Premium)
  - [ ] 16.1 Install required packages
    - Install @neondatabase/serverless for Neon database access
    - Install @vercel/blob for Vercel Storage
    - Install @vercel/edge-config for Edge Config
    - Install authentication library (e.g., @auth/core or custom)
    - _Requirements: 13.1, 14.1, 15.1_

  - [ ] 16.2 Configure environment variables
    - Add DATABASE_URL for Neon connection
    - Add BLOB_READ_WRITE_TOKEN for Vercel Storage
    - Add EDGE_CONFIG for Edge Config connection
    - Add AUTH_SECRET for authentication
    - _Requirements: All premium requirements_

  - [ ] 16.3 Set up Neon database schema
    - Create workspaces table with user_id, data (JSONB), version, timestamps
    - Create media_files table with user_id, storage_url, metadata
    - Add indexes on user_id and updated_at
    - Create migration scripts
    - _Requirements: 13.1, 14.1, 19.1_

  - [ ] 16.4 Configure Vercel Storage
    - Set up storage bucket
    - Configure access permissions
    - Set up CORS if needed
    - _Requirements: 14.1, 14.2_

  - [ ] 16.5 Configure Vercel Edge Config
    - Set up Edge Config instance
    - Configure access tokens
    - Test read/write operations
    - _Requirements: 15.1, 15.2_

- [ ]* 16.6 Write unit tests for infrastructure setup
  - Test database connection
  - Test storage upload/download
  - Test Edge Config read/write
  - _Requirements: All premium requirements_

- [ ] 17. Implement StorageAdapter interface and adapters (Premium)
  - [ ] 17.1 Create StorageAdapter interface
    - Define interface with workspace, media, preferences, and sync methods
    - Add TypeScript types for all operations
    - Document interface contract
    - _Requirements: 19.1, 22.1_

  - [ ] 17.2 Refactor LocalStorageAdapter to implement StorageAdapter
    - Refactor existing PersistenceDB code to use StorageAdapter interface
    - Implement workspace methods using existing PersistenceDB
    - Implement media methods using existing OPFSManager and db
    - Implement preferences methods using existing PersistenceDB
    - Implement sync methods (no-op for local)
    - _Requirements: 20.1, 22.1_

  - [ ] 17.3 Implement CloudStorageAdapter
    - Implement StorageAdapter interface
    - Add API client methods for Neon, Vercel Storage, Edge Config
    - Add authentication handling
    - Implement all interface methods
    - _Requirements: 13.1, 14.1, 15.1, 17.1_

  - [ ] 17.4 Implement HybridStorageAdapter
    - Combine cloud and local adapters
    - Save to both cloud and local
    - Load from cloud first, fallback to local
    - Handle offline scenarios
    - _Requirements: 16.1, 16.2, 13.5, 14.6_

- [ ]* 17.5 Write property test for premium workspace persistence
  - **Property 16: Premium workspace persistence**
  - **Validates: Requirements 13.1, 13.3**

- [ ]* 17.6 Write property test for premium media file persistence
  - **Property 17: Premium media file persistence**
  - **Validates: Requirements 14.1, 14.2, 14.3**

- [ ]* 17.7 Write property test for premium preferences persistence
  - **Property 18: Premium preferences persistence**
  - **Validates: Requirements 15.1, 15.3**

- [ ]* 17.8 Write property test for free user local-only storage
  - **Property 19: Free user local-only storage**
  - **Validates: Requirements 20.1**

- [ ]* 17.9 Write property test for hybrid storage fallback
  - **Property 20: Hybrid storage fallback**
  - **Validates: Requirements 13.5, 14.6**

- [ ]* 17.10 Write property test for storage adapter abstraction
  - **Property 21: Storage adapter abstraction**
  - **Validates: Requirements 19.1, 22.1**

- [ ]* 17.11 Write unit tests for storage adapters
  - Test all interface methods
  - Test authentication handling
  - Test error scenarios
  - Mock API responses
  - _Requirements: 13.1, 14.1, 15.1, 17.1_

- [ ] 18. Create API routes for cloud storage (Premium)
  - [ ] 18.1 Create workspace API route
    - Create app/api/workspace/route.ts
    - Implement GET handler (load workspace from Neon)
    - Implement PUT handler (save workspace to Neon)
    - Implement DELETE handler (clear workspace)
    - Add authentication middleware
    - Add error handling
    - _Requirements: 13.1, 13.2, 13.3, 17.1, 17.2_

  - [ ] 18.2 Create media upload API route
    - Create app/api/media/upload/route.ts
    - Handle file upload to Vercel Storage
    - Create thumbnail and extract dimensions
    - Save metadata to Neon database
    - Return MediaFile object
    - Add authentication and file validation
    - _Requirements: 14.1, 14.2, 14.3, 17.1_

  - [ ] 18.3 Create media download API route
    - Create app/api/media/[id]/route.ts
    - Implement GET handler (download from Vercel Storage)
    - Implement DELETE handler (delete from Vercel Storage and Neon)
    - Add authentication and authorization checks
    - _Requirements: 14.4, 14.5, 17.1_

  - [ ] 18.4 Create media list API route
    - Create app/api/media/route.ts
    - Implement GET handler (list user's media files from Neon)
    - Add pagination support
    - Add authentication
    - _Requirements: 14.4, 17.1_

  - [ ] 18.5 Create preferences API route
    - Create app/api/preferences/route.ts
    - Implement GET handler (read from Edge Config)
    - Implement PUT handler (write to Edge Config)
    - Add authentication
    - _Requirements: 15.1, 15.2, 15.3, 17.1_

  - [ ] 18.6 Create sync API route
    - Create app/api/sync/route.ts
    - Implement POST handler (detect and resolve conflicts)
    - Compare local and cloud versions
    - Return sync result with conflicts
    - Add authentication
    - _Requirements: 16.1, 16.2, 16.3, 17.1_

- [ ]* 18.7 Write unit tests for API routes
  - Test authentication requirements
  - Test CRUD operations
  - Test error handling
  - Test authorization (user can only access own data)
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 19. Implement StorageManager and adapter selection (Premium)
  - [ ] 19.1 Create StorageManager class
    - Implement getAdapter() method selecting based on subscription
    - Implement getHybridAdapter() for premium users
    - Cache adapter instances
    - _Requirements: 20.1, 22.1_

  - [ ] 19.2 Integrate StorageManager into FramesContext
    - Replace direct storage calls with StorageManager
    - Use getHybridAdapter() for premium users
    - Use getAdapter() for free users
    - Maintain backward compatibility
    - _Requirements: 19.1, 20.1, 22.1_

- [ ]* 19.3 Write unit tests for StorageManager
  - Test adapter selection logic
  - Test hybrid adapter behavior
  - Test fallback scenarios
  - _Requirements: 20.1, 22.1_

- [ ] 20. Implement authentication system (Premium)
  - [ ] 20.1 Set up authentication provider
    - Choose authentication solution (e.g., NextAuth.js, Clerk, custom)
    - Configure OAuth providers or magic links
    - Set up session management
    - _Requirements: 17.1, 17.2_

  - [ ] 20.2 Create auth utilities
    - Create getUserId() function
    - Create isPremium() function
    - Create getAuthToken() function
    - Add middleware for API routes
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ] 20.3 Add authentication UI
    - Create login/signup components
    - Add authentication state to app
    - Add premium subscription check UI
    - _Requirements: 17.1, 17.2, 17.4_

  - [ ] 20.4 Integrate authentication with storage
    - Add auth checks to all cloud storage operations
    - Add user ID to all data operations
    - Handle authentication errors gracefully
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 20.5 Write unit tests for authentication
  - Test getUserId() and isPremium()
  - Test authentication middleware
  - Test error handling
  - _Requirements: 17.1, 17.2_

- [ ] 21. Implement sync functionality (Premium)
  - [ ] 21.1 Create SyncManager component
    - Track sync status (syncing, synced, error, offline)
    - Manage sync queue for offline changes
    - Handle conflict resolution
    - _Requirements: 16.1, 16.2, 16.3, 18.1_

  - [ ] 21.2 Implement offline change tracking
    - Track changes made while offline
    - Queue changes for sync when online
    - Store queue in IndexedDB
    - _Requirements: 16.1, 16.2_

  - [ ] 21.3 Implement conflict detection
    - Compare local and cloud versions
    - Detect conflicts based on version numbers
    - Identify conflict type (workspace, media, preferences)
    - _Requirements: 16.3_

  - [ ] 21.4 Implement conflict resolution
    - Implement last-write-wins strategy
    - Add user prompt for conflict resolution (optional)
    - Merge changes when possible
    - _Requirements: 16.3, 16.4_

  - [ ] 21.5 Add sync status UI
    - Create sync status indicator component
    - Show "Syncing...", "Synced", "Error", "Offline" states
    - Add retry button for failed syncs
    - Show last synced timestamp
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ]* 21.6 Write property test for sync conflict resolution
  - **Property 22: Sync conflict resolution**
  - **Validates: Requirements 16.3**

- [ ]* 21.7 Write unit tests for sync functionality
  - Test offline change tracking
  - Test conflict detection
  - Test conflict resolution
  - Test sync status updates
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 22. Add premium upgrade flow (Premium)
  - [ ] 22.1 Create subscription check component
    - Check if user has premium subscription
    - Show upgrade prompt for free users
    - Handle subscription status changes
    - _Requirements: 20.1, 20.2_

  - [ ] 22.2 Implement data migration on upgrade
    - Migrate local workspace to cloud on upgrade
    - Migrate local media files to Vercel Storage
    - Migrate local preferences to Edge Config
    - Show migration progress
    - _Requirements: 20.2_

  - [ ] 22.3 Implement downgrade handling
    - Preserve local data when downgrading
    - Stop cloud sync on downgrade
    - Show message about local-only storage
    - _Requirements: 20.3_

- [ ]* 22.4 Write unit tests for upgrade/downgrade flow
  - Test data migration
  - Test subscription status changes
  - Test local data preservation
  - _Requirements: 20.2, 20.3_

- [ ] 23. Add storage usage display (Premium)
  - [ ] 23.1 Create storage usage API route
    - Create app/api/storage/usage/route.ts
    - Calculate workspace size from Neon
    - Count media files and total size from Neon
    - Calculate preferences size from Edge Config
    - Return usage breakdown
    - _Requirements: 23.1, 23.2, 23.4_

  - [ ] 23.2 Create storage usage UI component
    - Display workspace size
    - Display media files count and total size
    - Display preferences size
    - Show usage percentage
    - Add cleanup options
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

  - [ ] 23.3 Add storage limit warnings
    - Check usage against limits
    - Show warning when approaching limit
    - Prevent uploads when limit reached
    - Suggest cleanup options
    - _Requirements: 23.2, 23.3_

- [ ]* 23.4 Write unit tests for storage usage
  - Test usage calculation
  - Test limit warnings
  - Test cleanup operations
  - _Requirements: 23.1, 23.2, 23.3_

- [ ] 24. Add error handling for cloud operations (Premium)
  - [ ] 24.1 Implement error handling for cloud operations
    - Catch network errors and fallback to local
    - Catch authentication errors and prompt re-auth
    - Catch quota errors and show warnings
    - Log errors for debugging
    - _Requirements: 13.5, 14.6, 17.4, 17.5_

  - [ ] 24.2 Add user notifications for cloud operations
    - Show success notifications for sync completion
    - Show error notifications for failures
    - Show offline mode notifications
    - Show quota warning notifications
    - Use Mantine notifications
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 24.3 Implement retry logic
    - Retry failed cloud operations
    - Exponential backoff for retries
    - Maximum retry attempts
    - Show retry status to user
    - _Requirements: 18.4, 18.5_

- [ ]* 24.4 Write unit tests for error handling
  - Test network error fallback
  - Test authentication error handling
  - Test quota error handling
  - Test retry logic
  - _Requirements: 13.5, 14.6, 17.4, 17.5_

- [ ] 25. Optimize cloud storage performance (Premium)
  - [ ] 25.1 Implement caching strategy
    - Cache workspace data in local storage
    - Cache media thumbnails
    - Use Edge Config for fast preference access
    - Implement cache invalidation
    - _Requirements: 21.1, 21.2_

  - [ ] 25.2 Optimize API calls
    - Batch multiple operations when possible
    - Use pagination for large datasets
    - Compress JSON payloads
    - Use efficient image formats
    - _Requirements: 21.3, 21.4_

  - [ ] 25.3 Implement lazy loading
    - Lazy-load media files on demand
    - Load workspace data incrementally
    - Use virtual scrolling for large lists
    - _Requirements: 21.2, 21.4_

- [ ]* 25.4 Write performance tests
  - Test API response times
  - Test cache hit rates
  - Test large dataset handling
  - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [ ] 26. Final checkpoint - Ensure all tests pass (Local + Premium)
  - Ensure all tests pass, ask the user if questions arise.
