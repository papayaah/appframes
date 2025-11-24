# Design Document

## Overview

This design enhances the canvas drag-and-drop functionality to automatically save images to the media library and intelligently populate device frames in multi-device compositions. The solution leverages the existing `handleMediaUpload` function and extends the Canvas component's drop handler to support smart frame selection.

## Architecture

The enhancement follows the existing architecture pattern:
- **AppFrames.tsx**: Manages state and media upload logic
- **Canvas.tsx**: Handles drag-and-drop UI events
- **lib/db.ts**: IndexedDB operations via Dexie
- **lib/opfs.ts**: File system operations

Data flow:
1. User drags image onto Canvas
2. Canvas.onDrop captures File object
3. Canvas calls onReplaceScreen callback with File
4. AppFrames.handleMediaUpload saves to OPFS + IndexedDB
5. AppFrames determines target screen index using smart logic
6. AppFrames updates screens array with new mediaId

## Components and Interfaces

### Modified Canvas Component

**Props (no changes needed):**
```typescript
interface CanvasProps {
  settings: CanvasSettings;
  screens: Screen[];
  onReplaceScreen?: (file: File) => void;
  onPanChange?: (panX: number, panY: number) => void;
}
```

**Changes:**
- The existing `onDrop` handler already passes File to `onReplaceScreen`
- No changes needed to Canvas.tsx

### Modified AppFrames Component

**New Helper Function:**
```typescript
function findNextEmptyScreenIndex(
  screens: Screen[],
  composition: string,
  currentIndex: number
): number
```

**Changes to onReplaceScreen callback:**
- Currently: Always uses `settings.selectedScreenIndex`
- Enhanced: Uses `findNextEmptyScreenIndex` to find first empty slot
- Falls back to `selectedScreenIndex` if all slots filled

### Media Upload Flow

**Existing handleMediaUpload (no changes):**
```typescript
async handleMediaUpload(file: File): Promise<number | null>
```

This function already:
- Saves file to OPFS with unique timestamp-based name
- Generates thumbnail
- Extracts dimensions
- Saves metadata to IndexedDB
- Returns mediaId

## Data Models

No changes to existing interfaces. The Screen interface already supports both mediaId and legacy image properties:

```typescript
interface Screen {
  id: string;
  mediaId?: number;
  image?: string;
  name: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Media library persistence
*For any* valid image file dropped on the canvas, the file should be saved to OPFS and its metadata should be saved to IndexedDB, returning a valid mediaId.
**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: Empty frame selection priority
*For any* composition with at least one empty device frame, dropping an image should populate the first empty frame rather than replacing an existing image.
**Validates: Requirements 2.2, 2.5**

### Property 3: Fallback to selected frame
*For any* composition where all device frames have images, dropping a new image should replace the currently selected frame's image.
**Validates: Requirements 2.3**

### Property 4: Single file processing
*For any* drag operation containing multiple files, only the first file should be processed and saved.
**Validates: Requirements 3.4**

### Property 5: Thumbnail generation consistency
*For any* image file saved to the media library, a thumbnail should be generated with maximum dimension of 200px while preserving aspect ratio.
**Validates: Requirements 1.3**

## Error Handling

### File Upload Errors
- **OPFS write failure**: Log error, show alert to user, return null from handleMediaUpload
- **IndexedDB write failure**: Log error, show alert, return null
- **Thumbnail generation failure**: Log error, use placeholder or skip thumbnail
- **Invalid file type**: Reject at browser level via drag-and-drop API

### Edge Cases
- **Empty screens array**: Create first screen with dropped image
- **Invalid composition type**: Default to single composition behavior
- **Concurrent drops**: Process sequentially (browser handles this naturally)
- **Large files**: No size limit currently, but OPFS handles this

### User Feedback
- Success: Image appears immediately in device frame
- Failure: Alert dialog with error message
- Loading: Existing uploading state in MediaLibrary component

## Testing Strategy

### Unit Tests
- Test `findNextEmptyScreenIndex` with various screen configurations
- Test empty array edge case
- Test all-filled array edge case
- Test different composition types

### Property-Based Tests
Property-based testing will use **fast-check** library for TypeScript/React testing.

Each property test should run a minimum of 100 iterations to ensure comprehensive coverage.

**Property Test 1: Media library persistence**
- Generate random valid image files (mock File objects)
- Call handleMediaUpload
- Verify OPFS contains file and IndexedDB contains metadata
- Tag: **Feature: canvas-drag-drop-improvements, Property 1: Media library persistence**

**Property Test 2: Empty frame selection priority**
- Generate random screen arrays with varying empty/filled states
- Generate random composition types
- Call findNextEmptyScreenIndex
- Verify returned index points to empty screen when available
- Tag: **Feature: canvas-drag-drop-improvements, Property 2: Empty frame selection priority**

**Property Test 3: Fallback to selected frame**
- Generate random screen arrays where all frames are filled
- Generate random selectedScreenIndex values
- Call findNextEmptyScreenIndex
- Verify returned index equals selectedScreenIndex
- Tag: **Feature: canvas-drag-drop-improvements, Property 3: Fallback to selected frame**

**Property Test 4: Single file processing**
- Generate random arrays of multiple File objects
- Simulate drop handler
- Verify only first file is processed
- Tag: **Feature: canvas-drag-drop-improvements, Property 4: Single file processing**

**Property Test 5: Thumbnail generation consistency**
- Generate random image dimensions
- Call createThumbnail
- Verify thumbnail max dimension is 200px
- Verify aspect ratio is preserved
- Tag: **Feature: canvas-drag-drop-improvements, Property 5: Thumbnail generation consistency**

### Integration Tests
- Test full drag-and-drop flow from Canvas to media library
- Test multi-device composition filling
- Test error scenarios with invalid files

## Implementation Notes

### Smart Frame Selection Algorithm

```typescript
function findNextEmptyScreenIndex(
  screens: Screen[],
  composition: string,
  currentIndex: number
): number {
  // Handle empty screens array
  if (screens.length === 0) {
    return 0;
  }
  
  // Determine how many frames the composition uses
  const frameCount = getCompositionFrameCount(composition);
  
  // Find first empty frame within composition frame count
  for (let i = 0; i < Math.min(frameCount, screens.length); i++) {
    const screen = screens[i];
    if (!screen.mediaId && !screen.image) {
      return i;
    }
  }
  
  // All frames filled, use current selection
  return currentIndex;
}

function getCompositionFrameCount(composition: string): number {
  switch (composition) {
    case 'single': return 1;
    case 'dual': return 2;
    case 'stack': return 2;
    case 'triple': return 3;
    case 'fan': return 3;
    default: return 1;
  }
}
```

### Modified onReplaceScreen Handler

```typescript
onReplaceScreen={async (file) => {
  // Upload to media library
  const mediaId = await handleMediaUpload(file);
  if (mediaId) {
    // Smart frame selection
    const targetIndex = findNextEmptyScreenIndex(
      screens,
      settings.composition,
      settings.selectedScreenIndex
    );
    
    if (screens.length === 0) {
      addScreen(mediaId);
    } else if (targetIndex < screens.length) {
      replaceScreen(targetIndex, mediaId);
      // Update selected index to the frame we just filled
      setSettings({ ...settings, selectedScreenIndex: targetIndex });
    } else {
      // Need to add new screen
      addScreen(mediaId);
    }
  }
}}
```

## Performance Considerations

- **Thumbnail generation**: Async operation, doesn't block UI
- **OPFS writes**: Async, fast for typical image sizes
- **IndexedDB writes**: Async, minimal overhead
- **File reading**: Uses createImageBitmap for efficient dimension extraction
- **Memory**: Thumbnails limited to 200px to reduce memory footprint

## Browser Compatibility

- **OPFS**: Requires modern browsers (Chrome 86+, Edge 86+, Safari 15.2+)
- **IndexedDB**: Widely supported
- **Drag and Drop API**: Universal support
- **createImageBitmap**: Widely supported

## Future Enhancements

- Deduplication: Check if file already exists before saving
- Progress indicators: Show upload progress for large files
- Batch upload: Support multiple file drops
- Undo/redo: Track media library changes
- File validation: Check file size limits and image format
