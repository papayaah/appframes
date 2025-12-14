# Store Preview Renderer Design Document

## Overview

The Store Preview Renderer is a new view that displays all screenshots organized by canvas size, allowing users to review their entire screenshot portfolio in one place. Since the application organizes screens by canvas size (where each canvas size maintains its own independent set of screens), this preview shows users which canvas sizes they've created content for and provides a comprehensive overview of their work.

The preview will be implemented as a new route/page that users can navigate to from the main editor. It will read from the existing `screensByCanvasSize` data structure in FramesContext and render each screen using the same rendering logic as the export functionality to ensure accuracy.

## Architecture

### Component Hierarchy

```
StorePreviewPage (new route)
└── StorePreviewRenderer (main component)
    ├── PlatformSection (Apple/Google grouping)
    │   └── CanvasSizeGroup (per canvas size)
    │       ├── CanvasSizeHeader (metadata + edit button)
    │       └── PreviewGrid (screen previews)
    │           └── PreviewFrame (individual screen preview)
    │               └── CompositionRenderer (reused from export)
    └── EmptyState (when no screens exist)
```

### Data Flow

1. StorePreviewRenderer accesses `screensByCanvasSize` from FramesContext
2. Filters out canvas sizes with empty screen arrays
3. Groups remaining canvas sizes by platform (Apple vs Google)
4. Sorts canvas sizes within each platform group
5. For each canvas size, renders all screens using CompositionRenderer
6. Provides navigation back to editor with canvas size switching

### Navigation

- Add a "Preview" button/link in the Header component
- Create a new route at `/preview` using Next.js App Router
- Preview page will have a "Back to Editor" button
- Canvas size groups will have "Edit" buttons that navigate back to editor and switch to that canvas size

## Components and Interfaces

### StorePreviewPage Component

**Location:** `app/preview/page.tsx`

**Purpose:** Next.js page component that wraps the StorePreviewRenderer

**Props:** None (uses FramesContext)

**Responsibilities:**
- Provide page layout and metadata
- Wrap StorePreviewRenderer with necessary providers (already provided by root layout)

### StorePreviewRenderer Component

**Location:** `components/AppFrames/StorePreviewRenderer.tsx`

**Purpose:** Main component that orchestrates the preview display

**Props:** None (uses FramesContext)

**State:**
- None (reads from FramesContext)

**Responsibilities:**
- Access screensByCanvasSize from FramesContext
- Filter canvas sizes with screens
- Group canvas sizes by platform
- Render platform sections
- Handle empty state

**Key Methods:**
```typescript
// Group canvas sizes by platform
const groupCanvasSizesByPlatform = (
  screensByCanvasSize: Record<string, Screen[]>
): { apple: string[]; google: string[] }

// Sort canvas sizes within a platform
const sortCanvasSizes = (canvasSizes: string[]): string[]

// Determine platform from canvas size ID
const getPlatform = (canvasSize: string): 'apple' | 'google'
```

### PlatformSection Component

**Location:** `components/AppFrames/PlatformSection.tsx`

**Purpose:** Renders a platform group (Apple or Google) with its canvas sizes

**Props:**
```typescript
interface PlatformSectionProps {
  platform: 'apple' | 'google';
  canvasSizes: string[];
  screensByCanvasSize: Record<string, Screen[]>;
}
```

**Responsibilities:**
- Render platform header ("Apple App Store" or "Google Play Store")
- Render CanvasSizeGroup for each canvas size
- Provide visual separation between platforms

### CanvasSizeGroup Component

**Location:** `components/AppFrames/CanvasSizeGroup.tsx`

**Purpose:** Renders all screens for a specific canvas size

**Props:**
```typescript
interface CanvasSizeGroupProps {
  canvasSize: string;
  screens: Screen[];
  onEdit: (canvasSize: string) => void;
}
```

**Responsibilities:**
- Render CanvasSizeHeader with metadata
- Render PreviewGrid with all screens
- Handle edit button click

### CanvasSizeHeader Component

**Location:** `components/AppFrames/CanvasSizeHeader.tsx`

**Purpose:** Displays canvas size metadata and controls

