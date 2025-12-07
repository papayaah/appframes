# Implementation Plan

- [ ] 1. Set up infrastructure and dependencies
  - [ ] 1.1 Install required packages
    - Install @neondatabase/serverless for Neon database access
    - Install @vercel/blob for Vercel Storage
    - Install @vercel/edge-config for Edge Config
    - Install authentication library (e.g., @auth/core or custom)
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 1.2 Configure environment variables
    - Add DATABASE_URL for Neon connection
    - Add BLOB_READ_WRITE_TOKEN for Vercel Storage
    - Add EDGE_CONFIG for Edge Config connection
    - Add AUTH_SECRET for authentication
    - _Requirements: All_

  - [ ] 1.3 Set up Neon database schema
    - Create workspaces table with user_id, data (JSONB), version, timestamps
    - Create media_files table with user_id, storage_url, metadata
    - Add indexes on user_id and updated_at
    - Create migration scripts
    - _Requirements: 1.1, 2.1, 7.1_

  - [ ] 1.4 Configure Vercel Storage
    - Set up storage bucket
    - Configure access permissions
    - Set up CORS if needed
    - _Requirements: 2.1, 2.2_

  - [ ] 1.5 Configure Vercel Edge Config
    - Set up Edge Config instance
    - Configure access tokens
    - Test read/write operations
    - _Requirements: 3.1, 3.2_

- [ ]* 1.6 Write unit tests for infrastructure setup
  - Test database connection
  - Test storage upload/download
  - Test Edge Config read/write
  - _Requirements: All_

- [ ] 2. Implement StorageAdapter interface and local adapter
  - [ ] 2.1 Create StorageAdapter interface
    - Define interface with workspace, media, preferences, and sync methods
    - Add TypeScript types for all operations
    - Document interface contract
    - _Requirements: 7.1, 11.1_

  - [ ] 2.2 Implement LocalStorageAdapter
    - Implement workspace methods using existing PersistenceDB
    - Implement media methods using existing OPFSManager and db
    - Implement preferences methods using existing PersistenceDB
    - Implement sync methods (no-op for local)
    - _Requirements: 9.1, 11.1_

  - [ ] 2.3 Refactor existing storage code to use LocalStorageAdapter
    - Update FramesContext to use adapter instead of direct calls
    - Update AppFrames to use adapter for media uploads
    - Ensure backward compatibility
    - _Requirements: 7.1, 9.1_

- [ ]* 2.4 Write property test for local storage adapter
  - **Property 4: Free user local-only storage**
  - **Validates: Requirements 9.1**

- [ ]* 2.5 Write unit tests for LocalStorageAdapter
  - Test all interface methods
  - Test error handling
  - Test compatibility with existing code
  - _Requirements: 11.1_

- [ ] 3. Implement CloudStorageAdapter
  - [ ] 3.1 Create CloudStorageAdapter class
    - Implement StorageAdapter interface
    - Add API client methods for Neon, Vercel Storage, Edge Config
    - Add authentication handling
    - _Requirements: 1.1, 2.1, 3.1, 5.1_

  - [ ] 3.2 Implement workspace cloud operations
    - Implement saveWorkspace() calling /api/workspace PUT
    - Implement loadWorkspace() calling /api/workspace GET
    - Implement clearWorkspace() calling /api/workspace DELETE
    - Handle authentication and errors
    - _Requirements: 1.1, 1.2, 1.3, 5.1_

  - [ ] 3.3 Implement media cloud operations
    - Implement saveMediaFile() uploading to Vercel Storage
    - Implement getMediaFile() downloading from Vercel Storage
    - Implement deleteMediaFile() removing from Vercel Storage
    - Implement listMediaFiles() querying Neon database
    - Handle authentication and errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1_

  - [ ] 3.4 Implement preferences cloud operations
    - Implement savePreferences() writing to Edge Config
    - Implement loadPreferences() reading from Edge Config
    - Handle authentication and errors
    - _Requirements: 3.1, 3.2, 3.3, 5.1_

  - [ ] 3.5 Implement sync operations
    - Implement sync() method for conflict detection
    - Implement getSyncStatus() for status tracking
    - Add conflict resolution logic (last-write-wins)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 3.6 Write property test for premium workspace persistence
  - **Property 1: Premium workspace persistence**
  - **Validates: Requirements 1.1, 1.3**

- [ ]* 3.7 Write property test for premium media file persistence
  - **Property 2: Premium media file persistence**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 3.8 Write property test for premium preferences persistence
  - **Property 3: Premium preferences persistence**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 3.9 Write property test for authentication requirement
  - **Property 7: Authentication requirement**
  - **Validates: Requirements 5.1, 5.2**

