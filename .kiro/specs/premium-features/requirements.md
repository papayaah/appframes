# Requirements Document

## Introduction

This feature enables premium users to save their AppFrames workspace data to cloud storage, providing cross-device access, backup, and collaboration capabilities. Premium features include cloud persistence of screens and settings (stored in Neon database), media files (stored in Vercel Storage), and app preferences (stored in Vercel Edge Config). This cloud-based architecture mirrors the existing local storage architecture (IndexedDB + OPFS) while providing enhanced reliability and accessibility.

## Glossary

- **Premium User**: A user with an active premium subscription that enables cloud storage features
- **Neon Database**: Serverless PostgreSQL database for storing workspace data (screens, settings, metadata)
- **Vercel Storage**: Object storage service for storing media files (images, thumbnails)
- **Vercel Edge Config**: Edge-optimized key-value store for app preferences and user settings
- **Workspace**: The collection of all screens, settings, and associated data for a user
- **Media File**: An uploaded image file with metadata (dimensions, thumbnail, etc.)
- **App Preferences**: User interface preferences (sidebar state, theme, zoom defaults, etc.)
- **Sync**: The process of uploading local changes to cloud storage or downloading cloud changes to local storage
- **Local Storage**: Browser-based storage (IndexedDB for workspace, OPFS for files) used for free users
- **Cloud Storage**: Server-based storage (Neon for workspace, Vercel Storage for files, Edge Config for preferences) used for premium users
- **Hybrid Mode**: Premium users maintain both local and cloud storage for offline access and performance

## Requirements

### Requirement 1

**User Story:** As a premium user, I want my workspace data (screens, settings, compositions) to be saved to a cloud database, so that I can access my work from any device.

#### Acceptance Criteria

1. WHEN a premium user modifies their workspace THEN the system SHALL save the changes to Neon database
2. WHEN saving workspace data THEN the system SHALL store screens, canvas settings, and composition data
3. WHEN a premium user loads the application THEN the system SHALL restore workspace data from Neon database
4. WHEN workspace data is saved THEN the system SHALL maintain the same data structure as local IndexedDB storage
5. WHEN saving fails THEN the system SHALL fall back to local storage and notify the user

### Requirement 2

**User Story:** As a premium user, I want my uploaded media files to be stored in cloud storage, so that I can access my images from any device and don't lose them if I clear browser data.

#### Acceptance Criteria

1. WHEN a premium user uploads a media file THEN the system SHALL upload the file to Vercel Storage
2. WHEN uploading to Vercel Storage THEN the system SHALL store the file with a unique identifier
3. WHEN saving media metadata THEN the system SHALL store the Vercel Storage URL in Neon database
4. WHEN a premium user loads media THEN the system SHALL fetch files from Vercel Storage using stored URLs
5. WHEN a media file is deleted THEN the system SHALL remove it from Vercel Storage
6. WHEN upload fails THEN the system SHALL fall back to local OPFS storage and notify the user

### Requirement 3

**User Story:** As a premium user, I want my app preferences to be stored in cloud storage, so that my UI settings are consistent across devices.

#### Acceptance Criteria

1. WHEN a premium user changes app preferences THEN the system SHALL save preferences to Vercel Edge Config
2. WHEN saving preferences THEN the system SHALL store sidebar state, theme, zoom defaults, and other UI settings
3. WHEN a premium user loads the application THEN the system SHALL restore preferences from Vercel Edge Config
4. WHEN preferences are saved THEN the system SHALL use Edge Config for fast global access
5. WHEN Edge Config is unavailable THEN the system SHALL fall back to local storage

### Requirement 4

**User Story:** As a premium user, I want my local and cloud storage to stay synchronized, so that I can work offline and have changes sync when I reconnect.

#### Acceptance Criteria

1. WHEN a premium user makes changes offline THEN the system SHALL save changes to local storage
2. WHEN the user reconnects to the internet THEN the system SHALL automatically sync local changes to cloud storage
3. WHEN syncing THEN the system SHALL detect conflicts and resolve them (last-write-wins or user prompt)
4. WHEN cloud data changes THEN the system SHALL notify the user and offer to refresh
5. WHEN sync completes THEN the system SHALL update both local and cloud storage to match

### Requirement 5

**User Story:** As a premium user, I want to authenticate securely, so that my data is protected and only accessible to me.

#### Acceptance Criteria

