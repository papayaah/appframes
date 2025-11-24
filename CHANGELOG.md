# Changelog

## v3.0.0 - AppFrames with Media Library

### 🎉 Major Release: Media Library System

**App Renamed: ScreensStudio → AppFrames**
- Complete rebrand throughout the application
- Updated all components, imports, and documentation
- New app identity focused on frame management

**Media Library with IndexedDB + OPFS**
- All uploaded images stored in Origin Private File System (OPFS)
- Metadata stored in IndexedDB database named "AppFrames"
- Automatic thumbnail generation for fast preview
- Persistent storage across sessions
- Efficient file management

**New Media Tab**
- Browse all uploaded media in a grid
- Click to apply media to selected slot
- Drag & drop from media library to canvas (coming soon)
- Delete media from library
- Shows which slot media will be applied to

**Hybrid Storage System**
- Supports both legacy base64 images and new media library
- Automatic migration: all new uploads go to media library
- Existing functionality preserved
- Seamless transition

### 🎯 How It Works

**Upload Flow:**
1. Drop image on canvas or NEW SCREEN button
2. File saved to OPFS
3. Metadata saved to IndexedDB
4. Thumbnail generated and cached
5. Screen references media by ID

**Storage:**
- **OPFS**: Actual image files (efficient, private)
- **IndexedDB**: File metadata, thumbnails, dimensions
- **Memory**: Object URLs created on-demand

**Media Library:**
- Access via "Media" tab in sidebar
- Shows all uploaded images
- Click image to apply to selected slot
- Hover to see delete button
- Drag images to canvas (coming soon)

### 🔧 Technical Details

**New Infrastructure:**
- `lib/db.ts` - Dexie database with "AppFrames" schema
- `lib/opfs.ts` - OPFS file management utilities
- `hooks/useMediaImage.ts` - React hook for loading images
- `components/AppFrames/MediaLibrary.tsx` - Media grid UI

**Updated Components:**
- All components renamed from ScreensStudio to AppFrames
- Screen interface supports both `image` and `mediaId`
- DeviceFrame loads from either source automatically
- Canvas and ScreensPanel upload to media library

### 📊 Benefits

- **Performance**: Images loaded on-demand, not all in memory
- **Storage**: More efficient than base64 in state
- **Reusability**: Use same image in multiple slots
- **Management**: Central library for all media
- **Persistence**: Survives page refreshes

---

## v2.6.0 - Quick UX Improvements

### ✅ Fixed: Blank Canvas Behavior

**Show Device Frame on Blank Canvas:**
- Device frame now shows even when no screenshots are loaded
- Displays helpful instructions inside the frame
- Shows upload icon and text: "Drop your screenshot here"
- No more confusing empty canvas

**Enable Drag & Drop on Blank Canvas:**
- Can now drop images directly on blank canvas
- Automatically creates the first screen
- No need to use NEW SCREEN button first
- Much more intuitive workflow

### 🎯 Added: Image Panning

**Drag Images Inside Device Frames:**
- Click and drag to reposition images within frames
- Cursor changes to "grab" when hovering over images
- Real-time pan X/Y updates
- Smooth dragging experience
- Works with all composition types

### 🔧 Technical Changes

- Added `showInstructions` prop to DeviceFrame
- Added `onPanChange` callback for drag interactions
- Canvas now creates first screen on drop if none exist
- Mouse drag handlers for image repositioning
- Improved empty state UX

---

## v2.5.0 - Improved Drop & Selection Behavior

### 🎯 Smart Drop Zones

**Drop on Canvas Area:**
- Replaces the currently selected screen's image
- Perfect for quickly swapping screenshots
- Only processes the first dropped file

**Drop on Thumbnails Area (NEW SCREEN button):**
- Adds a new screen to the collection
- Automatically selects the newly added screen
- Can add multiple files at once

### ✅ Fixed: Screen Selection

- Clicking different thumbnail screens now properly updates the canvas
- Selected screen is highlighted with purple border and shadow
- Canvas displays the selected screen's image
- Scale, Pan X, and Pan Y controls now affect the selected screen
- "Selected Image" section shows current slot number

### 🔧 Technical Improvements

- Added `replaceScreen()` function for canvas drops
- Canvas now uses `selectedScreenIndex` to determine which screen to display
- Auto-adjusts selected index when screens are removed
- Newly added screens are automatically selected

---

## v2.4.0 - Google Play Store Support

### 🎯 Multi-Platform Support