**Props:**
```typescript
interface CanvasSizeHeaderProps {
  canvasSize: string;
  screenCount: number;
  onEdit: () => void;
}
```

**Responsibilities:**
- Display canvas size label using getCanvasSizeLabel()
- Display dimensions using getCanvasDimensions()
- Display screen count
- Render "Edit" button
- Optionally display device names

### PreviewGrid Component

**Location:** `components/AppFrames/PreviewGrid.tsx`

**Purpose:** Responsive grid layout for preview frames

**Props:**
```typescript
interface PreviewGridProps {
  screens: Screen[];
  canvasSize: string;
}
```

**Responsibilities:**
- Create responsive grid layout
- Calculate appropriate scaling for preview frames
- Render PreviewFrame for each screen
- Maintain consistent scaling within the group

### PreviewFrame Component

**Location:** `components/AppFrames/PreviewFrame.tsx`

**Purpose:** Renders a single screen preview with its name

**Props:**
```typescript
interface PreviewFrameProps {
  screen: Screen;
  scale: number;
  canvasSize: string;
}
```

**Responsibilities:**
- Render screen name
- Render CompositionRenderer with screen settings
- Apply scaling transformation
- Maintain aspect ratio

### Navigation Updates

**Header Component Updates:**
- Add "Preview" button/link that navigates to `/preview`
- Position near the Export button

**Preview Navigation:**
- Add "Back to Editor" button in preview page
- Use Next.js router for navigation

## Data Models

### Existing Types (from types.ts)

All existing types remain unchanged:
- `Screen`
- `ScreenImage`
- `CanvasSettings`
- `TextStyle`

### New Types