1. WHEN a user accesses premium features THEN the system SHALL require authentication
2. WHEN authenticating THEN the system SHALL use secure authentication (e.g., OAuth, magic links)
3. WHEN authenticated THEN the system SHALL associate all data with the user's account
4. WHEN accessing cloud data THEN the system SHALL verify the user has permission to access that data
5. WHEN authentication expires THEN the system SHALL prompt the user to re-authenticate

### Requirement 6

**User Story:** As a premium user, I want to see sync status and errors, so that I understand when my data is saved and when there are issues.

#### Acceptance Criteria

1. WHEN saving to cloud storage THEN the system SHALL display a sync status indicator
2. WHEN sync is in progress THEN the system SHALL show "Syncing..." status
3. WHEN sync completes THEN the system SHALL show "Synced" status with timestamp
4. WHEN sync fails THEN the system SHALL show error message with retry option
5. WHEN offline THEN the system SHALL show "Offline - changes saved locally" status

### Requirement 7

**User Story:** As a developer, I want the cloud storage architecture to mirror the local storage architecture, so that the codebase remains maintainable and consistent.

#### Acceptance Criteria

1. WHEN implementing cloud storage THEN the system SHALL use similar data structures as local storage
2. WHEN saving workspace data THEN the system SHALL use the same Screen and CanvasSettings interfaces
3. WHEN storing media files THEN the system SHALL maintain compatibility with existing MediaFile interface
4. WHEN implementing sync THEN the system SHALL reuse existing state management patterns
5. WHEN accessing cloud data THEN the system SHALL use abstraction layers to hide storage implementation

### Requirement 8

**User Story:** As a premium user, I want my data to be backed up automatically, so that I don't lose my work due to device failure or data corruption.

#### Acceptance Criteria

1. WHEN workspace data is saved THEN the system SHALL create automatic backups in cloud storage
2. WHEN media files are uploaded THEN the system SHALL store redundant copies
3. WHEN data corruption is detected THEN the system SHALL restore from backup
4. WHEN user requests restore THEN the system SHALL provide access to backup history
5. WHEN backups are created THEN the system SHALL maintain reasonable retention (e.g., 30 days)

### Requirement 9

**User Story:** As a free user, I want to continue using local storage, so that I can use the app without a premium subscription.

#### Acceptance Criteria

1. WHEN a free user uses the app THEN the system SHALL use only local storage (IndexedDB + OPFS)
2. WHEN a free user upgrades THEN the system SHALL migrate existing local data to cloud storage
3. WHEN a premium user downgrades THEN the system SHALL preserve local data and stop cloud sync
4. WHEN storage is accessed THEN the system SHALL check subscription status before using cloud storage
5. WHEN free user data exists THEN the system SHALL not interfere with local storage operations

### Requirement 10

**User Story:** As a premium user, I want fast access to my data, so that the app feels responsive even with cloud storage.

#### Acceptance Criteria

1. WHEN loading workspace data THEN the system SHALL use local cache first, then sync from cloud
2. WHEN displaying media files THEN the system SHALL use cached thumbnails and lazy-load full images
3. WHEN syncing THEN the system SHALL perform operations in background without blocking UI
4. WHEN Edge Config is accessed THEN the system SHALL use edge caching for fast global access
5. WHEN data is fetched THEN the system SHALL use efficient pagination and filtering

### Requirement 11

**User Story:** As a developer, I want clear separation between local and cloud storage logic, so that the codebase is maintainable and testable.

#### Acceptance Criteria

1. WHEN implementing storage THEN the system SHALL create abstraction layers (StorageAdapter interface)
2. WHEN accessing storage THEN the system SHALL use dependency injection to switch between local and cloud
3. WHEN testing THEN the system SHALL be able to mock cloud storage for unit tests
4. WHEN implementing features THEN the system SHALL not duplicate logic between local and cloud storage
5. WHEN storage is accessed THEN the system SHALL use consistent error handling patterns

### Requirement 12

**User Story:** As a premium user, I want to understand my storage usage, so that I can manage my account and avoid exceeding limits.

#### Acceptance Criteria

1. WHEN viewing account settings THEN the system SHALL display storage usage (workspace size, media files count, total storage)
2. WHEN approaching limits THEN the system SHALL warn the user before reaching capacity
3. WHEN storage is full THEN the system SHALL prevent new uploads and suggest cleanup options
4. WHEN displaying usage THEN the system SHALL show breakdown by workspace data, media files, and preferences
5. WHEN user requests cleanup THEN the system SHALL provide tools to delete unused media or old workspaces
