# Requirements Document

## Introduction

The Store Preview Renderer feature provides users with a comprehensive preview of all their created screenshots across different device categories and canvas sizes required by Apple App Store and Google Play Store. This allows users to visualize how their entire screenshot set will appear in store listings before export, ensuring consistency and completeness across all required dimensions.

## Glossary

- **Store Preview Renderer**: A view that displays all created screens rendered at different canvas sizes grouped by device category
- **Canvas Size**: The export dimensions required by app stores (e.g., 1242×2688 for iPhone 6.5")
- **Device Category**: A grouping of related devices (e.g., iOS Phones, iPad, Android Phones, Android Tablets)
- **Screen**: A single screenshot composition with its associated settings (device frame, composition, images, etc.)
- **Preview Frame**: A rendered representation of a screen at a specific canvas size within the preview view
- **Platform Tab**: A tab selector that switches between Apple App Store and Google Play Store preview views
- **Default Canvas Sizes**: The standard canvas dimensions required by each platform for different device categories

## Requirements

### Requirement 1

**User Story:** As an app developer, I want to switch between Apple App Store and Google Play Store preview views, so that I can focus on one platform at a time without being overwhelmed.

#### Acceptance Criteria

1. WHEN a user navigates to the preview page THEN the system SHALL display two platform tabs (Apple App Store and Google Play Store)
2. WHEN the preview page loads THEN the system SHALL default to showing the Apple App Store tab
3. WHEN a user clicks a platform tab THEN the system SHALL display only the device categories and canvas sizes for that platform
4. WHEN switching between tabs THEN the system SHALL preserve the scroll position and state of each tab
5. WHEN a tab is active THEN the system SHALL provide visual indication of which platform is currently displayed

### Requirement 2

**User Story:** As an app developer, I want to see all my screenshots rendered across different device categories for the selected platform, so that I can verify I have complete coverage for that store's submission requirements.

#### Acceptance Criteria

1. WHEN viewing the Apple App Store tab THEN the system SHALL display device categories for iPhone, iPad, and Apple Watch
2. WHEN viewing the Google Play Store tab THEN the system SHALL display device categories for Phone, 7-inch Tablet, 10-inch Tablet, Chromebook, and Android XR
3. WHEN displaying Apple iPhone categories THEN the system SHALL default to showing only the largest display size (6.9") with an option to expand and view all sizes (6.9", 6.5", 6.3", 6.1", 5.5", 4.7", 4", 3.5")
4. WHEN displaying Apple iPad categories THEN the system SHALL default to showing only the largest display size (13") with an option to expand and view all sizes (13", 11", 12.9" 2nd Gen, 10.5", 9.7")
5. WHEN displaying Apple Watch categories THEN the system SHALL default to showing only the largest display size (Ultra 3) with an option to expand and view all sizes (Ultra 3, Series 11, Series 9, Series 6, Series 3)
6. WHEN a user expands iPhone, iPad, or Apple Watch size options THEN the system SHALL display all display sizes with their respective canvas dimensions
7. WHEN displaying device categories THEN the system SHALL show the category name, canvas dimensions, and submission requirements (e.g., "2-8 screenshots")
8. WHEN a device category has multiple orientation options THEN the system SHALL display both portrait and landscape previews
9. WHEN no screens exist THEN the system SHALL display an empty state message prompting users to create screenshots

### Requirement 3

**User Story:** As an app developer, I want to see each of my created screens rendered at every required canvas size for the selected platform, so that I can ensure my screenshots look good across all store requirements.

#### Acceptance Criteria

1. WHEN the system renders preview frames THEN the system SHALL apply each screen's settings (device frame, composition, images, background, caption) to generate the preview
2. WHEN rendering a screen at a specific canvas size THEN the system SHALL maintain the screen's composition layout and scaling
3. WHEN a screen contains multiple images in a composition THEN the system SHALL render all images according to the composition type (single, dual, stack, triple, fan)
4. WHEN a screen has a caption enabled THEN the system SHALL render the caption with the configured text style and position
5. WHEN a screen uses a device frame THEN the system SHALL render the appropriate device frame at the target canvas size

### Requirement 4

**User Story:** As an app developer, I want to see screen names or identifiers in the preview, so that I can easily identify which screenshot is which.

#### Acceptance Criteria

1. WHEN displaying preview frames THEN the system SHALL show the screen name below or above each rendered preview
2. WHEN multiple screens exist THEN the system SHALL display them in the order they were created
3. WHEN a screen name is long THEN the system SHALL truncate or wrap the text to fit within the preview frame width

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
2. WHEN a user adds a new screen THEN the system SHALL include that screen in all device category previews
3. WHEN a user deletes a screen THEN the system SHALL remove that screen from all device category previews
4. WHEN rendering preview frames THEN the system SHALL use the same rendering logic as the export functionality to ensure accuracy

### Requirement 7

**User Story:** As an app developer, I want to see the exact dimensions for each canvas size in the preview, so that I know which store requirements each preview satisfies.

#### Acceptance Criteria

1. WHEN displaying a device category section THEN the system SHALL show the canvas dimensions in pixels (e.g., "1242 × 2688")
2. WHEN displaying canvas dimensions THEN the system SHALL indicate the orientation (portrait or landscape)
3. WHEN a canvas size corresponds to specific devices THEN the system SHALL optionally display the device names (e.g., "iPhone 14 Pro Max, iPhone 13 Pro Max")

### Requirement 8

**User Story:** As an app developer, I want the preview frames to be appropriately scaled for viewing, so that I can see all previews without excessive scrolling while maintaining visual clarity.

#### Acceptance Criteria

1. WHEN rendering preview frames THEN the system SHALL scale them proportionally to fit within a reasonable viewport size
2. WHEN multiple preview frames are displayed in a row THEN the system SHALL ensure consistent scaling across all frames in that row
3. WHEN the viewport width changes THEN the system SHALL adjust the preview frame scaling to maintain optimal layout
4. WHEN preview frames are scaled THEN the system SHALL maintain the aspect ratio of the original canvas size

### Requirement 9

**User Story:** As an app developer, I want the system to use the official default canvas sizes for each platform, so that my screenshots meet store submission requirements without manual configuration.

#### Acceptance Criteria

1. WHEN rendering Apple App Store iPhone 6.9" previews THEN the system SHALL use canvas size 1320×2868 (portrait) or 2868×1320 (landscape)
2. WHEN rendering Apple App Store iPhone 6.5" previews THEN the system SHALL use canvas size 1284×2778 (portrait) or 2778×1284 (landscape)
3. WHEN rendering Apple App Store iPhone 6.3" previews THEN the system SHALL use canvas size 1206×2622 (portrait) or 2622×1206 (landscape)
4. WHEN rendering Apple App Store iPhone 6.1" previews THEN the system SHALL use canvas size 1179×2556 (portrait) or 2556×1179 (landscape)
5. WHEN rendering Apple App Store iPhone 5.5" previews THEN the system SHALL use canvas size 1242×2208 (portrait) or 2208×1242 (landscape)
6. WHEN rendering Apple App Store iPhone 4.7" previews THEN the system SHALL use canvas size 750×1334 (portrait) or 1334×750 (landscape)
7. WHEN rendering Apple App Store iPhone 4" previews THEN the system SHALL use canvas size 640×1136 (portrait) or 1136×640 (landscape)
8. WHEN rendering Apple App Store iPhone 3.5" previews THEN the system SHALL use canvas size 640×960 (portrait) or 960×640 (landscape)
9. WHEN rendering Apple App Store iPad 13" previews THEN the system SHALL use canvas size 2064×2752 (portrait) or 2752×2064 (landscape)
10. WHEN rendering Apple App Store iPad 11" previews THEN the system SHALL use canvas size 1668×2388 (portrait) or 2388×1668 (landscape)
11. WHEN rendering Apple App Store iPad Pro 12.9" 2nd Gen previews THEN the system SHALL use canvas size 2048×2732 (portrait) or 2732×2048 (landscape)
12. WHEN rendering Apple App Store iPad 10.5" previews THEN the system SHALL use canvas size 1668×2224 (portrait) or 2224×1668 (landscape)
13. WHEN rendering Apple App Store iPad 9.7" previews THEN the system SHALL use canvas size 1536×2048 (portrait) or 2048×1536 (landscape)
14. WHEN rendering Apple App Store Apple Watch Ultra 3 previews THEN the system SHALL use canvas size 422×514 or 410×502
15. WHEN rendering Apple App Store Apple Watch Series 11 previews THEN the system SHALL use canvas size 416×496
16. WHEN rendering Apple App Store Apple Watch Series 9 previews THEN the system SHALL use canvas size 396×484
17. WHEN rendering Apple App Store Apple Watch Series 6 previews THEN the system SHALL use canvas size 368×448
18. WHEN rendering Apple App Store Apple Watch Series 3 previews THEN the system SHALL use canvas size 312×390
19. WHEN rendering Google Play Store Phone previews THEN the system SHALL use canvas size 1080×1920 (portrait, 9:16 aspect ratio, within 320-3840px range)
20. WHEN rendering Google Play Store 7-inch Tablet previews THEN the system SHALL use canvas size 1536×2048 (portrait, 9:16 aspect ratio, within 320-3840px range)
21. WHEN rendering Google Play Store 10-inch Tablet previews THEN the system SHALL use canvas size 2048×2732 (portrait, 9:16 aspect ratio, within 1080-7680px range)
22. WHEN rendering Google Play Store Chromebook previews THEN the system SHALL use canvas size 1920×1080 (landscape, 16:9 aspect ratio, within 1080-7680px range)
23. WHEN rendering Google Play Store Android XR previews THEN the system SHALL use canvas size 1920×1080 (landscape, 16:9 aspect ratio, within 720-7680px range)
24. WHEN the system defines default canvas sizes THEN the system SHALL store these as configuration constants that can be easily updated
25. WHEN rendering previews THEN the system SHALL apply the appropriate canvas size to each screen's settings before rendering


### Requirement 10

**User Story:** As an app developer, I want to see the submission requirements for each device category, so that I know how many screenshots are required and what the file constraints are.

#### Acceptance Criteria

1. WHEN displaying a Google Play Store Phone category THEN the system SHALL show "2-8 screenshots required, PNG or JPEG, up to 8 MB each, 16:9 or 9:16 aspect ratio"
2. WHEN displaying a Google Play Store 7-inch Tablet category THEN the system SHALL show "Up to 8 screenshots, PNG or JPEG, up to 8 MB each, 16:9 or 9:16 aspect ratio"
3. WHEN displaying a Google Play Store 10-inch Tablet category THEN the system SHALL show "Up to 8 screenshots, PNG or JPEG, up to 8 MB each, 16:9 or 9:16 aspect ratio"
4. WHEN displaying a Google Play Store Chromebook category THEN the system SHALL show "4-8 screenshots, PNG or JPEG, up to 8 MB each, 16:9 or 9:16 aspect ratio"
5. WHEN displaying a Google Play Store Android XR category THEN the system SHALL show "4-8 screenshots, PNG or JPEG, up to 15 MB each, 16:9 or 9:16 aspect ratio"
6. WHEN displaying an Apple App Store category THEN the system SHALL show "Up to 10 screenshots, PNG or JPEG format"
7. WHEN displaying submission requirements THEN the system SHALL present them in a clear, readable format near the device category heading

### Requirement 11

**User Story:** As an app developer, I want to optionally view all iPhone, iPad, and Apple Watch display sizes, so that I can verify my screenshots work across legacy devices without being overwhelmed by default.

#### Acceptance Criteria

1. WHEN viewing the Apple App Store iPhone section THEN the system SHALL default to showing only the largest iPhone display size (6.9")
2. WHEN viewing the Apple App Store iPad section THEN the system SHALL default to showing only the largest iPad display size (13")
3. WHEN viewing the Apple App Store Apple Watch section THEN the system SHALL default to showing only the largest Apple Watch display size (Ultra 3)
4. WHEN the iPhone, iPad, or Apple Watch section is collapsed THEN the system SHALL display a control to expand and show all sizes
5. WHEN a user expands the iPhone section THEN the system SHALL display all iPhone display sizes (6.9", 6.5", 6.3", 6.1", 5.5", 4.7", 4", 3.5")
6. WHEN a user expands the iPad section THEN the system SHALL display all iPad display sizes (13", 11", 12.9" 2nd Gen, 10.5", 9.7")
7. WHEN a user expands the Apple Watch section THEN the system SHALL display all Apple Watch display sizes (Ultra 3, Series 11, Series 9, Series 6, Series 3)
8. WHEN a user collapses the iPhone, iPad, or Apple Watch section THEN the system SHALL hide all sizes except the largest
9. WHEN the iPhone, iPad, or Apple Watch section is expanded or collapsed THEN the system SHALL preserve this state during the session

### Requirement 12

**User Story:** As a system maintainer, I want canvas size definitions to be centralized and maintainable, so that I can easily update them when store requirements change.

#### Acceptance Criteria

1. WHEN defining canvas sizes THEN the system SHALL store them in a centralized configuration file or constant
2. WHEN a canvas size definition includes metadata THEN the system SHALL store the device category name, dimensions, orientation, and platform
3. WHEN store requirements change THEN the system SHALL allow updates to canvas sizes without modifying component logic
4. WHEN adding new device categories THEN the system SHALL support extending the canvas size configuration
5. WHEN the system references canvas sizes THEN the system SHALL use the centralized configuration as the single source of truth
