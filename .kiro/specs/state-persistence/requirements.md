# Requirements Document

## Introduction

This feature implements comprehensive state persistence for AppFrames using IndexedDB for local storage, with optional cloud storage for premium users. The system allows users to maintain their work across browser sessions locally, and premium users can access their data from any device via cloud storage. Currently, all application state (screens, settings, UI preferences) is lost when the page reloads. This enhancement will persist screens, canvas settings, sidebar state, and user preferences using IndexedDB via the idb library for optimal performance. Premium users will have their data synced to cloud storage (Neon database for workspace data, Vercel Storage for media files, and Vercel Edge Config for app preferences).

## Glossary

- **IndexedDB**: Browser-based database for storing structured data with high performance
- **idb**: A lightweight wrapper library around IndexedDB that provides a Promise-based API
- **AppFrames Database**: The IndexedDB database storing application state and media metadata
- **Screen**: A canvas configuration containing images, device frames, and settings
- **Canvas Settings**: Configuration for a screen including composition, device frame, colors, and positioning
- **Workspace**: The collection of all screens and global settings representing the user's current project
- **Sidebar State**: The currently selected sidebar tab and panel open/closed state
- **OPFS**: Origin Private File System where actual image files are stored locally
- **Media Library**: The collection of uploaded images with metadata stored in IndexedDB
- **Premium User**: A user with an active premium subscription that enables cloud storage features
- **Neon Database**: Serverless PostgreSQL database for storing workspace data (screens, settings, metadata) for premium users
- **Vercel Storage**: Object storage service for storing media files (images, thumbnails) for premium users
- **Vercel Edge Config**: Edge-optimized key-value store for app preferences and user settings for premium users
- **Local Storage**: Browser-based storage (IndexedDB for workspace, OPFS for files) used for free users
- **Cloud Storage**: Server-based storage (Neon for workspace, Vercel Storage for files, Edge Config for preferences) used for premium users
- **Hybrid Mode**: Premium users maintain both local and cloud storage for offline access and performance
- **Sync**: The process of uploading local changes to cloud storage or downloading cloud changes to local storage

## Requirements

### Requirement 1

**User Story:** As a user, I want my screens and their configurations to persist across page reloads, so that I don't lose my work when I close the browser.

#### Acceptance Criteria

1. WHEN a user adds a screen THEN the system SHALL save the screen to IndexedDB immediately
2. WHEN a user modifies a screen's settings THEN the system SHALL update the screen in IndexedDB
3. WHEN a user removes a screen THEN the system SHALL delete the screen from IndexedDB
4. WHEN the application loads THEN the system SHALL restore all screens from IndexedDB
5. WHEN IndexedDB is empty on first load THEN the system SHALL initialize with default empty state

### Requirement 2

**User Story:** As a user, I want my canvas settings to persist for each screen, so that my device frame selections and customizations are preserved.

#### Acceptance Criteria

1. WHEN a user changes the device frame type THEN the system SHALL save the updated settings to IndexedDB
2. WHEN a user adjusts composition layout THEN the system SHALL persist the composition setting
3. WHEN a user modifies background color THEN the system SHALL save the color to IndexedDB
4. WHEN a user adjusts screen scale or pan values THEN the system SHALL persist these values per screen
5. WHEN a user changes canvas size THEN the system SHALL save the canvas size setting

### Requirement 3

**User Story:** As a user, I want my sidebar tab selection to persist, so that I return to the same view when I reload the page.

#### Acceptance Criteria

1. WHEN a user selects a sidebar tab THEN the system SHALL save the tab selection to IndexedDB
2. WHEN the application loads THEN the system SHALL restore the last selected sidebar tab
3. WHEN a user toggles the sidebar panel open/closed THEN the system SHALL save the panel state
4. WHEN the application loads THEN the system SHALL restore the sidebar panel state
5. WHEN no saved state exists THEN the system SHALL default to the Layout tab with panel open

### Requirement 4