```typescript
// Platform grouping
type Platform = 'apple' | 'google';

// Canvas size metadata
interface CanvasSizeMetadata {
  id: string;
  label: string;
  dimensions: { width: number; height: number };
  platform: Platform;
  deviceNames?: string[];
}

// Grouped canvas sizes
interface GroupedCanvasSizes {
  apple: string[];
  google: string[];
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, let me analyze each acceptance criterion for testability:

### Acceptance Criteria Testing Prework

**1.1** WHEN a user navigates to the preview page THEN the system SHALL display all canvas sizes that have at least one screen
- Thoughts: This is a rule about filtering - for any screensByCanvasSize object, the preview should only show canvas sizes where the screen array length > 0. We can generate random screensByCanvasSize objects and verify the filtering logic.
- Testable: yes - property

**1.2** WHEN a canvas size has no screens THEN the system SHALL NOT display that canvas size in the preview
- Thoughts: This is the inverse of 1.1 - it's testing the same filtering logic. This is redundant with 1.1.
- Testable: redundant with 1.1

**1.3** WHEN displaying canvas sizes THEN the system SHALL group them by platform (Apple App Store and Google Play Store)
- Thoughts: This is about grouping logic - for any set of canvas size IDs, they should be correctly grouped by platform based on their prefix. We can generate random canvas size IDs and verify grouping.
- Testable: yes - property

**1.4** WHEN multiple canvas sizes exist for a platform THEN the system SHALL display them in a logical order (largest to smallest display size)
- Thoughts: This is about sorting logic - for any set of canvas sizes within a platform, they should be sorted correctly. We can generate random canvas size arrays and verify sorting.
- Testable: yes - property

**1.5** WHEN no screens exist in any canvas size THEN the system SHALL display an empty state message prompting users to create screenshots
- Thoughts: This is testing a specific case - when screensByCanvasSize is empty or all arrays are empty. This is an edge case.
- Testable: edge case

**2.1** WHEN displaying a canvas size group THEN the system SHALL show the canvas size label
- Thoughts: This is about rendering - for any canvas size ID, the label should be present in the rendered output. We can test that getCanvasSizeLabel is called and its result is rendered.
- Testable: yes - property

**2.2** WHEN displaying a canvas size group THEN the system SHALL show the exact dimensions in pixels
- Thoughts: This is about rendering dimensions - for any canvas size ID, the dimensions should be present. We can test that getCanvasDimensions is called and rendered.
- Testable: yes - property

**2.3** WHEN displaying a canvas size group THEN the system SHALL indicate the platform
- Thoughts: This is about platform indication - for any canvas size, the platform should be determinable and displayed. This is covered by the grouping in 1.3.
- Testable: redundant with 1.3

**2.4** WHEN displaying canvas size groups THEN the system SHALL visually separate different platforms with section headers or dividers
- Thoughts: This is a UI design requirement about visual separation. We can test that platform headers are rendered.
- Testable: yes - example

**2.5** WHEN a canvas size corresponds to specific devices THEN the system SHALL optionally display device names
- Thoughts: This is optional functionality. If implemented, we could test it, but "optionally" makes it not a hard requirement.
- Testable: no

**3.1** WHEN displaying a canvas size group THEN the system SHALL render all screens that belong to that canvas size
- Thoughts: For any canvas size with N screens, the preview should render N preview frames. We can generate random screen arrays and verify the count.
- Testable: yes - property

**3.2** WHEN rendering a screen THEN the system SHALL apply the screen's settings
- Thoughts: This is about using CompositionRenderer correctly. We can test that the renderer is called with the correct settings.
- Testable: yes - property

**3.3** WHEN a screen contains multiple images in a composition THEN the system SHALL render all images according to the composition type
- Thoughts: This is testing CompositionRenderer behavior, which should already be tested. This is about integration.
- Testable: no (tested in CompositionRenderer)

**3.4** WHEN a screen has a caption enabled THEN the system SHALL render the caption
- Thoughts: This is testing CompositionRenderer behavior, which should already be tested.
- Testable: no (tested in CompositionRenderer)

**3.5** WHEN a screen uses a device frame THEN the system SHALL render the appropriate device frame
- Thoughts: This is testing CompositionRenderer behavior, which should already be tested.
- Testable: no (tested in CompositionRenderer)

**3.6** WHEN rendering preview frames THEN the system SHALL use the same rendering logic as the export functionality
- Thoughts: This is an architectural requirement - we should use CompositionRenderer. This is verified by code review, not testing.
- Testable: no

**4.1** WHEN displaying preview frames THEN the system SHALL show the screen name
- Thoughts: For any screen, the screen name should be rendered. We can test that screen.name appears in the output.
- Testable: yes - property

**4.2** WHEN displaying screens within a canvas size group THEN the system SHALL display them in the order they appear in the screensByCanvasSize array
- Thoughts: For any array of screens, the preview order should match the array order. We can test that the rendering preserves order.
- Testable: yes - property

**4.3** WHEN a screen name is long THEN the system SHALL truncate or wrap the text
- Thoughts: This is a UI behavior for long text. This is an edge case we should handle.
- Testable: edge case

**4.4** WHEN displaying multiple screens THEN the system SHALL show a count indicator
- Thoughts: For any canvas size with N screens, the count should show N. We can test this.
- Testable: yes - property

**5.1-5.4** Navigation requirements
- Thoughts: These are about navigation behavior and state preservation. These are integration tests, not unit properties.
- Testable: no (integration tests)

**6.1-6.5** Preview accuracy requirements
- Thoughts: These are about React state updates and re-rendering. These are integration tests.
- Testable: no (integration tests)

**7.1-7.5** Navigation to editor requirements
- Thoughts: These are about navigation and state management. These are integration tests.
- Testable: no (integration tests)

**8.1-8.5** Scaling requirements
- Thoughts: These are about responsive layout and scaling calculations. We can test the scaling calculation logic.
- Testable: yes - property

**9.1-9.5** Data access requirements
- Thoughts: These are about using FramesContext correctly. This is verified by code review and integration tests.
- Testable: no (integration tests)

**10.1-10.5** Metadata requirements
- Thoughts: These are about using helper functions correctly. We can test that the helper functions are called.
- Testable: yes - property

### Property Reflection

After reviewing all testable properties, let me identify redundancies:

- **1.1 and 1.2** are redundant - both test the same filtering logic (show only non-empty canvas sizes)
- **1.3 and 2.3** overlap - platform grouping and platform indication are the same concept
- **3.2 covers the general case** of applying settings, while 3.3-3.5 are specific cases already tested in CompositionRenderer

**Consolidated Properties:**

1. **Canvas size filtering** (1.1) - covers both showing non-empty and hiding empty
2. **Platform grouping** (1.3) - covers both grouping and platform indication
3. **Canvas size sorting** (1.4)
4. **Screen count rendering** (3.1)
5. **Settings application** (3.2)
6. **Screen name rendering** (4.1)
7. **Screen order preservation** (4.2)
8. **Count indicator accuracy** (4.4)
9. **Scaling calculation** (8.1-8.5 combined)
10. **Metadata display** (10.1-10.2 combined)

Now I'll write the actual correctness properties:

### Property 1: Canvas size filtering
*For any* screensByCanvasSize object, the preview should only display canvas sizes where the screen array has at least one element, and should not display canvas sizes with empty arrays.
**Validates: Requirements 1.1, 1.2**

### Property 2: Platform grouping
*For any* set of canvas size IDs, they should be correctly grouped into Apple (iphone/ipad/watch prefix) and Google (google prefix) platforms.
**Validates: Requirements 1.3, 2.3**

### Property 3: Canvas size sorting
*For any* set of canvas sizes within a platform, they should be sorted in a consistent order (largest to smallest display size based on dimensions).
**Validates: Requirements 1.4**

### Property 4: Screen count rendering
*For any* canvas size with N screens, the preview should render exactly N preview frames for that canvas size.
**Validates: Requirements 3.1**

### Property 5: Settings application
*For any* screen, when rendering its preview, the system should pass the screen's settings object to the CompositionRenderer component.
**Validates: Requirements 3.2**

### Property 6: Screen name rendering
*For any* screen, the screen's name property should appear in the rendered preview frame output.
**Validates: Requirements 4.1**

### Property 7: Screen order preservation
*For any* array of screens for a canvas size, the preview frames should be rendered in the same order as the array.
**Validates: Requirements 4.2**

### Property 8: Count indicator accuracy
*For any* canvas size with N screens, the count indicator should display the number N.
**Validates: Requirements 4.4**

### Property 9: Scaling calculation
*For any* canvas size dimensions and viewport size, the calculated scale factor should maintain the aspect ratio and fit within the viewport constraints.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 10: Metadata display
*For any* canvas size ID, the preview should display both the human-readable label (from getCanvasSizeLabel) and the pixel dimensions (from getCanvasDimensions).
**Validates: Requirements 10.1, 10.2**

## Error Handling

### Data Validation

**Missing or Invalid Data:**
- If screensByCanvasSize is undefined or null, treat as empty object
- If a canvas size key exists but screen array is undefined, treat as empty array
- If a screen object is malformed, skip rendering that screen and log error

**Helper Function Failures:**
- If getCanvasSizeLabel returns undefined, use the canvas size ID as fallback
- If getCanvasDimensions returns undefined, use default dimensions or hide dimensions
- If getPlatform cannot determine platform, default to 'apple' or skip that canvas size

### Rendering Errors

**CompositionRenderer Failures:**
- Wrap each PreviewFrame in an error boundary
- Display error placeholder if rendering fails
- Log error details for debugging
- Continue rendering other screens

**Image Loading Failures:**
- CompositionRenderer already handles image loading errors
- Preview should inherit this error handling
- Display placeholder or error state for failed images

### Navigation Errors

**Router Failures:**
- Catch navigation errors and display notification
- Provide fallback navigation using window.location if router fails
- Log errors for debugging

**State Preservation Failures:**
- If canvas size switch fails, stay on current canvas size
- Display error notification to user
- Preserve as much state as possible

## Testing Strategy

### Unit Testing

The testing strategy will use both unit tests and property-based tests to ensure comprehensive coverage.

**Unit Tests:**
- Test helper functions (groupCanvasSizesByPlatform, sortCanvasSizes, getPlatform)
- Test component rendering with specific example data
- Test empty state rendering
- Test navigation button clicks
- Test error boundary behavior

**Example Unit Tests:**
```typescript
describe('StorePreviewRenderer', () => {
  it('should render empty state when no screens exist', () => {
    // Test with empty screensByCanvasSize
  });

  it('should render platform headers for Apple and Google', () => {
    // Test with screens in both platforms
  });

  it('should handle navigation to editor', () => {
    // Test edit button click
  });
});