- [ ]* 3.10 Write unit tests for CloudStorageAdapter
  - Test all interface methods
  - Test authentication handling
  - Test error scenarios
  - Mock API responses
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [ ] 4. Create API routes for cloud storage
  - [ ] 4.1 Create workspace API route
    - Create app/api/workspace/route.ts
    - Implement GET handler (load workspace from Neon)
    - Implement PUT handler (save workspace to Neon)
    - Implement DELETE handler (clear workspace)
    - Add authentication middleware
    - Add error handling
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

  - [ ] 4.2 Create media upload API route
    - Create app/api/media/upload/route.ts
    - Handle file upload to Vercel Storage
    - Create thumbnail and extract dimensions
    - Save metadata to Neon database
    - Return MediaFile object
    - Add authentication and file validation
    - _Requirements: 2.1, 2.2, 2.3, 5.1_

  - [ ] 4.3 Create media download API route
    - Create app/api/media/[id]/route.ts
    - Implement GET handler (download from Vercel Storage)
    - Implement DELETE handler (delete from Vercel Storage and Neon)
    - Add authentication and authorization checks
    - _Requirements: 2.4, 2.5, 5.1_

  - [ ] 4.4 Create media list API route
    - Create app/api/media/route.ts
    - Implement GET handler (list user's media files from Neon)
    - Add pagination support
    - Add authentication
    - _Requirements: 2.4, 5.1_

  - [ ] 4.5 Create preferences API route
    - Create app/api/preferences/route.ts
    - Implement GET handler (read from Edge Config)
    - Implement PUT handler (write to Edge Config)
    - Add authentication
    - _Requirements: 3.1, 3.2, 3.3, 5.1_

  - [ ] 4.6 Create sync API route
    - Create app/api/sync/route.ts
    - Implement POST handler (detect and resolve conflicts)
    - Compare local and cloud versions
    - Return sync result with conflicts
    - Add authentication
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_

- [ ]* 4.7 Write unit tests for API routes
  - Test authentication requirements
  - Test CRUD operations
  - Test error handling
  - Test authorization (user can only access own data)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5. Implement StorageManager and adapter selection
  - [ ] 5.1 Create StorageManager class
    - Implement getAdapter() method selecting based on subscription
    - Implement getHybridAdapter() for premium users
    - Cache adapter instances
    - _Requirements: 9.1, 11.1_

  - [ ] 5.2 Implement HybridStorageAdapter
    - Combine cloud and local adapters
    - Save to both cloud and local
    - Load from cloud first, fallback to local
    - Handle offline scenarios
    - _Requirements: 4.1, 4.2, 1.5, 2.6_

  - [ ] 5.3 Integrate StorageManager into FramesContext
    - Replace direct storage calls with StorageManager
    - Use getHybridAdapter() for premium users
    - Use getAdapter() for free users
    - Maintain backward compatibility
    - _Requirements: 7.1, 9.1, 11.1_

- [ ]* 5.4 Write property test for hybrid storage fallback
  - **Property 5: Hybrid storage fallback**
  - **Validates: Requirements 1.5, 2.6**

- [ ]* 5.5 Write property test for storage adapter abstraction
  - **Property 8: Storage adapter abstraction**
  - **Validates: Requirements 7.1, 11.1**

- [ ]* 5.6 Write unit tests for StorageManager
  - Test adapter selection logic
  - Test hybrid adapter behavior
  - Test fallback scenarios
  - _Requirements: 9.1, 11.1_

- [ ] 6. Implement authentication system
  - [ ] 6.1 Set up authentication provider
    - Choose authentication solution (e.g., NextAuth.js, Clerk, custom)
    - Configure OAuth providers or magic links
    - Set up session management
    - _Requirements: 5.1, 5.2_

  - [ ] 6.2 Create auth utilities
    - Create getUserId() function
    - Create isPremium() function
    - Create getAuthToken() function
    - Add middleware for API routes
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 6.3 Add authentication UI
    - Create login/signup components
    - Add authentication state to app
    - Add premium subscription check UI
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 6.4 Integrate authentication with storage
    - Add auth checks to all cloud storage operations
    - Add user ID to all data operations
    - Handle authentication errors gracefully
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.5 Write unit tests for authentication
  - Test getUserId() and isPremium()
  - Test authentication middleware
  - Test error handling
  - _Requirements: 5.1, 5.2_

- [ ] 7. Implement sync functionality
  - [ ] 7.1 Create SyncManager component
    - Track sync status (syncing, synced, error, offline)
    - Manage sync queue for offline changes
    - Handle conflict resolution
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1_

  - [ ] 7.2 Implement offline change tracking
    - Track changes made while offline
    - Queue changes for sync when online
    - Store queue in IndexedDB
    - _Requirements: 4.1, 4.2_

  - [ ] 7.3 Implement conflict detection
    - Compare local and cloud versions
    - Detect conflicts based on version numbers
    - Identify conflict type (workspace, media, preferences)
    - _Requirements: 4.3_

  - [ ] 7.4 Implement conflict resolution
    - Implement last-write-wins strategy
    - Add user prompt for conflict resolution (optional)
    - Merge changes when possible
    - _Requirements: 4.3, 4.4_

  - [ ] 7.5 Add sync status UI
    - Create sync status indicator component
    - Show "Syncing...", "Synced", "Error", "Offline" states
    - Add retry button for failed syncs
    - Show last synced timestamp
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.6 Write property test for sync conflict resolution
  - **Property 6: Sync conflict resolution**
  - **Validates: Requirements 4.3**

- [ ]* 7.7 Write unit tests for sync functionality
  - Test offline change tracking
  - Test conflict detection
  - Test conflict resolution
  - Test sync status updates
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Add premium upgrade flow
  - [ ] 8.1 Create subscription check component
    - Check if user has premium subscription
    - Show upgrade prompt for free users
    - Handle subscription status changes
    - _Requirements: 9.1, 9.2_

  - [ ] 8.2 Implement data migration on upgrade
    - Migrate local workspace to cloud on upgrade
    - Migrate local media files to Vercel Storage
    - Migrate local preferences to Edge Config
    - Show migration progress
    - _Requirements: 9.2_

  - [ ] 8.3 Implement downgrade handling
    - Preserve local data when downgrading
    - Stop cloud sync on downgrade
    - Show message about local-only storage
    - _Requirements: 9.3_

- [ ]* 8.4 Write unit tests for upgrade/downgrade flow
  - Test data migration
  - Test subscription status changes
  - Test local data preservation
  - _Requirements: 9.2, 9.3_

- [ ] 9. Add storage usage display
  - [ ] 9.1 Create storage usage API route
    - Create app/api/storage/usage/route.ts
    - Calculate workspace size from Neon
    - Count media files and total size from Neon
    - Calculate preferences size from Edge Config
    - Return usage breakdown
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 9.2 Create storage usage UI component
    - Display workspace size
    - Display media files count and total size
    - Display preferences size
    - Show usage percentage
    - Add cleanup options
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 9.3 Add storage limit warnings
    - Check usage against limits
    - Show warning when approaching limit
    - Prevent uploads when limit reached
    - Suggest cleanup options
    - _Requirements: 12.2, 12.3_

- [ ]* 9.4 Write unit tests for storage usage
  - Test usage calculation
  - Test limit warnings
  - Test cleanup operations
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 10. Add error handling and user notifications
  - [ ] 10.1 Implement error handling for cloud operations
    - Catch network errors and fallback to local
    - Catch authentication errors and prompt re-auth
    - Catch quota errors and show warnings
    - Log errors for debugging
    - _Requirements: 1.5, 2.6, 5.4, 5.5_

  - [ ] 10.2 Add user notifications
    - Show success notifications for sync completion
    - Show error notifications for failures
    - Show offline mode notifications
    - Show quota warning notifications
    - Use Mantine notifications
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 10.3 Implement retry logic
    - Retry failed cloud operations
    - Exponential backoff for retries
    - Maximum retry attempts
    - Show retry status to user
    - _Requirements: 6.4, 6.5_

- [ ]* 10.4 Write unit tests for error handling
  - Test network error fallback
  - Test authentication error handling
  - Test quota error handling
  - Test retry logic
  - _Requirements: 1.5, 2.6, 5.4, 5.5_

- [ ] 11. Optimize performance
  - [ ] 11.1 Implement caching strategy
    - Cache workspace data in local storage
    - Cache media thumbnails
    - Use Edge Config for fast preference access
    - Implement cache invalidation
    - _Requirements: 10.1, 10.2_

  - [ ] 11.2 Optimize API calls
    - Batch multiple operations when possible
    - Use pagination for large datasets
    - Compress JSON payloads
    - Use efficient image formats
    - _Requirements: 10.3, 10.4_

  - [ ] 11.3 Implement lazy loading
    - Lazy-load media files on demand
    - Load workspace data incrementally
    - Use virtual scrolling for large lists
    - _Requirements: 10.2, 10.4_

- [ ]* 11.4 Write performance tests
  - Test API response times
  - Test cache hit rates
  - Test large dataset handling
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 12. Add monitoring and analytics
  - [ ] 12.1 Add error tracking
    - Track cloud storage errors
    - Track sync failures
    - Track authentication issues
    - Use error tracking service (e.g., Sentry)
    - _Requirements: All_

  - [ ] 12.2 Add usage analytics
    - Track storage usage trends
    - Track sync frequency
    - Track feature usage
    - _Requirements: 12.1_

  - [ ] 12.3 Add performance monitoring
    - Monitor API response times
    - Monitor sync duration
    - Monitor error rates
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
