# Requirements Document

## Introduction

This feature enhances the drag-and-drop functionality in the AppFrames canvas editor to provide a more intuitive user experience. Currently, when users drag images onto the canvas, the behavior is inconsistent: images don't automatically save to the media library, and the system doesn't intelligently fill device frames in multi-device compositions. This enhancement will ensure that dropped images are automatically persisted to the media library (IndexedDB + OPFS) and intelligently populate device frames based on the current composition layout.

## Glossary

- **Canvas**: The main editing area where device frames and compositions are displayed
- **Canvas Background**: The area of the canvas outside of device frames where background images can be placed
- **Device Frame**: A visual mockup of a device (iPhone, iPad, etc.) that displays a screenshot
- **Device Frame Drop Zone**: The interactive area within a device frame where images can be dropped
- **Composition**: The layout arrangement of device frames (single, dual, stack, triple, fan)
- **Screen**: A screenshot/image that is displayed within a device frame
- **Background Image**: An image placed on the canvas background, outside of device frames
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

**User Story:** As a user, I want to drop images on device frames to fill them, or on the canvas background to set a background image, so that I have precise control over image placement.

#### Acceptance Criteria

1. WHEN a user drops an image on a device frame drop zone THEN the system SHALL populate that specific device frame with the image
2. WHEN a user drops an image on the canvas background (outside device frames) THEN the system SHALL set the image as the canvas background image
3. WHEN an image is dropped on a device frame THEN the system SHALL auto-fit the image to fill the frame using object-fit cover
4. WHEN an image is dropped on the canvas background THEN the system SHALL scale the image to cover the entire canvas area
5. WHEN detecting drop zones THEN the system SHALL use element bounds to determine if the drop is on a device frame or background

### Requirement 3

**User Story:** As a user, I want visual feedback when I drag images onto the canvas, so that I understand where the image will be placed.

#### Acceptance Criteria

1. WHEN a user drags a file over a device frame THEN the system SHALL highlight that device frame as a drop target
2. WHEN a user drags a file over the canvas background THEN the system SHALL highlight the canvas background as a drop target
3. WHEN the drag operation completes successfully THEN the system SHALL immediately display the image in the appropriate location
4. WHEN the media library save fails THEN the system SHALL display an error message to the user
5. WHEN multiple files are dragged simultaneously THEN the system SHALL process all files and distribute them across available device frames

### Requirement 4

**User Story:** As a user, I want dropped images to fill device frames intelligently in multi-device compositions, so that I can quickly populate multiple screenshots without manual selection.

#### Acceptance Criteria

1. WHEN a user drops multiple images on a canvas with a multi-device composition THEN the system SHALL distribute images across empty device frames
2. WHEN more images are dropped than available frames THEN the system SHALL fill all frames and ignore excess images
3. WHEN all device frames have images and a single image is dropped on a frame THEN the system SHALL replace that frame's image
4. WHEN a new screen is added to an empty canvas THEN the system SHALL set the selectedScreenIndex to 0
5. WHEN identifying empty device frames THEN the system SHALL check for both missing mediaId and missing image properties

### Requirement 5

**User Story:** As a developer, I want the drag-and-drop logic to be maintainable and testable, so that future enhancements are easier to implement.

#### Acceptance Criteria

1. WHEN implementing the upload logic THEN the system SHALL reuse the existing handleMediaUpload function from AppFrames.tsx
2. WHEN determining drop target THEN the system SHALL use element.getBoundingClientRect() to detect if drop is on device frame or background
3. WHEN the Canvas component receives a dropped file THEN the system SHALL delegate storage operations to the parent AppFrames component
4. WHEN processing dropped files THEN the system SHALL handle errors gracefully without crashing the application
5. WHEN saving to OPFS THEN the system SHALL use timestamp-based unique filenames to prevent collisions

### Requirement 6

**User Story:** As a user, I want background images to be stored and persisted, so that my canvas backgrounds are preserved across sessions.

#### Acceptance Criteria

1. WHEN a background image is set THEN the system SHALL save the mediaId to the screen's settings
2. WHEN a screen with a background image is loaded THEN the system SHALL restore the background image from the media library
3. WHEN a background image is removed THEN the system SHALL clear the background mediaId from settings
4. WHEN exporting a screen with a background image THEN the system SHALL include the background in the exported PNG
5. WHEN a background image is set THEN the system SHALL persist the change to IndexedDB via the state persistence system