describe('Helper Functions', () => {
  it('should group iPhone canvas sizes under Apple', () => {
    // Test getPlatform with 'iphone-6.5'
  });

  it('should sort canvas sizes by dimensions', () => {
    // Test sortCanvasSizes with known order
  });
});
```

### Property-Based Testing

**Property-Based Testing Library:** We will use **fast-check** for TypeScript/React property-based testing.

**Configuration:** Each property-based test should run a minimum of 100 iterations.

**Property Test Tagging:** Each property-based test must include a comment with this format:
`// Feature: store-preview-renderer, Property {number}: {property_text}`

**Property Tests:**

1. **Property 1: Canvas size filtering**
   - Generate random screensByCanvasSize objects with varying empty/non-empty arrays
   - Verify only non-empty canvas sizes appear in filtered result
   - Tag: `// Feature: store-preview-renderer, Property 1: Canvas size filtering`

2. **Property 2: Platform grouping**
   - Generate random canvas size IDs with different prefixes
   - Verify correct grouping into apple/google platforms
   - Tag: `// Feature: store-preview-renderer, Property 2: Platform grouping`

3. **Property 3: Canvas size sorting**
   - Generate random arrays of canvas size IDs
   - Verify sorted order matches expected dimension-based order
   - Tag: `// Feature: store-preview-renderer, Property 3: Canvas size sorting`