**User Story:** As a user, I want my screen selection to persist, so that I continue working on the same screen after reload.

#### Acceptance Criteria

1. WHEN a user selects a screen THEN the system SHALL save the selected screen index to IndexedDB
2. WHEN a user selects multiple screens THEN the system SHALL save all selected indices
3. WHEN the application loads THEN the system SHALL restore the selected screen indices
4. WHEN the saved screen index is out of bounds THEN the system SHALL default to selecting the first screen
5. WHEN no screens exist THEN the system SHALL clear the selection state

### Requirement 5

**User Story:** As a user, I want my zoom level to persist, so that my preferred canvas view is maintained across sessions.

#### Acceptance Criteria

1. WHEN a user adjusts the zoom level THEN the system SHALL save the zoom value to IndexedDB
2. WHEN the application loads THEN the system SHALL restore the last zoom level
3. WHEN no saved zoom exists THEN the system SHALL default to 100% zoom
4. WHEN the zoom value is invalid THEN the system SHALL clamp to valid range (10-400%)

### Requirement 6

**User Story:** As a developer, I want the persistence layer to use idb for performance, so that database operations are fast and don't block the UI.

#### Acceptance Criteria

1. WHEN implementing IndexedDB operations THEN the system SHALL use the idb library wrapper
2. WHEN saving state THEN the system SHALL use async/await with idb's Promise-based API
3. WHEN reading state THEN the system SHALL use idb's efficient get/getAll methods
4. WHEN updating state THEN the system SHALL use idb's put method for upserts
5. WHEN deleting state THEN the system SHALL use idb's delete method

### Requirement 7

**User Story:** As a developer, I want the database schema to be versioned and upgradeable, so that future changes don't break existing user data.

#### Acceptance Criteria

1. WHEN defining the database schema THEN the system SHALL use idb's openDB with version number
2. WHEN the database version changes THEN the system SHALL provide an upgrade function
3. WHEN upgrading the database THEN the system SHALL migrate existing data to new schema
4. WHEN migration fails THEN the system SHALL handle errors gracefully without data loss
5. WHEN creating object stores THEN the system SHALL define appropriate indexes for efficient queries

### Requirement 8

**User Story:** As a user, I want state updates to be debounced, so that frequent changes don't cause performance issues.

#### Acceptance Criteria

1. WHEN canvas settings change rapidly THEN the system SHALL debounce IndexedDB writes
2. WHEN a user drags a slider THEN the system SHALL wait for the drag to complete before saving
3. WHEN multiple state changes occur in quick succession THEN the system SHALL batch them into a single write
4. WHEN the debounce delay is 500ms THEN the system SHALL save after 500ms of inactivity
5. WHEN the user navigates away THEN the system SHALL flush any pending writes immediately

### Requirement 9

**User Story:** As a user, I want the ability to clear my workspace, so that I can start fresh without manually deleting everything.

#### Acceptance Criteria

1. WHEN a user requests to clear workspace THEN the system SHALL provide a confirmation dialog
2. WHEN the user confirms clearing THEN the system SHALL delete all screens from IndexedDB
3. WHEN clearing workspace THEN the system SHALL reset all settings to defaults
4. WHEN clearing workspace THEN the system SHALL preserve the media library
5. WHEN clearing completes THEN the system SHALL initialize with a single empty screen

### Requirement 10

**User Story:** As a developer, I want error handling for IndexedDB operations, so that storage failures don't crash the application.

#### Acceptance Criteria

1. WHEN an IndexedDB write fails THEN the system SHALL log the error and continue operation
2. WHEN IndexedDB is unavailable THEN the system SHALL fall back to in-memory state only
3. WHEN reading from IndexedDB fails THEN the system SHALL use default values
4. WHEN quota is exceeded THEN the system SHALL notify the user and suggest clearing old data
5. WHEN database corruption is detected THEN the system SHALL attempt to recreate the database

### Requirement 11

**User Story:** As a user, I want my frame-specific settings to persist, so that each device frame in a composition maintains its own configuration.

