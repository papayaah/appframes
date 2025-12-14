# Enhanced Export Design Document

## Overview

The Enhanced Export feature extends the Store Preview Renderer by adding comprehensive export capabilities directly within the preview interface. This design moves export functionality from the main editor (AppFrames component) to the preview, providing users with a centralized location to review and export their screenshots with flexible options.

The export system will support multiple formats (PNG/JPG), canvas size filtering, quality settings, and both single-file and ZIP archive downloads. The implementation will reuse the existing CompositionRenderer component to ensure exported screenshots match the preview appearance exactly.

## Architecture

### Component Hierarchy

```
StorePreviewRenderer (updated)
├── ExportButton (new - triggers export modal)
├── QuickExportButton (new - one-click export all)
├── ExportModal (new - export configuration dialog)
│   ├── FormatSelector (format: PNG/JPG)
│   ├── QualitySlider (JPG quality: 0-100)
│   ├── CanvasSizeSelector (multi-select canvas sizes)
│   ├── ExportPreview (screen count, estimated size)
│   ├── WatermarkNotice (free user notice + upgrade CTA)
│   └── ExportActions (Cancel/Export buttons)
├── ExportProgress (new - progress indicator)
└── CanvasSizeGroup (updated)
    └── QuickExportCanvasSizeButton (new - export single canvas size)
```

### Data Flow

1. User clicks Export button in StorePreviewRenderer
2. ExportModal opens with all canvas sizes selected by default
3. User configures format, quality, and canvas size selections
4. User clicks Export button
5. ExportService processes each selected screen:
   - Renders screen using CompositionRenderer
   - Converts to image format (PNG/JPG)
   - Adds to export collection
6. If single screen: downloads directly
7. If multiple screens: creates ZIP archive with folder structure
8. Downloads file(s) to user's device

### Export Service Architecture

The export logic will be extracted into a reusable service:

```typescript
class ExportService {
  // Export single screen
  async exportScreen(screen: Screen, format: 'png' | 'jpg', quality?: number): Promise<Blob>
  
  // Export multiple screens to ZIP
  async exportScreensToZip(
    screensByCanvasSize: Record<string, Screen[]>,
    selectedCanvasSizes: string[],
    format: 'png' | 'jpg',
    quality?: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob>
  
  // Render screen to image
  private async renderScreenToImage(screen: Screen, format: 'png' | 'jpg', quality?: number): Promise<Blob>
  
  // Calculate estimated file size
  estimateExportSize(screenCount: number, format: 'png' | 'jpg', quality?: number): string
}
```

## Components and Interfaces

### ExportButton Component

**Location:** `components/AppFrames/ExportButton.tsx`

**Purpose:** Primary button to open export modal

