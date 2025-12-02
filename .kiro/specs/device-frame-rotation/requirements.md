# Requirements Document

## Introduction

This feature enables users to tilt and rotate device frames within the canvas, providing more dynamic and visually interesting app screenshot compositions. Users will be able to apply 3D perspective tilts and 2D rotations to device frames, enhancing the visual appeal of their marketing materials while maintaining the ability to export at required store dimensions.

## Glossary

- **Canvas**: The main workspace where device frames and screenshots are displayed and manipulated
- **Device Frame**: The visual mockup representation of a physical device (iPhone, iPad, Android phone, etc.)
- **Tilt**: A 3D perspective transformation that rotates the device frame along the X or Y axis, creating depth
- **Rotation**: A 2D transformation that rotates the device frame along the Z axis (clockwise/counterclockwise)
- **Transform**: The combined set of visual transformations applied to a device frame (tilt, rotation, scale, position)
- **Composition**: The layout arrangement of one or more device frames on the canvas
- **Export**: The process of generating a PNG image at specified dimensions from the canvas

## Requirements

### Requirement 1

**User Story:** As an app marketer, I want to tilt device frames in 3D perspective, so that I can create more dynamic and professional-looking screenshots with depth.

#### Acceptance Criteria

1. WHEN a user adjusts the X-axis tilt control THEN the Canvas SHALL apply a rotateX CSS transform to the Device Frame
2. WHEN a user adjusts the Y-axis tilt control THEN the Canvas SHALL apply a rotateY CSS transform to the Device Frame
3. WHEN tilt values are applied THEN the Canvas SHALL preserve the Device Frame's aspect ratio and content visibility
4. WHEN tilt is set to zero on both axes THEN the Device Frame SHALL display in its default flat orientation
5. WHEN a user exports the canvas THEN the system SHALL render the tilted Device Frame exactly as displayed in the preview

### Requirement 2

**User Story:** As an app marketer, I want to rotate device frames clockwise or counterclockwise, so that I can create angled compositions that draw attention to specific features.

#### Acceptance Criteria

1. WHEN a user adjusts the rotation control THEN the Canvas SHALL apply a rotateZ CSS transform to the Device Frame
2. WHEN rotation is applied THEN the Canvas SHALL rotate the Device Frame around its center point
3. WHEN rotation is combined with tilt THEN the Canvas SHALL apply both transforms in the correct order to achieve the intended visual effect
4. WHEN rotation is set to zero degrees THEN the Device Frame SHALL display in its default upright orientation
5. WHEN multiple Device Frames are present THEN the Canvas SHALL apply rotation independently to each frame

### Requirement 3

**User Story:** As a user, I want intuitive controls for adjusting tilt and rotation, so that I can quickly experiment with different orientations without technical knowledge.

#### Acceptance Criteria

1. WHEN a user accesses the device settings panel THEN the system SHALL display tilt and rotation controls with clear labels
2. WHEN a user interacts with tilt controls THEN the system SHALL provide sliders with range indicators for X-axis and Y-axis tilt
3. WHEN a user interacts with rotation control THEN the system SHALL provide a slider or input field for angle adjustment in degrees
4. WHEN a user adjusts any transform control THEN the Canvas SHALL update the Device Frame preview in real-time
5. WHEN a user resets transform settings THEN the system SHALL restore all tilt and rotation values to their defaults

### Requirement 4

**User Story:** As a user, I want tilt and rotation settings to persist with my composition, so that I don't lose my work when switching between screens or refreshing the page.

#### Acceptance Criteria

1. WHEN a user applies tilt or rotation to a Device Frame THEN the system SHALL store these values in the CanvasSettings state
2. WHEN a user switches between different screens THEN the system SHALL maintain the tilt and rotation settings for each screen independently
3. WHEN tilt and rotation values are stored THEN the system SHALL include them in any export or save operations
4. WHEN the application state is restored THEN the system SHALL reapply all stored tilt and rotation transforms to the Device Frames
5. WHEN a user creates a new screen THEN the system SHALL initialize tilt and rotation to default values

### Requirement 5

**User Story:** As a user, I want the export functionality to accurately capture tilted and rotated frames, so that my final images match what I see in the editor.

#### Acceptance Criteria

1. WHEN a user exports a canvas with tilted Device Frames THEN the system SHALL render the 3D perspective transforms in the exported PNG
2. WHEN a user exports a canvas with rotated Device Frames THEN the system SHALL render the 2D rotation transforms in the exported PNG
3. WHEN transforms cause the Device Frame to extend beyond canvas boundaries THEN the system SHALL clip or scale appropriately to fit the export dimensions
4. WHEN exporting at 2x resolution THEN the system SHALL maintain transform quality without pixelation or artifacts
5. WHEN multiple transforms are applied THEN the system SHALL render them in the correct composite order in the export

### Requirement 6

**User Story:** As a user, I want reasonable limits on tilt and rotation values, so that I can create professional-looking compositions without breaking the visual layout.

#### Acceptance Criteria

1. WHEN a user adjusts X-axis tilt THEN the system SHALL constrain the value between -60 and 60 degrees
2. WHEN a user adjusts Y-axis tilt THEN the system SHALL constrain the value between -60 and 60 degrees
3. WHEN a user adjusts rotation THEN the system SHALL allow values between -180 and 180 degrees
4. WHEN a user enters a value outside the allowed range THEN the system SHALL clamp the value to the nearest boundary
5. WHEN constraints are applied THEN the system SHALL provide visual feedback indicating the valid range