4. **Property 4: Screen count rendering**
   - Generate random screen arrays of varying lengths
   - Verify rendered preview frame count matches array length
   - Tag: `// Feature: store-preview-renderer, Property 4: Screen count rendering`

5. **Property 5: Settings application**
   - Generate random screen objects with different settings
   - Verify CompositionRenderer receives correct settings prop
   - Tag: `// Feature: store-preview-renderer, Property 5: Settings application`

6. **Property 6: Screen name rendering**
   - Generate random screen objects with different names
   - Verify screen name appears in rendered output
   - Tag: `// Feature: store-preview-renderer, Property 6: Screen name rendering`

7. **Property 7: Screen order preservation**
   - Generate random screen arrays
   - Verify preview frames appear in same order as input array
   - Tag: `// Feature: store-preview-renderer, Property 7: Screen order preservation`

8. **Property 8: Count indicator accuracy**
   - Generate random screen arrays of varying lengths
   - Verify count indicator displays correct number
   - Tag: `// Feature: store-preview-renderer, Property 8: Count indicator accuracy`

9. **Property 9: Scaling calculation**
   - Generate random canvas dimensions and viewport sizes
   - Verify scale factor maintains aspect ratio and fits viewport
   - Tag: `// Feature: store-preview-renderer, Property 9: Scaling calculation`

10. **Property 10: Metadata display**
    - Generate random canvas size IDs
    - Verify both label and dimensions are rendered
    - Tag: `// Feature: store-preview-renderer, Property 10: Metadata display`

### Integration Testing

**Navigation Flow:**
- Test navigation from editor to preview
- Test navigation from preview back to editor
- Test canvas size switching when clicking edit button
- Verify state preservation across navigation

**Data Synchronization:**
- Test that preview updates when screens are added/modified/deleted
- Test that preview reflects current screensByCanvasSize state
- Test real-time updates (if applicable)

**End-to-End Scenarios:**
- Create screens in multiple canvas sizes, verify preview shows all
- Delete all screens from a canvas size, verify it disappears from preview
- Switch canvas sizes in editor, create screens, verify preview updates
- Navigate to preview, click edit, verify correct canvas size loads in editor

### Visual Regression Testing

**Snapshot Tests:**
- Capture snapshots of preview with various screen configurations
- Test different platform combinations (Apple only, Google only, both)
- Test different screen counts (1, 3, 10 screens per canvas size)
- Test empty state
- Test responsive layouts at different viewport sizes

**Manual Testing:**
- Verify visual appearance matches design
- Test responsive behavior across different screen sizes
- Verify scaling looks correct for all canvas sizes
- Check that device frames render correctly
- Verify captions and compositions display properly