**Props:**
```typescript
interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

**Responsibilities:**
- Render prominent "Export" button
- Handle click to open export modal
- Show disabled state when no screens exist

### QuickExportButton Component

**Location:** `components/AppFrames/QuickExportButton.tsx`

**Purpose:** One-click export all screens as PNG

**Props:**
```typescript
interface QuickExportButtonProps {
  screensByCanvasSize: Record<string, Screen[]>;
  onExportStart: () => void;
  onExportComplete: () => void;
  onExportError: (error: Error) => void;
}
```

**Responsibilities:**
- Render "Quick Export All" button
- Export all screens as PNG without showing modal
- Show loading state during export
- Display success/error notifications

### ExportModal Component

**Location:** `components/AppFrames/ExportModal.tsx`

**Purpose:** Main export configuration dialog

**Props:**
```typescript
interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  screensByCanvasSize: Record<string, Screen[]>;
  onExport: (options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  format: 'png' | 'jpg';
  quality: number; // 0-100, only for JPG
  selectedCanvasSizes: string[];
}
```

**State:**
```typescript
const [format, setFormat] = useState<'png' | 'jpg'>('png');
const [quality, setQuality] = useState(90);
const [selectedCanvasSizes, setSelectedCanvasSizes] = useState<string[]>([]);
const [isExporting, setIsExporting] = useState(false);
const [progress, setProgress] = useState({ current: 0, total: 0 });
```

**Responsibilities:**
- Display export configuration options
- Manage export option state
- Calculate total screens to export
- Estimate file size
- Validate selections
- Trigger export operation
- Show progress during export
- Handle export completion/errors

### FormatSelector Component

**Location:** `components/AppFrames/FormatSelector.tsx`

**Purpose:** Radio group for format selection

**Props:**
```typescript
interface FormatSelectorProps {
  value: 'png' | 'jpg';
  onChange: (format: 'png' | 'jpg') => void;
}
```

**Responsibilities:**
- Render PNG/JPG radio options
- Display format descriptions
- Handle format selection

### QualitySlider Component

**Location:** `components/AppFrames/QualitySlider.tsx`

**Purpose:** Slider for JPG quality adjustment

**Props:**
```typescript
interface QualitySliderProps {
  value: number;
  onChange: (quality: number) => void;
  disabled: boolean; // Disabled when PNG is selected
}
```

**Responsibilities:**
- Render quality slider (0-100)
- Show current quality value
- Disable when PNG format selected
- Provide quality guidance (e.g., "90 = High Quality")

### CanvasSizeSelector Component

**Location:** `components/AppFrames/CanvasSizeSelector.tsx`

**Purpose:** Multi-select list for canvas sizes

**Props:**
```typescript
interface CanvasSizeSelectorProps {
  screensByCanvasSize: Record<string, Screen[]>;
  selectedCanvasSizes: string[];
  onSelectionChange: (selected: string[]) => void;
}
```

**Responsibilities:**
- Display all canvas sizes with screens
- Show canvas size label, dimensions, screen count
- Render checkboxes for selection
- Handle select/deselect
- Provide "Select All" / "Deselect All" buttons
- Group by platform (Apple/Google)

### ExportPreview Component

**Location:** `components/AppFrames/ExportPreview.tsx`

**Purpose:** Display export summary

**Props:**
```typescript
interface ExportPreviewProps {
  totalScreens: number;
  estimatedSize: string;
  format: 'png' | 'jpg';
  selectedCanvasSizes: string[];
}
```

**Responsibilities:**
- Show total screens to export
- Show estimated file size
- Show selected canvas sizes summary
- Update in real-time as options change

### WatermarkNotice Component

**Location:** `components/AppFrames/WatermarkNotice.tsx`

**Purpose:** Display watermark notice for free users

**Props:**
```typescript
interface WatermarkNoticeProps {
  isPro: boolean;
  onUpgrade?: () => void;
}
```

**Responsibilities:**
- Show notice that exports will include watermark (free users only)
- Display watermark preview/example
- Render "Upgrade to Pro" button
- Hide completely for pro users
- Style with Mantine Alert component

### ExportProgress Component

**Location:** `components/AppFrames/ExportProgress.tsx`

**Purpose:** Progress indicator during export

**Props:**
```typescript
interface ExportProgressProps {
  current: number;
  total: number;
  currentScreenName?: string;
  onCancel: () => void;
}
```

**Responsibilities:**
- Show progress bar
- Display "Processing X of Y"
- Show current screen name
- Render cancel button
- Handle cancellation

### QuickExportCanvasSizeButton Component

**Location:** `components/AppFrames/QuickExportCanvasSizeButton.tsx`

**Purpose:** Quick export button for individual canvas size

**Props:**
```typescript
interface QuickExportCanvasSizeButtonProps {
  canvasSize: string;
  screens: Screen[];
  onExportStart: () => void;
  onExportComplete: () => void;
  onExportError: (error: Error) => void;
}
```

**Responsibilities:**
- Render "Export" button in canvas size header
- Export all screens from that canvas size as PNG
- Show loading state
- Display notifications

### ExportService

**Location:** `lib/ExportService.ts`

**Purpose:** Core export logic and utilities

**Methods:**

```typescript
class ExportService {
  /**
   * Export a single screen to image blob
   */
  async exportScreen(
    screen: Screen,
    canvasSize: string,
    format: 'png' | 'jpg',
    quality: number = 90
  ): Promise<Blob> {
    // 1. Create temporary container element
    // 2. Render CompositionRenderer with screen settings
    // 3. Convert to image using html-to-image
    // 4. Return blob
  }

