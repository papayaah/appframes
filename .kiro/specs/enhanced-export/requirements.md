# Requirements Document

## Introduction

The Enhanced Export feature extends the Store Preview Renderer by adding comprehensive export capabilities directly within the preview interface. Users can export screenshots with flexible options including format selection (PNG/JPG), canvas size filtering, and quality settings. This feature moves export functionality from the main editor to the preview, providing a centralized location for reviewing and exporting all screenshots.

## Glossary

- **Store Preview Renderer**: The view that displays all created screens organized by canvas size
- **Export Options**: User-configurable settings for export including format, canvas sizes, and quality
- **Canvas Size Filter**: Selection mechanism to choose which canvas sizes to include in export
- **Export Format**: The image file format for exported screenshots (PNG or JPG)
- **Batch Export**: Exporting multiple screens across one or more canvas sizes in a single operation
- **ZIP Archive**: A compressed file containing multiple exported screenshots
- **Quality Setting**: Compression quality for JPG exports (0-100)
- **Export Modal**: A dialog interface for configuring export options before downloading
- **Watermark**: A semi-transparent text overlay added to exported images for free users
- **Free User**: A user without a paid subscription who receives watermarked exports
- **Pro User**: A user with a paid subscription who receives exports without watermarks

## Requirements

### Requirement 1

**User Story:** As an app developer, I want to export screenshots from the preview interface, so that I can download my work after reviewing it.

#### Acceptance Criteria

1. WHEN viewing the store preview THEN the system SHALL display an "Export" button prominently in the interface
2. WHEN a user clicks the Export button THEN the system SHALL open an export options modal
3. WHEN the export options modal opens THEN the system SHALL display all available export configuration options
4. WHEN a user confirms export THEN the system SHALL process the export according to the selected options
5. WHEN export processing completes THEN the system SHALL download the exported files to the user's device

### Requirement 2

**User Story:** As an app developer, I want to choose between PNG and JPG formats, so that I can optimize file size or quality based on my needs.

#### Acceptance Criteria

1. WHEN the export modal displays THEN the system SHALL show format selection options for PNG and JPG
2. WHEN a user selects PNG format THEN the system SHALL export all screenshots as PNG files with lossless compression
3. WHEN a user selects JPG format THEN the system SHALL export all screenshots as JPG files with configurable quality
4. WHEN JPG format is selected THEN the system SHALL display a quality slider ranging from 0 to 100
5. WHEN the user adjusts the quality slider THEN the system SHALL update the export quality setting accordingly

### Requirement 3

**User Story:** As an app developer, I want to select which canvas sizes to export, so that I can download only the screenshots I need for specific store submissions.

#### Acceptance Criteria

1. WHEN the export modal displays THEN the system SHALL show a list of all canvas sizes that have screens
2. WHEN displaying canvas sizes THEN the system SHALL show each canvas size label, dimensions, and screen count
3. WHEN a user clicks a canvas size THEN the system SHALL toggle its selection state
4. WHEN a canvas size is selected THEN the system SHALL include all screens from that canvas size in the export
5. WHEN a canvas size is deselected THEN the system SHALL exclude all screens from that canvas size from the export
6. WHEN the export modal opens THEN the system SHALL default to having all canvas sizes selected

### Requirement 4

**User Story:** As an app developer, I want to see a preview of what will be exported, so that I can verify my selections before downloading.

#### Acceptance Criteria

1. WHEN canvas sizes are selected THEN the system SHALL display the total number of screens that will be exported
2. WHEN the format is changed THEN the system SHALL display the estimated file size for the export
3. WHEN JPG quality is adjusted THEN the system SHALL update the estimated file size accordingly
4. WHEN no canvas sizes are selected THEN the system SHALL disable the export button and display a message
5. WHEN export options change THEN the system SHALL update the preview information in real-time

### Requirement 5

**User Story:** As an app developer, I want to export a single screen as an individual file, so that I can quickly download one screenshot without creating a ZIP archive.

#### Acceptance Criteria

1. WHEN exactly one screen is selected for export THEN the system SHALL download that screen as a single image file
2. WHEN a single screen is exported THEN the system SHALL use the screen name as the filename
3. WHEN a single screen is exported THEN the system SHALL append the appropriate file extension (.png or .jpg)
4. WHEN a single screen is exported THEN the system SHALL not create a ZIP archive
5. WHEN a single screen export completes THEN the system SHALL close the export modal

### Requirement 6

**User Story:** As an app developer, I want to export multiple screens as a ZIP archive, so that I can download all my screenshots in one organized package.

#### Acceptance Criteria