Added Google Play Store screenshot dimensions alongside Apple App Store!

#### Google Play - Phone
- Portrait: 1080×1920 (Full HD), 1440×2560 (2K)
- Landscape: 1920×1080 (Full HD), 2560×1440 (2K)

#### Google Play - Tablet
- Portrait: 1600×2560, 2048×2732
- Landscape: 2560×1600, 2732×2048

### 📚 Comprehensive Documentation

Created detailed documentation in `docs/sizes/`:
- **sizes.md** - Main overview and quick reference
- **apple-app-store.md** - Complete Apple requirements (dated Nov 24, 2024)
- **google-play-store.md** - Complete Google requirements (dated Nov 24, 2024)
- **README.md** - Documentation guide

### 📱 Google Play Requirements Documented

- Phone: 2-8 screenshots, 320px-3,840px, 16:9 or 9:16, 8MB max
- 7" Tablet: Up to 8 screenshots, 320px-3,840px, 16:9 or 9:16, 8MB max
- 10" Tablet: Up to 8 screenshots, 1,080px-7,680px, 16:9 or 9:16, 8MB max
- Chromebook: 4-8 screenshots, 1,080px-7,680px, 16:9 or 9:16, 8MB max
- Android XR: 4-8 screenshots, 720px-7,680px, 16:9 or 9:16, 15MB max

### 🎨 Canvas Size Updates

- Added Google Play Phone sizes to canvas dropdown
- Added Google Play Tablet sizes to canvas dropdown
- Organized by platform (Apple vs Google)
- All sizes include orientation in the label

---

## v2.3.0 - Official App Store Dimensions

### 🎯 App Store Ready

All official Apple App Store screenshot dimensions are now included!

#### iPhone 6.5" Display
- Portrait: 1242×2688, 1284×2778
- Landscape: 2688×1242, 2778×1284

#### iPad 13" Display  
- Portrait: 2064×2752, 2048×2732
- Landscape: 2752×2064, 2732×2048

#### Apple Watch
- Ultra 3: 422×514, 410×502
- Series 11: 416×496
- Series 9: 396×484
- Series 6: 368×448
- Series 3: 312×390

### 📱 Changes

- Canvas Size dropdown now organized by device category
- Each dimension option includes orientation (no need to toggle)
- Dimensions match Apple App Store Connect requirements exactly
- Export images are ready for immediate App Store submission

### 📚 Documentation

- Added `APP_STORE_SIZES.md` - Complete guide to App Store dimensions
- Updated README with App Store workflow
- Updated USAGE_GUIDE with new canvas sizes

---

## v2.2.0 - Separation of Canvas Size & Device Frame

### 🎯 Major Concept Clarification

**Canvas Size** and **Device Frame** are now properly separated:

- **Canvas Size** (Layout tab): The actual export dimensions based on App Store/Play Store requirements
  - Example: iPhone 6.5" (1242×2688) - this is what gets exported
  
- **Device Frame** (Device tab): The visual mockup frame that wraps your screenshot
  - Example: iPhone 14 Pro with notch - this is just visual styling

### ✅ Fixed Issues

1. **Drag & Drop Restored**: You can now drag and drop images directly onto the canvas area
2. **Canvas Size Selector**: Restored in the Layout tab with App Store/Play Store dimensions
3. **Device Frame Selection**: Device tab now changes only the visual frame, not the canvas size
4. **Proper Separation**: Canvas size and device frame are independent settings

### 🎨 Changes

#### Layout Tab
- Added back "Canvas Size" selector
- Options include:
  - iOS: iPhone 6.5" (1242×2688)
  - iOS: iPhone 6.7" (1290×2796)
  - iOS: iPhone 5.5" (1242×2208)
  - iOS: iPad Pro 12.9" (2048×2732)
  - iOS: iPad Pro 11" (1668×2388)
  - Android: Phone (1080×1920)
  - Android: Tablet (1600×2560)

#### Device Tab
- Updated to show device frame types
- Organized by category with frame characteristics:
  - **Phones**: iPhone 14 Pro (Notch), Pixel 7 (Punch Hole), etc.
  - **Tablets**: iPad Pro, iPad Air, Galaxy Tab
  - **Laptops**: MacBook Pro (Notch), MacBook Air, Surface
  - **Desktops**: iMac, Studio Display, Pro Display XDR

#### Canvas
- Drag & drop now works on the entire canvas area
- Canvas dimensions based on Canvas Size setting (not device frame)
- Visual device frame is independent of canvas size