  /**
   * Export multiple screens to ZIP archive
   */
  async exportScreensToZip(
    screensByCanvasSize: Record<string, Screen[]>,
    selectedCanvasSizes: string[],
    format: 'png' | 'jpg',
    quality: number = 90,
    onProgress?: (current: number, total: number, screenName: string) => void,
    cancelToken?: { cancelled: boolean }
  ): Promise<Blob> {
    // 1. Initialize JSZip
    // 2. Calculate total screens
    // 3. For each selected canvas size:
    //    - Create folder in ZIP
    //    - For each screen:
    //      - Check cancellation
    //      - Export screen to blob
    //      - Add to ZIP with filename
    //      - Call onProgress
    // 4. Generate ZIP blob
    // 5. Return blob
  }

  /**
   * Render screen to image blob
   */
  private async renderScreenToImage(
    screen: Screen,
    canvasSize: string,
    format: 'png' | 'jpg',
    quality: number
  ): Promise<Blob> {
    // 1. Create off-screen container
    // 2. Render CompositionRenderer
    // 3. Wait for images to load
    // 4. Add watermark if user is free (call addWatermark)
    // 5. Use html-to-image (toPng or toJpeg)
    // 6. Convert to blob
    // 7. Clean up container
    // 8. Return blob
  }

  /**
   * Estimate total export size
   */
  estimateExportSize(
    screenCount: number,
    canvasSize: string,
    format: 'png' | 'jpg',
    quality: number = 90
  ): string {
    // Rough estimation based on format and dimensions
    // PNG: ~2-4 MB per screen (depending on canvas size)
    // JPG: ~0.5-2 MB per screen (depending on quality and canvas size)
  }