#### Acceptance Criteria

1. WHEN a user adjusts pan values for a specific frame THEN the system SHALL save the frame-specific pan values
2. WHEN a user adjusts scale for a specific frame THEN the system SHALL save the frame-specific scale value
3. WHEN a user positions a frame THEN the system SHALL save the frame position offsets
4. WHEN the application loads THEN the system SHALL restore all frame-specific settings
5. WHEN a composition changes THEN the system SHALL preserve frame settings where applicable

### Requirement 12

**User Story:** As a developer, I want the application to require Node.js 24 or higher, so that I can use the latest JavaScript features and performance improvements.

#### Acceptance Criteria

1. WHEN the project is set up THEN the package.json SHALL specify Node.js 24 as the minimum required version
2. WHEN a developer runs the application with Node.js < 24 THEN the system SHALL display an error message indicating the version requirement
3. WHEN the .nvmrc file is present THEN the system SHALL specify Node.js 24 as the target version
4. WHEN CI/CD pipelines run THEN the system SHALL use Node.js 24 for builds and tests
5. WHEN documentation is provided THEN the system SHALL clearly state the Node.js 24 requirement

### Requirement 13

**User Story:** As a premium user, I want my workspace data (screens, settings, compositions) to be saved to a cloud database, so that I can access my work from any device.

#### Acceptance Criteria

1. WHEN a premium user modifies their workspace THEN the system SHALL save the changes to Neon database
2. WHEN saving workspace data THEN the system SHALL store screens, canvas settings, and composition data
3. WHEN a premium user loads the application THEN the system SHALL restore workspace data from Neon database
4. WHEN workspace data is saved THEN the system SHALL maintain the same data structure as local IndexedDB storage
5. WHEN saving fails THEN the system SHALL fall back to local storage and notify the user

### Requirement 14

**User Story:** As a premium user, I want my uploaded media files to be stored in cloud storage, so that I can access my images from any device and don't lose them if I clear browser data.

#### Acceptance Criteria

1. WHEN a premium user uploads a media file THEN the system SHALL upload the file to Vercel Storage
2. WHEN uploading to Vercel Storage THEN the system SHALL store the file with a unique identifier
3. WHEN saving media metadata THEN the system SHALL store the Vercel Storage URL in Neon database
4. WHEN a premium user loads media THEN the system SHALL fetch files from Vercel Storage using stored URLs
5. WHEN a media file is deleted THEN the system SHALL remove it from Vercel Storage
6. WHEN upload fails THEN the system SHALL fall back to local OPFS storage and notify the user

### Requirement 15

**User Story:** As a premium user, I want my app preferences to be stored in cloud storage, so that my UI settings are consistent across devices.

#### Acceptance Criteria

1. WHEN a premium user changes app preferences THEN the system SHALL save preferences to Vercel Edge Config
2. WHEN saving preferences THEN the system SHALL store sidebar state, theme, zoom defaults, and other UI settings
3. WHEN a premium user loads the application THEN the system SHALL restore preferences from Vercel Edge Config
4. WHEN preferences are saved THEN the system SHALL use Edge Config for fast global access
5. WHEN Edge Config is unavailable THEN the system SHALL fall back to local storage

### Requirement 16

**User Story:** As a premium user, I want my local and cloud storage to stay synchronized, so that I can work offline and have changes sync when I reconnect.

#### Acceptance Criteria

1. WHEN a premium user makes changes offline THEN the system SHALL save changes to local storage
2. WHEN the user reconnects to the internet THEN the system SHALL automatically sync local changes to cloud storage
3. WHEN syncing THEN the system SHALL detect conflicts and resolve them (last-write-wins or user prompt)
4. WHEN cloud data changes THEN the system SHALL notify the user and offer to refresh
5. WHEN sync completes THEN the system SHALL update both local and cloud storage to match

### Requirement 17

**User Story:** As a premium user, I want to authenticate securely, so that my data is protected and only accessible to me.

#### Acceptance Criteria

