# Requirements Document

## Introduction

This feature implements comprehensive state persistence for AppFrames using IndexedDB, allowing users to maintain their work across browser sessions. Currently, all application state (screens, settings, UI preferences) is lost when the page reloads. This enhancement will persist screens, canvas settings, sidebar state, and user preferences using IndexedDB via the idb library for optimal performance.

## Glossary

- **IndexedDB**: Browser-based database for storing structured data with high performance
- **idb**: A lightweight wrapper library around IndexedDB that provides a Promise-based API
- **AppFrames Database**: The IndexedDB database storing application state and media metadata
- **Screen**: A canvas configuration containing images, device frames, and settings
- **Canvas Settings**: Configuration for a screen including composition, device frame, colors, and positioning
- **Workspace**: The collection of all screens and global settings representing the user's current project
- **Sidebar State**: The currently selected sidebar tab and panel open/closed state
- **OPFS**: Origin Private File System where actual image files are stored
- **Media Library**: The collection of uploaded images with metadata stored in IndexedDB

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