  /**
   * Generate filename for export
   */
  generateFilename(
    screen: Screen,
    index: number,
    format: 'png' | 'jpg'
  ): string {
    // Format: "01-screen-name.png"
    const paddedIndex = String(index + 1).padStart(2, '0');
    const sanitizedName = screen.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${paddedIndex}-${sanitizedName}.${format}`;
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Add watermark to rendered element (for free users)
   */
  private addWatermark(container: HTMLElement, isPro: boolean): void {
    if (isPro) return; // Skip watermark for pro users
    
    // Create watermark element
    const watermark = document.createElement('div');
    watermark.textContent = 'Made with AppFrames';
    watermark.style.position = 'absolute';
    watermark.style.bottom = '12px';
    watermark.style.right = '12px';
    watermark.style.fontSize = '14px';
    watermark.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    watermark.style.color = '#000000';
    watermark.style.opacity = '0.4';
    watermark.style.fontWeight = '500';
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '9999';
    
    container.appendChild(watermark);
  }

  /**
   * Check if user is pro/paid (placeholder - implement with actual auth)
   */
  private isProUser(): boolean {
    // TODO: Implement actual pro user check
    // This could check:
    // - localStorage flag
    // - API call to check subscription status
    // - Auth context/state
    // For now, return false (all users are free)
    return false;
  }
}

export const exportService = new ExportService();
```

### Header Component Updates

**Location:** `components/AppFrames/Header.tsx`

**Changes:**
- Remove `onExport` prop
- Remove Export button (IconFileZip)
- Keep Download button (IconDownload) for current screen download
- Add "Go to Preview" button or update existing Preview button styling

## Data Models

### Existing Types (from types.ts)

All existing types remain unchanged:
- `Screen`
- `ScreenImage`
- `CanvasSettings`

### New Types

```typescript
// Export format options
type ExportFormat = 'png' | 'jpg';

// Export configuration
interface ExportOptions {
  format: ExportFormat;
  quality: number; // 0-100, only applies to JPG
  selectedCanvasSizes: string[];
}

// Export progress state
interface ExportProgress {
  current: number;
  total: number;
  currentScreenName?: string;
}

// Export result
interface ExportResult {
  success: boolean;
  filename?: string;
  error?: Error;
}

// Cancellation token
interface CancelToken {
  cancelled: boolean;
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:
- **3.4 and 3.5** test the same selection logic (include selected, exclude deselected)
- **5.1 and 5.4** both test single-file export without ZIP
- **6.2, 6.3, and 6.4** all test ZIP file structure and naming
- **4.2 and 4.3** both test estimate updates (can be combined)

The consolidated properties focus on unique validation value:

### Property 1: Modal state toggle
*For any* export button click, the modal opened state should toggle from false to true.
**Validates: Requirements 1.2**

### Property 2: PNG format export
*For any* set of screens, when PNG format is selected, all exported blobs should have MIME type 'image/png'.
**Validates: Requirements 2.2**

### Property 3: JPG format export
*For any* set of screens, when JPG format is selected, all exported blobs should have MIME type 'image/jpeg'.
**Validates: Requirements 2.3**

### Property 4: Quality state synchronization
*For any* quality slider value change, the export quality setting should equal the slider value.
**Validates: Requirements 2.5**

### Property 5: Canvas size filtering
*For any* screensByCanvasSize object, the displayed canvas size list should only include canvas sizes where the screen array length is greater than zero.
**Validates: Requirements 3.1**

### Property 6: Canvas size metadata rendering
*For any* canvas size in the selector, the rendered output should contain the canvas size label, dimensions, and screen count.
**Validates: Requirements 3.2**

### Property 7: Selection toggle
*For any* canvas size, clicking its checkbox should flip its selection state (selected to deselected or vice versa).
**Validates: Requirements 3.3**

### Property 8: Export inclusion by selection
*For any* export operation, only screens from selected canvas sizes should be included in the export, and screens from deselected canvas sizes should be excluded.
**Validates: Requirements 3.4, 3.5**

### Property 9: Screen count accuracy
*For any* selection of canvas sizes, the displayed total screen count should equal the sum of screen counts from all selected canvas sizes.
**Validates: Requirements 4.1**

### Property 10: Estimate reactivity
*For any* change to format or quality settings, the estimated file size should update to reflect the new settings.
**Validates: Requirements 4.2, 4.3**

### Property 11: Single screen direct download
*For any* export operation where exactly one screen is selected, the system should download a single image file without creating a ZIP archive.
**Validates: Requirements 5.1, 5.4**

### Property 12: Filename generation
*For any* screen export, the filename should contain the screen name and the appropriate file extension (.png or .jpg) matching the selected format.
**Validates: Requirements 5.2, 5.3**

### Property 13: Modal closure on completion
*For any* successful single-screen export, the modal opened state should change to false.
**Validates: Requirements 5.5**

### Property 14: Multi-screen ZIP creation
*For any* export operation where more than one screen is selected, the system should create a ZIP archive.
**Validates: Requirements 6.1**

### Property 15: ZIP folder structure
*For any* ZIP export, files should be organized in folders named by canvas size, with filenames following the pattern "##-screenName.ext" where ## is a zero-padded sequential number.
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 16: ZIP filename timestamp
*For any* ZIP export, the ZIP filename should include a timestamp.
**Validates: Requirements 6.5**

### Property 17: Progress screen name accuracy
*For any* screen being processed during export, the progress indicator should display that screen's name.
**Validates: Requirements 7.2**

### Property 18: Progress count accuracy
*For any* export progress state, the displayed count should accurately reflect the current screen number and total screen count.
**Validates: Requirements 7.3**

### Property 19: Settings application in export
*For any* screen export, all screen settings (device frame, composition, images, background, caption) should be applied to the rendered output.
**Validates: Requirements 8.2**

### Property 20: Export dimensions accuracy
*For any* screen export, the exported image dimensions should match the canvas size dimensions exactly.
**Validates: Requirements 8.3**

### Property 21: Pixel ratio consistency
*For any* screen export, the pixel ratio used should be 2x.
**Validates: Requirements 8.4**

### Property 22: Multi-canvas export completeness
*For any* selection of multiple canvas sizes, all screens from each selected canvas size should be included in the export.
**Validates: Requirements 9.1**

### Property 23: Screen order preservation
*For any* canvas size in an export, the screens should be exported in the same order as they appear in the screensByCanvasSize array for that canvas size.
**Validates: Requirements 9.2**

### Property 24: Canvas size processing order
*For any* set of selected canvas sizes, they should be processed in a consistent order (Apple platform canvas sizes before Google platform canvas sizes).
**Validates: Requirements 9.3**

### Property 25: Cancellation stops processing
*For any* export cancellation, no screens after the cancellation point should be processed.
**Validates: Requirements 10.2**

### Property 26: Cancellation prevents download
*For any* cancelled export, the download function should not be called.
**Validates: Requirements 10.3**

### Property 27: Cancellation modal state
*For any* cancelled export, the modal should remain open (not close).
**Validates: Requirements 10.5**

### Property 28: Quick export format and scope
*For any* Quick Export All operation, all screens from all canvas sizes should be exported as PNG format in a ZIP archive.
**Validates: Requirements 11.2**

### Property 29: Quick export modal bypass
*For any* Quick Export All operation, the export modal should not open.
**Validates: Requirements 11.3**

### Property 30: Free user watermark application
*For any* export by a free user, the exported image should contain the watermark text "Made with AppFrames".
**Validates: Requirements 12.1, 12.2**

### Property 31: Pro user watermark exclusion
*For any* export by a pro user, the exported image should not contain any watermark.
**Validates: Requirements 12.5**

### Property 32: Watermark notice visibility
*For any* free user viewing the export modal, the watermark notice should be visible.
**Validates: Requirements 12.6**

## Error Handling

### Export Rendering Errors

**Screen Rendering Failures:**
- Wrap each screen export in try-catch
- Log error details for debugging
- Skip failed screen and continue with remaining screens
- Display error notification with screen name
- Include partial export in ZIP if some screens succeed

**Image Loading Failures:**
- Set timeout for image loading (e.g., 10 seconds)
- If timeout occurs, skip that screen
- Log error with screen and image details
- Continue with remaining screens
- Notify user of skipped screens

### File System Errors

**Download Failures:**
- Catch download errors (e.g., user cancels save dialog)
- Display error notification
- Allow user to retry export
- Preserve export configuration for retry

**ZIP Creation Failures:**
- Catch JSZip errors during archive creation
- Display error message with details
- Suggest reducing number of screens or quality
- Provide option to export individually instead

### User Input Validation

**Invalid Selections:**
- Disable export button when no canvas sizes selected
- Show validation message: "Please select at least one canvas size"
- Prevent export operation from starting

**Invalid Quality Values:**
- Clamp quality slider to 0-100 range
- Validate quality value before export
- Default to 90 if invalid value detected

### Memory and Performance

**Large Export Operations:**
- Monitor memory usage during export
- Process screens sequentially to avoid memory issues
- Add small delays between screen processing (e.g., 100ms)
- Show progress to indicate system is working

**Browser Limitations:**
- Catch quota exceeded errors
- Display message about browser limitations
- Suggest exporting in smaller batches
- Provide guidance on clearing browser cache

### Cancellation Handling

**Mid-Export Cancellation:**
- Check cancellation token before each screen
- Clean up any in-progress rendering
- Release memory from processed screens
- Ensure no partial files are downloaded
- Reset export state properly

## Testing Strategy

### Unit Testing

The testing strategy will use both unit tests and property-based tests to ensure comprehensive coverage.

**Unit Tests:**
- Test ExportService methods with specific example data
- Test component rendering with mock data
- Test modal open/close behavior
- Test format selector state changes
- Test canvas size selection/deselection
- Test progress indicator updates
- Test error boundary behavior
- Test cancellation flow

**Example Unit Tests:**
```typescript
describe('ExportService', () => {
  it('should export single screen as PNG', async () => {
    const screen = createMockScreen();
    const blob = await exportService.exportScreen(screen, 'iphone-6.5', 'png');
    expect(blob.type).toBe('image/png');
  });

  it('should create ZIP for multiple screens', async () => {
    const screens = [createMockScreen(), createMockScreen()];
    const blob = await exportService.exportScreensToZip(
      { 'iphone-6.5': screens },
      ['iphone-6.5'],
      'png'
    );
    expect(blob.type).toBe('application/zip');
  });

  it('should generate correct filename', () => {
    const screen = { name: 'My Screen', id: '1' };
    const filename = exportService.generateFilename(screen, 0, 'png');
    expect(filename).toBe('01-my-screen.png');
  });
});

describe('ExportModal', () => {
  it('should open when opened prop is true', () => {
    const { getByRole } = render(<ExportModal opened={true} onClose={jest.fn()} />);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('should disable export button when no canvas sizes selected', () => {
    const { getByText } = render(<ExportModal opened={true} selectedCanvasSizes={[]} />);
    expect(getByText('Export')).toBeDisabled();
  });
});
```

### Property-Based Testing

**Property-Based Testing Library:** We will use **fast-check** for TypeScript/React property-based testing.

**Configuration:** Each property-based test should run a minimum of 100 iterations.

**Property Test Tagging:** Each property-based test must include a comment with this format:
`// Feature: enhanced-export, Property {number}: {property_text}`

**Property Tests:**

1. **Property 2: PNG format export**
   - Generate random screen arrays
   - Export with PNG format
   - Verify all blobs have type 'image/png'
   - Tag: `// Feature: enhanced-export, Property 2: PNG format export`

2. **Property 3: JPG format export**
   - Generate random screen arrays
   - Export with JPG format
   - Verify all blobs have type 'image/jpeg'
   - Tag: `// Feature: enhanced-export, Property 3: JPG format export`

3. **Property 5: Canvas size filtering**
   - Generate random screensByCanvasSize objects with varying empty/non-empty arrays
   - Verify displayed list only includes non-empty canvas sizes
   - Tag: `// Feature: enhanced-export, Property 5: Canvas size filtering`

4. **Property 7: Selection toggle**
   - Generate random canvas size IDs
   - Simulate click on each
   - Verify selection state flips
   - Tag: `// Feature: enhanced-export, Property 7: Selection toggle`

5. **Property 8: Export inclusion by selection**
   - Generate random screensByCanvasSize and selection
   - Export with selection
   - Verify only selected canvas sizes are included
   - Tag: `// Feature: enhanced-export, Property 8: Export inclusion by selection`

6. **Property 9: Screen count accuracy**
   - Generate random canvas size selections
   - Calculate expected total
   - Verify displayed count matches
   - Tag: `// Feature: enhanced-export, Property 9: Screen count accuracy`

7. **Property 12: Filename generation**
   - Generate random screen names and formats
   - Generate filename
   - Verify contains screen name and correct extension
   - Tag: `// Feature: enhanced-export, Property 12: Filename generation`

8. **Property 15: ZIP folder structure**
   - Generate random screensByCanvasSize
   - Create ZIP export
   - Verify folder structure and filename patterns
   - Tag: `// Feature: enhanced-export, Property 15: ZIP folder structure`

9. **Property 20: Export dimensions accuracy**
   - Generate random canvas sizes
   - Export screens
   - Verify exported dimensions match canvas size dimensions
   - Tag: `// Feature: enhanced-export, Property 20: Export dimensions accuracy`

10. **Property 23: Screen order preservation**
    - Generate random screen arrays
    - Export screens
    - Verify export order matches array order
    - Tag: `// Feature: enhanced-export, Property 23: Screen order preservation`

### Integration Testing

**Export Flow:**
- Test complete export flow from button click to download
- Test format switching and quality adjustment
- Test canvas size selection and deselection
- Test progress updates during export
- Test cancellation at various stages
- Test error recovery

**Component Integration:**
- Test ExportModal with ExportService
- Test progress indicator updates during real export
- Test modal state management across export lifecycle
- Test notification display on success/error

**End-to-End Scenarios:**
- Create screens in multiple canvas sizes, export all as PNG
- Create screens, export selected canvas sizes as JPG with quality 80
- Start export, cancel mid-process, verify no download
- Export single screen, verify direct download without ZIP
- Export multiple screens, verify ZIP structure
- Quick export all, verify all screens exported as PNG
- Quick export single canvas size, verify only that size exported

### Visual Regression Testing

**Snapshot Tests:**
- Capture snapshots of ExportModal with various configurations
- Test format selector appearance
- Test quality slider appearance (enabled/disabled)
- Test canvas size selector with different selections
- Test progress indicator at various stages
- Test error states and messages

**Manual Testing:**
- Verify export button placement in preview
- Verify modal appearance and layout
- Verify progress indicator visibility and updates
- Verify success/error notifications
- Verify downloaded files open correctly
- Verify ZIP structure in file explorer
- Test across different browsers (Chrome, Firefox, Safari)

## Performance Considerations

### Export Optimization

**Sequential Processing:**
- Process screens one at a time to avoid memory issues
- Add small delays between screens (100ms) to prevent browser freezing
- Release memory after each screen is processed

**Image Rendering:**
- Reuse CompositionRenderer component for consistency
- Use off-screen rendering to avoid UI flicker
- Clean up temporary DOM elements after rendering
- Use 2x pixel ratio for quality without excessive file size

**ZIP Creation:**
- Stream files into ZIP to avoid loading all in memory
- Use JSZip compression level 6 (balanced)
- Monitor memory usage during ZIP creation

### UI Responsiveness

**Progress Updates:**
- Update progress every screen (not every frame)
- Debounce progress updates if processing very quickly
- Use requestAnimationFrame for smooth progress bar

**Modal Performance:**
- Lazy load ExportModal component
- Memoize canvas size list to avoid re-renders
- Use React.memo for child components
- Debounce quality slider updates (300ms)

### Memory Management

**Large Exports:**
- Limit concurrent screen rendering to 1
- Release blob URLs after download
- Clear temporary containers after each screen
- Monitor memory and warn if approaching limits

**Browser Limits:**
- Warn users when exporting >50 screens
- Suggest batch exports for very large projects
- Provide guidance on browser memory limits

## Dependencies

### Required Packages

**Existing:**
- `jszip` - Already installed for ZIP creation
- `html-to-image` - Already installed for rendering
- `@mantine/core` - UI components
- `@mantine/notifications` - Success/error notifications

**New:**
- None required - all dependencies already exist

### Component Dependencies

**Must be completed first:**
- Store Preview Renderer (`.kiro/specs/store-preview-renderer`) - This feature extends the preview

**Depends on:**
- `CompositionRenderer` - For rendering screens
- `FramesContext` - For accessing screensByCanvasSize
- `getCanvasSizeLabel()` - For canvas size labels
- `getCanvasDimensions()` - For canvas size dimensions

## Migration Notes

### Removing Export from Header

**Changes to Header.tsx:**
1. Remove `onExport` prop from HeaderProps interface
2. Remove Export button (IconFileZip) from render
3. Keep Download button for current screen download
4. Update "Preview" button styling to be more prominent

**Changes to AppFrames.tsx:**
1. Remove `handleExport` function
2. Remove `onExport` prop from Header component
3. Keep `handleDownload` function for current screen download
4. Update any documentation referencing export from header

### User Communication

**In-App Guidance:**
- Add tooltip to Download button: "Download current screen (for all screens, use Preview → Export)"
- Show notification on first visit after update: "Export has moved to the Preview page for better organization"
- Update any help text or documentation

**Documentation Updates:**
- Update user guide to show export in preview
- Update screenshots showing export location
- Add section on export options and formats

## Future Enhancements

### Potential Additions

**Format Options:**
- WebP format support
- SVG export for vector compositions
- PDF export for documentation

**Advanced Features:**
- Batch rename screens before export
- Custom folder structure in ZIP
- Export presets (save common configurations)
- Export templates (e.g., "App Store Complete Set")

**Quality of Life:**
- Remember last export settings
- Export history/recent exports
- Preview thumbnails in export modal
- Drag-to-reorder screens before export

**Performance:**
- Parallel processing for faster exports
- Progressive download (start download before all screens processed)
- Background export with notification when complete
