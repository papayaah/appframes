# Requirements Document

## Introduction

This feature enables users to drag any canvas element (device frames or text) across multiple canvas screens, automatically splitting the element so that each screen captures and displays only the portion that overlaps with it. When an element is dropped while spanning multiple screens, each affected screen permanently stores its partial view of the element, enabling creative multi-screen compositions with both device frames and text elements.

## Glossary

- **Canvas Screen**: An individual exportable canvas in the screens panel, each with defined dimensions
- **Canvas Element**: Any draggable component on the canvas, including device frames and text elements
- **Device Frame**: The visual mockup of a device (e.g., iPhone 14 Pro, iPad) that contains the screenshot
- **Text Element**: A draggable text caption or label that can be positioned on the canvas
- **Cross-Canvas Drag**: The act of dragging a canvas element across multiple canvas screens simultaneously
- **Element Split**: The automatic division of a canvas element into partial views when it overlaps multiple screens
- **Partial Element**: A portion of a canvas element that is visible within a specific canvas screen's boundaries
- **Drop Zone**: The area where a canvas element can be dropped to apply it to one or more screens
- **Thumbnail**: The preview image shown in the screens panel at the bottom of the interface
- **Overlap Region**: The area where a dragged canvas element intersects with a canvas screen

## Requirements

### Requirement 1

**User Story:** As a user, I want to drag any canvas element (device frame or text) across multiple canvas screens, so that I can see which screens will be affected before dropping.

#### Acceptance Criteria

1. WHEN a user drags a canvas element over the screens panel THEN the system SHALL display a visual preview of the element position
2. WHEN the dragged element overlaps multiple canvas screens THEN the system SHALL highlight all affected screens
3. WHEN the dragged element position changes THEN the system SHALL update the preview in real-time
4. WHEN the dragged element overlaps a screen THEN the system SHALL show which portion of the element will be captured by that screen
5. WHEN the user releases the drag THEN the system SHALL apply the partial element to all overlapping screens

### Requirement 2

**User Story:** As a user, I want each canvas screen to automatically capture only its portion of a dropped element, so that I can create split compositions with device frames and text.

#### Acceptance Criteria

1. WHEN a canvas element is dropped while overlapping multiple screens THEN the system SHALL calculate the intersection region for each screen
2. WHEN a screen intersects with the dropped element THEN the system SHALL store the partial element data for that screen
3. WHEN calculating the partial element THEN the system SHALL determine which portion of the element falls within the screen boundaries
4. WHEN storing partial element data THEN the system SHALL include the element position, visible region, and clipping boundaries
5. WHEN a screen has no intersection with the dropped element THEN the system SHALL not modify that screen

### Requirement 3

**User Story:** As a user, I want thumbnails to display partial elements for each affected screen, so that I can preview the split effect.

#### Acceptance Criteria

1. WHEN a screen contains a partial element THEN the thumbnail SHALL render only the visible portion of the element
2. WHEN multiple screens contain different portions of the same element THEN each thumbnail SHALL independently show its respective partial view
3. WHEN the thumbnail is rendered THEN the system SHALL clip the element at the screen boundaries
4. WHERE the element is a device frame WHEN the screenshot content is present THEN the thumbnail SHALL display the content clipped proportionally with the frame
5. WHERE the element is text WHEN the thumbnail is rendered THEN the system SHALL clip the text at the screen boundaries
6. WHEN a screen is updated THEN the thumbnail SHALL refresh to reflect the current partial element state

### Requirement 4

**User Story:** As a user, I want exported images to show the exact partial elements visible in each screen's thumbnail, so that my final output matches the preview.

#### Acceptance Criteria

1. WHEN a user exports a screen with a partial element THEN the system SHALL render only the portion of the element within that screen's boundaries
2. WHEN exporting at 2x resolution THEN the system SHALL maintain the same proportional clipping of the partial element
3. WHERE the element is a device frame WHEN the screenshot content is present THEN the export SHALL include the content clipped with the device frame
4. WHERE the element is text WHEN exporting THEN the system SHALL clip the text at the screen boundaries
5. WHEN multiple screens are exported THEN each export SHALL contain its respective partial element view
6. WHEN a partial element is exported THEN the system SHALL maintain the correct positioning and scale of the element portion

### Requirement 5

**User Story:** As a user, I want element content to be correctly positioned within partial elements, so that device screenshots and text remain properly aligned.

#### Acceptance Criteria

