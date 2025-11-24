# Requirements Document

## Introduction

This feature addresses critical bugs in the canvas drag-and-drop functionality and adds state persistence. Currently, images don't scale properly to fill device frames, multi-device compositions fail to create additional screens when needed, images don't display immediately after upload, and user preferences aren't persisted across page reloads.

## Glossary

- **Screen Scale**: The zoom level of the screenshot within the device frame (0-100%)
- **Device Frame**: A visual mockup of a device that displays a screenshot
- **Composition**: The layout arrangement of device frames (single, dual, stack, triple, fan)
- **LocalStorage**: Browser storage for persisting user preferences
- **MediaId**: Reference ID to an image stored in the media library

## Requirements

### Requirement 1

**User Story:** As a user, I want dropped images to automatically fill the device frame, so that I can see my screenshots properly without manual adjustment.

#### Acceptance Criteria

1. WHEN a user drops an image onto the canvas THEN the system SHALL set screenScale to 100 by default
2. WHEN displaying an image in a device frame THEN the system SHALL use backgroundSize cover to fill the frame
3. WHEN a new screen is created THEN the system SHALL initialize screenScale to 100
4. WHEN switching between screens THEN the system SHALL maintain individual screenScale values per screen
5. WHEN the user adjusts screenScale THEN the system SHALL update only the selected screen's scale

### Requirement 2

**User Story:** As a user, I want to drop images on multi-device compositions and have them create new screens automatically, so that I can quickly populate all device frames.

#### Acceptance Criteria

1. WHEN a user drops an image on a dual composition with only one screen THEN the system SHALL create a second screen
2. WHEN a user drops an image on a triple composition with fewer than three screens THEN the system SHALL create additional screens as needed
3. WHEN creating new screens for multi-device compositions THEN the system SHALL add them to the screens array
4. WHEN all required screens exist THEN the system SHALL replace the first empty screen's image
5. WHEN all screens have images THEN the system SHALL replace the currently selected screen's image

### Requirement 3

**User Story:** As a user, I want to see uploaded images immediately in the device frame, so that I don't have to reload the page to see my changes.

#### Acceptance Criteria

1. WHEN an image is uploaded to the media library THEN the system SHALL immediately update the React state
2. WHEN the screens array is updated THEN the system SHALL trigger a re-render of the Canvas component
3. WHEN a mediaId is assigned to a screen THEN the useMediaImage hook SHALL load the image from OPFS
4. WHEN the image loads from OPFS THEN the system SHALL display it in the device frame without page reload
5. WHEN state updates occur THEN the system SHALL use functional state updates to ensure consistency

### Requirement 4

**User Story:** As a user, I want my sidebar tab selection and canvas settings to persist across page reloads, so that I can continue where I left off.

#### Acceptance Criteria

1. WHEN a user selects a sidebar tab THEN the system SHALL save the selection to localStorage
2. WHEN the page loads THEN the system SHALL restore the last selected sidebar tab from localStorage
3. WHEN canvas settings change THEN the system SHALL save them to localStorage
4. WHEN the page loads THEN the system SHALL restore canvas settings from localStorage
5. WHEN localStorage is empty THEN the system SHALL use default values

### Requirement 5

**User Story:** As a developer, I want the Canvas component to properly pass mediaId to all DeviceFrame instances, so that images display correctly in all compositions.

#### Acceptance Criteria

1. WHEN rendering a single composition THEN the system SHALL pass both image and mediaId to DeviceFrame
2. WHEN rendering dual composition THEN the system SHALL pass mediaId for both device frames
3. WHEN rendering stack composition THEN the system SHALL pass mediaId for both device frames
4. WHEN rendering triple composition THEN the system SHALL pass mediaId for all three device frames
5. WHEN rendering fan composition THEN the system SHALL pass mediaId for all three device frames
