# Requirements Document

## Introduction

This feature enables users to transform device frames within the canvas through tilt, rotation, and resizing capabilities, providing more dynamic and visually interesting app screenshot compositions. Users will be able to apply 3D perspective tilts, 2D rotations, and interactive resizing to device frames using intuitive controls and drag handles. These transformations enhance the visual appeal of marketing materials while maintaining the ability to export at required store dimensions.

## Glossary

- **Canvas**: The main workspace where device frames and screenshots are displayed and manipulated
- **Device Frame**: The visual mockup representation of a physical device (iPhone, iPad, Android phone, etc.)
- **Tilt**: A 3D perspective transformation that rotates the device frame along the X or Y axis, creating depth
- **Rotation**: A 2D transformation that rotates the device frame along the Z axis (clockwise/counterclockwise)
- **Resize**: A scaling transformation that changes the visual size of a device frame while maintaining image quality
- **Resize Handle**: An interactive control point on the edge or corner of a device frame that enables resizing
- **Scale**: The size multiplier applied to a device frame, expressed as a percentage (100% = original size)
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

### Requirement 7

**User Story:** As an app marketer, I want to resize individual device frames using edge or corner handles, so that I can adjust the visual prominence of different devices independently in my composition.

#### Acceptance Criteria

1. WHEN a user hovers over a Device Frame THEN the Canvas SHALL display resize handles on the edges and corners of that specific frame
2. WHEN a user drags a corner handle THEN the Canvas SHALL resize that Device Frame proportionally maintaining aspect ratio
3. WHEN a user drags an edge handle THEN the Canvas SHALL resize that Device Frame along that dimension only
4. WHEN a Device Frame is resized THEN the Canvas SHALL apply a CSS scale transform to that frame independently
5. WHEN resize handles are displayed THEN the system SHALL show visual feedback indicating which handle is being hovered or dragged
6. WHEN multiple Device Frames are present in a composition THEN each frame SHALL be resizable independently

### Requirement 8

**User Story:** As a user, I want resize operations to work smoothly with rotation and tilt, so that I can create complex compositions with both size and orientation variations.

#### Acceptance Criteria

1. WHEN a Device Frame has rotation applied THEN the resize handles SHALL remain aligned with the frame edges
2. WHEN a Device Frame has tilt applied THEN the resize handles SHALL remain visible and functional
3. WHEN resizing a rotated or tilted frame THEN the Canvas SHALL apply the scale transform before rotation transforms
4. WHEN multiple transforms are combined THEN the Canvas SHALL maintain the correct transform order during resize operations
5. WHEN a user releases a resize handle THEN the Canvas SHALL finalize the scale value and update the state

### Requirement 9

**User Story:** As a user, I want resize settings to persist per frame with my composition, so that individual frame sizes are maintained when switching screens or refreshing the page.

#### Acceptance Criteria

1. WHEN a user resizes a Device Frame THEN the system SHALL store the scale value in the ScreenImage state for that specific frame
2. WHEN a user switches between different screens THEN the system SHALL maintain the resize scale for each frame independently across all screens
3. WHEN resize values are stored THEN the system SHALL include them in any export or save operations
4. WHEN the application state is restored THEN the system SHALL reapply all stored scale values to the corresponding Device Frames
5. WHEN a new frame is added to a screen THEN the system SHALL initialize that frame's resize scale to 100 percent

### Requirement 10

**User Story:** As a user, I want reasonable limits on resize values, so that frames remain visible and usable without becoming too small or too large.

#### Acceptance Criteria

1. WHEN a user resizes a Device Frame THEN the system SHALL constrain the scale between 20 and 200 percent
2. WHEN a user attempts to resize beyond the minimum THEN the system SHALL prevent further reduction and maintain the minimum scale
3. WHEN a user attempts to resize beyond the maximum THEN the system SHALL prevent further enlargement and maintain the maximum scale
4. WHEN resize constraints are reached THEN the system SHALL provide visual feedback indicating the limit
5. WHEN a Device Frame is at minimum or maximum scale THEN the corresponding resize handles SHALL indicate the constraint visually

### Requirement 11

**User Story:** As a user, I want the composition-level scale slider removed from the sidebar, so that I can focus on individual frame resizing without confusion between global and per-frame scaling.

#### Acceptance Criteria

1. WHEN the sidebar device controls are displayed THEN the system SHALL NOT display a composition-level scale slider
2. WHEN the compositionScale property is removed from CanvasSettings THEN the system SHALL remove all references to compositionScale from the codebase
3. WHEN existing compositions with compositionScale values are loaded THEN the system SHALL ignore the compositionScale property and use per-frame scale values instead
4. WHEN the CompositionRenderer applies scaling THEN the system SHALL use only per-frame scale values from ScreenImage
5. WHEN a user migrates from the old system THEN existing compositions SHALL display correctly without the global scale setting