1. WHERE the element is a device frame WHEN the frame is split across screens THEN the screenshot content SHALL be clipped proportionally with the frame
2. WHERE the element is a device frame WHEN a partial frame is rendered THEN the system SHALL maintain the correct aspect ratio of the screenshot content
3. WHERE the element is a device frame WHEN the visible portion of the frame changes THEN the system SHALL adjust the visible portion of the screenshot accordingly
4. WHERE the element is text WHEN the text is split across screens THEN the system SHALL clip the text content at the screen boundaries
5. WHERE the element is text WHEN a partial text element is rendered THEN the system SHALL maintain the correct font size, style, and alignment

### Requirement 6

**User Story:** As a user, I want to drag canvas elements across screens in any direction, so that I can create various split layouts.

#### Acceptance Criteria

1. WHEN a user drags an element horizontally across screens THEN the system SHALL split the element along vertical boundaries
2. WHEN a user drags an element vertically across screens THEN the system SHALL split the element along horizontal boundaries
3. WHEN a user drags an element diagonally across screens THEN the system SHALL split the element along both vertical and horizontal boundaries
4. WHEN screens are arranged in a grid THEN the system SHALL correctly calculate intersections for all overlapping screens
5. WHEN an element overlaps screen corners THEN the system SHALL accurately determine the visible portion for each screen

### Requirement 7

**User Story:** As a user, I want to replace or remove partial elements on individual screens, so that I can modify split compositions.

#### Acceptance Criteria

1. WHEN a user drops a new element on a screen with a partial element THEN the system SHALL replace the partial element with the new element
2. WHEN a user removes a screen with a partial element THEN the system SHALL delete the partial element data for that screen
3. WHEN a user drops a full element on a screen with a partial element THEN the system SHALL replace the partial element with the full element
4. WHEN a user adds a new screen THEN the system SHALL initialize the screen without any partial element data
5. WHEN a user modifies a screen's partial element THEN the system SHALL not affect other screens with different portions of the same element

### Requirement 8

**User Story:** As a user, I want visual feedback during drag operations, so that I understand how the element will be split before dropping.

#### Acceptance Criteria

1. WHEN an element is dragged over multiple screens THEN the system SHALL display overlay indicators showing the split regions
2. WHEN the drag position changes THEN the system SHALL update the split region indicators in real-time
3. WHEN a screen will receive a partial element THEN the system SHALL highlight that screen with a visual indicator
4. WHEN the element does not overlap a screen THEN the system SHALL not highlight that screen
5. WHEN the drag operation ends THEN the system SHALL remove all drag-related visual indicators

### Requirement 9

**User Story:** As a user, I want to freely drag canvas elements across any number of canvas screens, so that I can experiment with different split compositions.

#### Acceptance Criteria

1. WHEN a user drags an element across the screens panel THEN the system SHALL continuously calculate intersections with all visible screens
2. WHEN the dragged element enters a new screen's boundary THEN the system SHALL immediately show the preview for that screen
3. WHEN the dragged element exits a screen's boundary THEN the system SHALL immediately remove the preview for that screen
4. WHERE there are multiple screens (e.g., 10 screens) WHILE the user drags an element THEN the system SHALL handle intersection calculations for all screens efficiently
5. WHEN a user drops an element after dragging across multiple screens THEN the system SHALL apply partial elements to all screens that were overlapping at the moment of drop

### Requirement 10

**User Story:** As a user, I want to drag an existing partial element to a different position across screens, so that I can reposition split compositions.

#### Acceptance Criteria

1. WHEN a user drags a canvas element that is already placed on screens THEN the system SHALL allow repositioning across any screens
2. WHEN repositioning an element THEN the system SHALL remove the previous partial element data from all previously affected screens
3. WHEN the repositioned element is dropped THEN the system SHALL apply new partial element data to all newly overlapping screens
4. WHEN an element is repositioned to overlap different screens THEN the system SHALL update all affected thumbnails and exports
5. WHEN an element is repositioned to no longer overlap a screen THEN the system SHALL remove the partial element data from that screen

### Requirement 11

**User Story:** As a user, I want to drag both device frames and text elements using the same interaction pattern, so that I have a consistent experience across all canvas elements.

#### Acceptance Criteria

1. WHEN a user initiates a drag on a device frame THEN the system SHALL use the same drag mechanism as for text elements
2. WHEN a user initiates a drag on a text element THEN the system SHALL use the same drag mechanism as for device frames
3. WHEN any element is dragged across screens THEN the system SHALL apply the same intersection calculation logic
4. WHEN any element is dropped THEN the system SHALL apply the same partial element storage logic
5. WHEN visual feedback is shown during drag THEN the system SHALL use consistent indicators for all element types