1. WHEN a user accesses premium features THEN the system SHALL require authentication
2. WHEN authenticating THEN the system SHALL use secure authentication (e.g., OAuth, magic links)
3. WHEN authenticated THEN the system SHALL associate all data with the user's account
4. WHEN accessing cloud data THEN the system SHALL verify the user has permission to access that data
5. WHEN authentication expires THEN the system SHALL prompt the user to re-authenticate

### Requirement 18

**User Story:** As a premium user, I want to see sync status and errors, so that I understand when my data is saved and when there are issues.

#### Acceptance Criteria

1. WHEN saving to cloud storage THEN the system SHALL display a sync status indicator
2. WHEN sync is in progress THEN the system SHALL show "Syncing..." status
3. WHEN sync completes THEN the system SHALL show "Synced" status with timestamp
4. WHEN sync fails THEN the system SHALL show error message with retry option
5. WHEN offline THEN the system SHALL show "Offline - changes saved locally" status

### Requirement 19

**User Story:** As a developer, I want the cloud storage architecture to mirror the local storage architecture, so that the codebase remains maintainable and consistent.

#### Acceptance Criteria

1. WHEN implementing cloud storage THEN the system SHALL use similar data structures as local storage
2. WHEN saving workspace data THEN the system SHALL use the same Screen and CanvasSettings interfaces
3. WHEN storing media files THEN the system SHALL maintain compatibility with existing MediaFile interface
4. WHEN implementing sync THEN the system SHALL reuse existing state management patterns
5. WHEN accessing cloud data THEN the system SHALL use abstraction layers to hide storage implementation

### Requirement 20

**User Story:** As a free user, I want to continue using local storage, so that I can use the app without a premium subscription.

#### Acceptance Criteria

1. WHEN a free user uses the app THEN the system SHALL use only local storage (IndexedDB + OPFS)
2. WHEN a free user upgrades THEN the system SHALL migrate existing local data to cloud storage
3. WHEN a premium user downgrades THEN the system SHALL preserve local data and stop cloud sync
4. WHEN storage is accessed THEN the system SHALL check subscription status before using cloud storage
5. WHEN free user data exists THEN the system SHALL not interfere with local storage operations

### Requirement 21

**User Story:** As a premium user, I want fast access to my data, so that the app feels responsive even with cloud storage.

#### Acceptance Criteria

1. WHEN loading workspace data THEN the system SHALL use local cache first, then sync from cloud
2. WHEN displaying media files THEN the system SHALL use cached thumbnails and lazy-load full images
3. WHEN syncing THEN the system SHALL perform operations in background without blocking UI
4. WHEN Edge Config is accessed THEN the system SHALL use edge caching for fast global access
5. WHEN data is fetched THEN the system SHALL use efficient pagination and filtering

### Requirement 22

**User Story:** As a developer, I want clear separation between local and cloud storage logic, so that the codebase is maintainable and testable.

#### Acceptance Criteria

1. WHEN implementing storage THEN the system SHALL create abstraction layers (StorageAdapter interface)
2. WHEN accessing storage THEN the system SHALL use dependency injection to switch between local and cloud
3. WHEN testing THEN the system SHALL be able to mock cloud storage for unit tests
4. WHEN implementing features THEN the system SHALL not duplicate logic between local and cloud storage
5. WHEN storage is accessed THEN the system SHALL use consistent error handling patterns

### Requirement 23

**User Story:** As a premium user, I want to understand my storage usage, so that I can manage my account and avoid exceeding limits.

#### Acceptance Criteria

1. WHEN viewing account settings THEN the system SHALL display storage usage (workspace size, media files count, total storage)
2. WHEN approaching limits THEN the system SHALL warn the user before reaching capacity
3. WHEN storage is full THEN the system SHALL prevent new uploads and suggest cleanup options
4. WHEN displaying usage THEN the system SHALL show breakdown by workspace data, media files, and preferences
5. WHEN user requests cleanup THEN the system SHALL provide tools to delete unused media or old workspaces