1. WHEN more than one screen is selected for export THEN the system SHALL create a ZIP archive containing all exported screens
2. WHEN creating a ZIP archive THEN the system SHALL organize files by canvas size using folder structure
3. WHEN creating a ZIP archive THEN the system SHALL name each file using a sequential number and screen name
4. WHEN creating a ZIP archive THEN the system SHALL use the format "canvasSize/01-screenName.png"
5. WHEN the ZIP archive is created THEN the system SHALL download it with a filename including timestamp

### Requirement 7

**User Story:** As an app developer, I want to see export progress, so that I know the system is working when exporting many screenshots.

#### Acceptance Criteria

1. WHEN export processing begins THEN the system SHALL display a progress indicator
2. WHEN processing screens THEN the system SHALL show the current screen being processed
3. WHEN processing screens THEN the system SHALL show a progress percentage or count (e.g., "3 of 10")
4. WHEN export completes successfully THEN the system SHALL display a success message
5. WHEN export fails THEN the system SHALL display an error message with details

### Requirement 8

**User Story:** As an app developer, I want the export to use the same rendering as the preview, so that exported screenshots match what I see in the preview.

#### Acceptance Criteria

1. WHEN exporting a screen THEN the system SHALL use the CompositionRenderer component to render the screen
2. WHEN exporting a screen THEN the system SHALL apply all screen settings (device frame, composition, images, background, caption)
3. WHEN exporting a screen THEN the system SHALL render at the exact canvas size dimensions
4. WHEN exporting a screen THEN the system SHALL use 2x pixel ratio for high-quality output
5. WHEN exporting a screen THEN the system SHALL ensure the exported image matches the preview appearance

### Requirement 9

**User Story:** As an app developer, I want to export all screens from selected canvas sizes, so that I can download complete screenshot sets for store submissions.

#### Acceptance Criteria

1. WHEN multiple canvas sizes are selected THEN the system SHALL export all screens from each selected canvas size
2. WHEN exporting multiple canvas sizes THEN the system SHALL maintain the screen order within each canvas size
3. WHEN exporting multiple canvas sizes THEN the system SHALL process canvas sizes in a consistent order (Apple then Google)
4. WHEN a canvas size has no screens THEN the system SHALL skip that canvas size in the export
5. WHEN all selected canvas sizes are processed THEN the system SHALL complete the export operation

### Requirement 10

**User Story:** As an app developer, I want to cancel an export in progress, so that I can stop the operation if I made a mistake in my selections.

#### Acceptance Criteria

1. WHEN export is processing THEN the system SHALL display a "Cancel" button
2. WHEN a user clicks Cancel THEN the system SHALL stop processing remaining screens
3. WHEN export is cancelled THEN the system SHALL not download any files
4. WHEN export is cancelled THEN the system SHALL display a cancellation message
5. WHEN export is cancelled THEN the system SHALL return the user to the export options modal

### Requirement 11

**User Story:** As an app developer, I want quick export actions for common scenarios, so that I can export without configuring options every time.

#### Acceptance Criteria

1. WHEN viewing the preview THEN the system SHALL provide a "Quick Export All" button
2. WHEN a user clicks Quick Export All THEN the system SHALL export all screens in all canvas sizes as PNG in a ZIP archive
3. WHEN Quick Export All is used THEN the system SHALL not display the export options modal
4. WHEN Quick Export All completes THEN the system SHALL display a success notification
5. WHEN viewing a canvas size group THEN the system SHALL provide a "Quick Export" button for that canvas size only

### Requirement 12

**User Story:** As a free user, I understand that exported screenshots will include a watermark, so that I can use the app for free while the developer can monetize through paid plans.

#### Acceptance Criteria

1. WHEN a free user exports a screenshot THEN the system SHALL add a watermark to the exported image
2. WHEN adding a watermark THEN the system SHALL display "Made with AppFrames" text in the bottom-right corner
3. WHEN adding a watermark THEN the system SHALL use semi-transparent styling (40% opacity) to be visible but unobtrusive
4. WHEN adding a watermark THEN the system SHALL use a small font size that does not obscure the main content
5. WHEN a pro/paid user exports a screenshot THEN the system SHALL not add any watermark
6. WHEN the export modal displays for free users THEN the system SHALL show a notice that exports will include a watermark
7. WHEN the export modal displays for free users THEN the system SHALL show an "Upgrade to Pro" option to remove watermarks

### Requirement 13

**User Story:** As an app developer, I want the export functionality removed from the main editor header, so that export is centralized in the preview interface.

#### Acceptance Criteria

1. WHEN viewing the main editor THEN the system SHALL not display the Export button in the header
2. WHEN viewing the main editor THEN the system SHALL display a "Go to Preview" button to access export functionality
3. WHEN the Download button is clicked in the editor THEN the system SHALL continue to download currently visible screens
4. WHEN a user needs to export THEN the system SHALL direct them to use the preview interface
5. WHEN the export button is removed THEN the system SHALL maintain all other header functionality
