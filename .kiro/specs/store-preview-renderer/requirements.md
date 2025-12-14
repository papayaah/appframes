# Requirements Document

## Introduction

The Store Preview Renderer feature provides users with a preview of all their created screenshots organized by canvas size. Since each canvas size maintains its own independent set of screens, this view shows users which canvas sizes they have created screenshots for and allows them to review all their work in one place. This helps users visualize their screenshot portfolio and identify which canvas sizes still need attention.

## Glossary

- **Store Preview Renderer**: A view that displays all created screens organized by their canvas size
- **Canvas Size**: The export dimensions for screenshots (e.g., 1284×2778 for iPhone 6.5"). Each canvas size maintains its own independent set of screens
- **Screen**: A single screenshot composition with its associated settings (device frame, composition, images, etc.) that belongs to a specific canvas size
- **Preview Frame**: A rendered representation of a screen within the preview view
- **Canvas Size Group**: A section in the preview that shows all screens for a specific canvas size
- **screensByCanvasSize**: The data structure that organizes screens by canvas size (e.g., `{ "iphone-6.5": [screen1, screen2], "ipad-13": [screen3] }`)

## Requirements

### Requirement 1

**User Story:** As an app developer, I want to see all canvas sizes where I have created screens, so that I can review my screenshot portfolio and see what I've completed.

#### Acceptance Criteria

1. WHEN a user navigates to the preview page THEN the system SHALL display all canvas sizes that have at least one screen
2. WHEN a canvas size has no screens THEN the system SHALL NOT display that canvas size in the preview
3. WHEN displaying canvas sizes THEN the system SHALL group them by platform (Apple App Store and Google Play Store)
4. WHEN multiple canvas sizes exist for a platform THEN the system SHALL display them in a logical order (largest to smallest display size)
5. WHEN no screens exist in any canvas size THEN the system SHALL display an empty state message prompting users to create screenshots

### Requirement 2

**User Story:** As an app developer, I want to see canvas size information for each group, so that I understand which store requirements each set of screenshots satisfies.

#### Acceptance Criteria

1. WHEN displaying a canvas size group THEN the system SHALL show the canvas size label (e.g., "iPhone 6.5"", "iPad 13"")
2. WHEN displaying a canvas size group THEN the system SHALL show the exact dimensions in pixels (e.g., "1284 × 2778")
3. WHEN displaying a canvas size group THEN the system SHALL indicate the platform (Apple App Store or Google Play Store)
4. WHEN displaying canvas size groups THEN the system SHALL visually separate different platforms with section headers or dividers
5. WHEN a canvas size corresponds to specific devices THEN the system SHALL optionally display device names (e.g., "iPhone 14 Pro Max, iPhone 13 Pro Max")

### Requirement 3

**User Story:** As an app developer, I want to see all screens for each canvas size rendered accurately, so that I can review how my screenshots will look when exported.

#### Acceptance Criteria

1. WHEN displaying a canvas size group THEN the system SHALL render all screens that belong to that canvas size
2. WHEN rendering a screen THEN the system SHALL apply the screen's settings (device frame, composition, images, background, caption) to generate the preview
3. WHEN a screen contains multiple images in a composition THEN the system SHALL render all images according to the composition type (single, dual, stack, triple, fan)
4. WHEN a screen has a caption enabled THEN the system SHALL render the caption with the configured text style and position
5. WHEN a screen uses a device frame THEN the system SHALL render the appropriate device frame
6. WHEN rendering preview frames THEN the system SHALL use the same rendering logic as the export functionality to ensure accuracy

### Requirement 4

**User Story:** As an app developer, I want to see screen names and ordering in the preview, so that I can easily identify which screenshot is which and understand the sequence.

#### Acceptance Criteria

1. WHEN displaying preview frames THEN the system SHALL show the screen name below or above each rendered preview
2. WHEN displaying screens within a canvas size group THEN the system SHALL display them in the order they appear in the screensByCanvasSize array
3. WHEN a screen name is long THEN the system SHALL truncate or wrap the text to fit within the preview frame width
4. WHEN displaying multiple screens THEN the system SHALL show a count indicator (e.g., "3 screens" for the canvas size group)

### Requirement 5

**User Story:** As an app developer, I want to navigate between the main editor and the preview view, so that I can switch between editing and reviewing my screenshots.

#### Acceptance Criteria

1. WHEN a user is in the main editor THEN the system SHALL provide a navigation control to access the preview view
2. WHEN a user is in the preview view THEN the system SHALL provide a navigation control to return to the main editor
3. WHEN navigating between views THEN the system SHALL preserve all screen data and settings
4. WHEN the user returns to the editor THEN the system SHALL restore the previously selected screen

### Requirement 6

**User Story:** As an app developer, I want the preview to accurately reflect my current screenshots, so that I can trust the preview represents what will be exported.

#### Acceptance Criteria

1. WHEN a user modifies a screen in the editor THEN the system SHALL update the preview to reflect those changes when the preview is next viewed
2. WHEN a user adds a new screen to a canvas size THEN the system SHALL include that screen in the preview for that canvas size
3. WHEN a user deletes a screen from a canvas size THEN the system SHALL remove that screen from the preview for that canvas size
4. WHEN a user switches to a different canvas size and creates screens THEN the system SHALL display those screens in a separate canvas size group
5. WHEN all screens are deleted from a canvas size THEN the system SHALL remove that canvas size group from the preview

### Requirement 7

**User Story:** As an app developer, I want to navigate from the preview back to the editor for a specific canvas size, so that I can quickly make changes to screenshots I'm reviewing.

#### Acceptance Criteria

1. WHEN viewing a canvas size group in the preview THEN the system SHALL provide a control to switch to that canvas size in the editor
2. WHEN a user clicks the control to edit a canvas size THEN the system SHALL navigate to the main editor
3. WHEN navigating to the editor THEN the system SHALL set the currentCanvasSize to the selected canvas size
4. WHEN navigating to the editor THEN the system SHALL preserve all screen data and settings
5. WHEN the user returns to the editor THEN the system SHALL display the screens for the selected canvas size

### Requirement 8

**User Story:** As an app developer, I want the preview frames to be appropriately scaled for viewing, so that I can see all previews without excessive scrolling while maintaining visual clarity.

#### Acceptance Criteria

1. WHEN rendering preview frames THEN the system SHALL scale them proportionally to fit within a reasonable viewport size
2. WHEN multiple preview frames are displayed for a canvas size THEN the system SHALL ensure consistent scaling across all frames in that group
3. WHEN the viewport width changes THEN the system SHALL adjust the preview frame scaling to maintain optimal layout
4. WHEN preview frames are scaled THEN the system SHALL maintain the aspect ratio of the original canvas size
5. WHEN displaying canvas sizes with different aspect ratios THEN the system SHALL scale each group independently to optimize space usage

### Requirement 9

**User Story:** As an app developer, I want to access the screensByCanvasSize data structure, so that the preview can display all canvas sizes with their respective screens.

#### Acceptance Criteria

1. WHEN the preview component loads THEN the system SHALL access the screensByCanvasSize object from FramesContext
2. WHEN iterating through canvas sizes THEN the system SHALL use the canvas size keys from screensByCanvasSize (e.g., "iphone-6.5", "ipad-13")
3. WHEN displaying screens for a canvas size THEN the system SHALL use the screen array from screensByCanvasSize[canvasSize]
4. WHEN a canvas size has an empty array THEN the system SHALL NOT display that canvas size in the preview
5. WHEN screensByCanvasSize is updated THEN the system SHALL reflect those changes in the preview

### Requirement 10

**User Story:** As an app developer, I want to see canvas size metadata, so that I understand which platform and device each canvas size represents.

#### Acceptance Criteria

1. WHEN displaying a canvas size THEN the system SHALL use getCanvasSizeLabel() to convert the canvas size ID to a readable label
2. WHEN displaying a canvas size THEN the system SHALL use getCanvasDimensions() to show the exact pixel dimensions
3. WHEN displaying canvas sizes THEN the system SHALL group them by platform based on the canvas size ID prefix (iphone/ipad/watch for Apple, google for Google Play)
4. WHEN displaying Apple canvas sizes THEN the system SHALL show them under an "Apple App Store" section header
5. WHEN displaying Google canvas sizes THEN the system SHALL show them under a "Google Play Store" section header
