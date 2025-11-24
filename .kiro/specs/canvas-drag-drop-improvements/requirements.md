# Requirements Document

## Introduction

This feature enhances the drag-and-drop functionality in the AppFrames canvas editor to provide a more intuitive user experience. Currently, when users drag images onto the canvas, the behavior is inconsistent: images don't automatically save to the media library, and the system doesn't intelligently fill device frames in multi-device compositions. This enhancement will ensure that dropped images are automatically persisted to the media library (IndexedDB + OPFS) and intelligently populate device frames based on the current composition layout.

## Glossary

- **Canvas**: The main editing area where device frames and compositions are displayed
- **Device Frame**: A visual mockup of a device (iPhone, iPad, etc.) that displays a screenshot
- **Composition**: The layout arrangement of device frames (single, dual, stack, triple, fan)
- **Screen**: A screenshot/image that is displayed within a device frame
- **Media Library**: The persistent storage system using IndexedDB for metadata and OPFS for image files
- **OPFS**: Origin Private File System - browser-based file storage
- **IndexedDB**: Browser database storing media file metadata
- **AppFrames Database**: The Dexie database instance named "AppFrames" with a mediaFiles table

## Requirements

### Requirement 1

**User Story:** As a user, I want images I drag onto the canvas to be automatically saved to my media library, so that I can reuse them later without re-uploading.

#### Acceptance Criteria

1. WHEN a user drags an image file onto the canvas THEN the system SHALL save the file to OPFS with a unique filename
2. WHEN a user drags an image file onto the canvas THEN the system SHALL save the file metadata to the AppFrames IndexedDB database
3. WHEN saving to the media library THEN the system SHALL generate a thumbnail at maximum 200px dimension
4. WHEN saving to the media library THEN the system SHALL extract and store the image width and height dimensions
5. WHEN the media library save completes THEN the system SHALL use the returned mediaId to populate the device frame

### Requirement 2

**User Story:** As a user, I want dropped images to fill device frames intelligently in multi-device compositions, so that I can quickly populate multiple screenshots without manual selection.

#### Acceptance Criteria

1. WHEN a user drops an image on a canvas with a single-device composition THEN the system SHALL populate the selected device frame
2. WHEN a user drops an image on a canvas with a multi-device composition (dual, stack, triple, fan) THEN the system SHALL identify the first device frame without an assigned image
3. WHEN all device frames in a composition have images THEN the system SHALL replace the image in the currently selected device frame
4. WHEN a new screen is added to an empty canvas THEN the system SHALL set the selectedScreenIndex to 0
5. WHEN identifying empty device frames THEN the system SHALL check for both missing mediaId and missing image properties

### Requirement 3

**User Story:** As a user, I want visual feedback when I drag images onto the canvas, so that I understand where the image will be placed.

#### Acceptance Criteria

1. WHEN a user drags a file over the canvas area THEN the system SHALL display a visual indicator showing the drop is allowed
2. WHEN the drag operation completes successfully THEN the system SHALL immediately display the image in the appropriate device frame
3. WHEN the media library save fails THEN the system SHALL display an error message to the user
4. WHEN multiple files are dragged simultaneously THEN the system SHALL process only the first file
5. WHEN a non-image file is dragged THEN the system SHALL reject the drop operation

### Requirement 4

**User Story:** As a developer, I want the drag-and-drop logic to be maintainable and testable, so that future enhancements are easier to implement.

#### Acceptance Criteria

1. WHEN implementing the upload logic THEN the system SHALL reuse the existing handleMediaUpload function from AppFrames.tsx
2. WHEN determining which device frame to populate THEN the system SHALL use a pure function that takes screens array and composition type as inputs
3. WHEN the Canvas component receives a dropped file THEN the system SHALL delegate storage operations to the parent AppFrames component
4. WHEN processing dropped files THEN the system SHALL handle errors gracefully without crashing the application
5. WHEN saving to OPFS THEN the system SHALL use timestamp-based unique filenames to prevent collisions