### 🔧 Technical Changes

- Added `canvasSize` property to `CanvasSettings`
- Separated `getCanvasDimensions()` logic for canvas vs device
- Canvas now accepts drag & drop events
- Updated default canvas size to 'iphone-6.5'

---

## v2.1.0 - Canvas & Device Updates

### 🎨 Major Changes

#### Visible Canvas Boundary
- Canvas now has a visible boundary with shadow and rounded corners
- Canvas size reflects the actual export dimensions
- Canvas adjusts based on selected device dimensions
- Canvas maintains proper aspect ratio for all devices

#### Device Tab
- Added new "Device" tab in sidebar
- Organized devices by category:
  - **Phones**: iPhone 14 Pro, iPhone 14, Pixel 7, Samsung S23, Galaxy Z Flip 5, Galaxy Z Fold 5
  - **Tablets**: iPad Pro 12.9", iPad Mini, Galaxy Tab S9
  - **Laptops**: MacBook Pro 16", MacBook Air, Surface Laptop
  - **Desktops**: iMac 24", Pro Display XDR
  - **TVs**: Smart TV 4K
- Visual device selection with checkmarks
- Device dimensions displayed for each option

#### Improved Dropzone Behavior
- Removed full-canvas dropzone that triggered on any click
- Only "NEW SCREEN" button triggers file upload dialog
- Better user experience - no accidental file dialogs

#### Dynamic Output Dimensions
- Header now shows actual canvas dimensions based on selected device
- Updates automatically when device or orientation changes
- Format: `width × height px`

### 🔧 Technical Changes

#### New Components
- `DeviceTab.tsx` - Device selection interface
- `SidebarTabs.tsx` - Tabbed sidebar wrapper

#### Updated Components
- `Canvas.tsx`:
  - Added `getCanvasDimensions()` helper function
  - Removed Dropzone wrapper
  - Added visible canvas container with proper sizing
  - Canvas now centers in viewport with padding
  
- `Sidebar.tsx`:
  - Removed canvas size selector (moved to Device tab)
  - Added padding to content
  - Removed unused Select import

- `ScreensStudio.tsx`:
  - Added `getCanvasDimensions()` helper
  - Updated to use `SidebarTabs` instead of `Sidebar`
  - Changed default device to 'iphone-14-pro'
  - Pass dynamic dimensions to Header

- `Header.tsx`:
  - Now receives and displays dynamic output dimensions

### 📐 Canvas Dimensions

All devices now have accurate dimensions:

**Phones:**
- iPhone 14 Pro: 393 × 852
- iPhone 14: 390 × 844
- Pixel 7: 412 × 915
- Samsung S23: 360 × 780
- Galaxy Z Flip 5: 360 × 860
- Galaxy Z Fold 5: 870 × 810

**Tablets:**
- iPad Pro 12.9": 1024 × 1366
- iPad Mini: 744 × 1133
- Galaxy Tab S9: 900 × 1600

**Laptops:**
- MacBook Pro 16": 1520 × 950
- MacBook Air: 1440 × 900
- Surface Laptop: 1350 × 900

**Desktops:**
- iMac 24": 1800 × 900
- Pro Display XDR: 1800 × 1012

**TVs:**
- Smart TV 4K: 1920 × 1080

### 🎯 User Experience Improvements

1. **Canvas Visibility**: Users can now clearly see the canvas boundaries and how their composition fits within the export dimensions

2. **Device Selection**: Easier to browse and select devices with categorized list and visual feedback

3. **No Accidental Uploads**: Clicking on canvas no longer triggers file upload dialog

4. **Responsive Canvas**: Canvas automatically adjusts size based on:
   - Selected device
   - Orientation (portrait/landscape)
   - Viewport size

5. **Composition Scale Feedback**: Users can now see if composition is bleeding over canvas edges when adjusting scale

### 🐛 Bug Fixes

- Fixed: Clicking anywhere on canvas triggered file upload
- Fixed: Canvas size not visible or responsive to device selection
- Fixed: Composition scale changes had no visual feedback
- Fixed: Output dimensions were static

### 🚀 Performance

- No performance impact
- Build time: ~1.3s compilation
- All components properly typed with TypeScript

---

## Previous Versions

### v2.0.0 - Initial Release
- Basic screenshot mockup functionality
- 5 composition layouts
- iPhone device frames
- Export to PNG
- Caption support
- Background colors
