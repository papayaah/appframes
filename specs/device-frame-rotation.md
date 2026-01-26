# Device Frame Rotation, Tilt, and Per-Frame Resize

## Overview

This spec documents per-frame transforms for AppFrames device frames. Most features are **already implemented**; this document tracks remaining work.

**Status:**
- ✅ **2D rotation (rotateZ)**: Fully implemented with UI controls (rotate handle)
- ✅ **Per-frame resize (frameScale)**: Fully implemented with UI controls (resize handles)
- ✅ **Persistence**: All transforms persist per screen + per frame
- ✅ **3D rendering setup**: `perspective: '2000px'` and `transformStyle: 'preserve-3d'` are configured
- ✅ **Transform application**: All transforms applied correctly on `DraggableFrame` wrapper
- ✅ **Performance**: rAF preview pattern implemented
- ⏳ **3D tilt controls (tiltX/tiltY)**: CSS transforms are applied, but **UI controls are missing**
- ⏳ **Fold angle (foldable devices)**: Not implemented - foldables render as flat surfaces
- ⏳ **Device flip (show back)**: Not implemented - all devices only show front screen
- ⏳ **Foldable screen flip**: Not implemented - foldables only show inner screen, no option for cover screen

## 3D Effect Confirmation

**Yes, tilting/rotating will yield a 3D effect for ALL device types** (phones, foldables, tablets, laptops, desktops, monitors) because:
- `perspective: '2000px'` is set on the composition container
- `transformStyle: 'preserve-3d'` is set on the frame wrapper (`DraggableFrame`)
- `rotateX()` and `rotateY()` transforms are applied universally in `buildFrameTransform()` to all device frames
- This creates a 3D perspective effect where frames can appear to tilt away from the viewer

**Important:** The 3D transforms are applied at the wrapper level (`DraggableFrame`), not inside `DeviceFrame`, so all device types (including foldable, fold, desktop, monitor) receive the same 3D treatment. There is no device-type-specific filtering.

## Remaining Work

### R1: 3D tilt UI controls

**User Story:** As an app marketer, I want to tilt device frames in 3D, so I can create dynamic compositions with depth.

**Current Status:**
- ✅ Data model: `tiltX` and `tiltY` exist on `ScreenImage` (clamped to [-60, 60])
- ✅ CSS transforms: `rotateX(tiltXdeg) rotateY(tiltYdeg)` are applied in `buildFrameTransform()`
- ✅ 3D rendering: Perspective and preserve-3d are configured
- ❌ **UI controls: No sliders or buttons to adjust tiltX/tiltY**

**Acceptance Criteria:**

1. WHEN a user changes tiltX THEN the frame SHALL apply `rotateX(tiltXdeg)`.
2. WHEN a user changes tiltY THEN the frame SHALL apply `rotateY(tiltYdeg)`.
3. WHEN tiltX/tiltY are zero THEN the frame SHALL appear "flat".
4. WHEN exporting THEN the tilted appearance SHALL match the editor preview.
5. Tilt ranges SHALL be clamped to \([-60°, 60°]\).

**Implementation Tasks:**

- [ ] **Add `setFrameTilt` to FramesContext**
  - Create `setFrameTilt(screenIndex: number, frameIndex: number, tiltX: number, tiltY: number)` function
  - Follow the same pattern as `setFrameRotate` and `setFrameScale`
  - Clamp values using `clampFrameTransform(value, 'tiltX')` / `clampFrameTransform(value, 'tiltY')`

- [ ] **Add tilt controls to FrameSettingsPanel or new panel**
  - Sliders (or similar) for `tiltX` / `tiltY` (range: -60 to 60 degrees)
  - Reset button (tiltX/tiltY back to 0)
  - Wire up to `setFrameTilt` from FramesContext

### R2: Fold Angle for Foldable Devices

**User Story:** As an app marketer, I want to adjust the fold angle of foldable devices (Galaxy Fold, Galaxy Flip), so I can create realistic 3D compositions showing devices partially folded, like an L-shape or V-shape.

**Current Status:**
- ✅ Foldable devices are recognized (`galaxy-z-fold-5`, `galaxy-z-flip-5`)
- ✅ Visual crease/hinge is rendered
- ✅ 3D tilt (tiltX/tiltY) works on foldables
- ❌ **No fold/bend angle** - foldables render as flat surfaces

**Acceptance Criteria:**

1. WHEN a user changes `foldAngle` on a foldable device THEN the device SHALL split into two halves at the hinge
2. WHEN `foldAngle` is 0° THEN the device SHALL appear fully flat/open
3. WHEN `foldAngle` is 180° THEN the device SHALL appear fully closed
4. WHEN `foldAngle` is between 0-180° THEN each half SHALL rotate around the hinge axis to create the fold
5. Fold angle SHALL only apply to devices with `type: 'fold'` or `type: 'flip'`
6. Fold direction SHALL be determined by device type:
   - `fold` (Galaxy Fold): vertical crease, folds horizontally (left/right halves) - creates V-shape
   - `flip` (Galaxy Flip): horizontal crease, folds vertically (top/bottom halves) - creates L-shape
7. Fold angle SHALL be clamped to \([0°, 180°]\)
8. Fold angle SHALL work in combination with 3D tilt (tiltX/tiltY/rotateZ)
9. Fold angle SHALL be stored per-frame on `ScreenImage` and persist across screen switches

**Implementation Tasks:**

- [ ] **Add `foldAngle` to `ScreenImage` type**
  - Add `foldAngle?: number` (0-180 degrees, default 0)
  - Only applies to devices with `type: 'fold'` or `type: 'flip'`

- [ ] **Add `setFrameFoldAngle` to FramesContext**
  - Create `setFrameFoldAngle(screenIndex: number, frameIndex: number, foldAngle: number)` function
  - Clamp values to 0-180 degrees
  - Only allow on foldable device types

- [ ] **Split foldable device rendering into two halves**
  - For `fold` (Galaxy Fold): Split at 50% width (left/right halves)
    - Left half: `rotateY(foldAngle / 2)` around left edge
    - Right half: `rotateY(-foldAngle / 2)` around right edge
  - For `flip` (Galaxy Flip): Split at 50% height (top/bottom halves)
    - Top half: `rotateX(-foldAngle / 2)` around top edge
    - Bottom half: `rotateX(foldAngle / 2)` around bottom edge

- [ ] **Apply fold transforms inside `DeviceFrame`**
  - Fold angle should be applied before wrapper transforms (tiltX/tiltY/rotateZ)
  - Use `transform-origin` to set hinge position correctly
  - Handle image splitting/clipping at fold line

- [ ] **Add fold angle UI controls**
  - Slider for `foldAngle` (range: 0-180 degrees)
  - Only show for foldable device types (`type: 'fold'` or `type: 'flip'`)
  - Presets: 0° (open), 45° (slight), 90° (half-folded), 135° (mostly closed), 180° (closed)
  - Add to `FrameSettingsPanel` or foldable-specific panel

**Example Use Cases:**

- **Galaxy Fold (vertical crease) - V-shape showing both sides:**
  - Fold angle: ~120-135° (partially folded)
  - TiltY: ~15-20° (tilted to show both sides)
  - Shows: Inner screen + outer back panel simultaneously

- **Galaxy Flip (horizontal crease) - L-shape bend:**
  - Fold angle: ~90-120° (L-shape, top upright, bottom flat)
  - TiltX: ~0-10° (slight vertical tilt for perspective)
  - Shows: Top half upright showing screen, bottom half flat
  - Creates dramatic "flex" or "bent phone" effect

### R3: Device Flip (Show Front vs Back)

**User Story:** As an app marketer, I want to flip mobile handsets and tablets to show the back panel, so I can showcase device design, camera arrays, and branding from different angles.

**Current Status:**
- ✅ All devices currently show front screen only
- ❌ **No option to show back panel** - devices always show the front
- ❌ **No device-specific camera styles** - back panels not rendered
- ❌ **No restriction on image drag/drop when showing back**

**Acceptance Criteria:**

1. WHEN a user sets `deviceOrientation` to `'back'` on a mobile handset or tablet THEN the device SHALL show the back panel
2. WHEN a user sets `deviceOrientation` to `'front'` on a mobile handset or tablet THEN the device SHALL show the front screen (current behavior)
3. Default `deviceOrientation` SHALL be `'front'` (current behavior)
4. `deviceOrientation` SHALL apply to:
   - All mobile handsets (phones)
   - All tablets
   - **NOT** laptops, desktops, or monitors (they don't have backs to show)
5. Back panel SHALL display device-specific camera array styles:
   - iPhone 15 Pro Max: Square camera module with 3 large lenses + LiDAR
   - iPhone SE: Single camera or smaller module
   - iPhone 14 Pro: Square module with 3 lenses (different from 15 Pro)
   - Android devices: Various camera array styles per model
   - Tablets: Camera styles appropriate to tablet models
6. Back panel SHALL display device branding (e.g., Apple logo, Samsung logo)
7. Back panel SHALL use device frame color (matches front frame color)
8. WHEN `deviceOrientation` is `'back'` THEN image drag/drop SHALL be disabled (no screen to display images)
9. WHEN `deviceOrientation` is `'back'` THEN existing images SHALL be hidden (back panel has no screen)
10. `deviceOrientation` SHALL work in combination with 3D tilt (tiltX/tiltY/rotateZ) and fold angle
11. `deviceOrientation` SHALL be stored per-frame on `ScreenImage` and persist across screen switches

**Implementation Tasks:**

- [ ] **Add `deviceOrientation` to `ScreenImage` type**
  - Add `deviceOrientation?: 'front' | 'back'` (default: `'front'`)
  - Applies to phones and tablets only

- [ ] **Add camera array config to device config**
  - Extend `DeviceConfig` with `cameraArray?: CameraArrayConfig`
  - Define camera array styles per device model:
    ```typescript
    interface CameraArrayConfig {
      type: 'square' | 'vertical' | 'horizontal' | 'single' | 'dual';
      position: 'top-left' | 'top-center' | 'top-right';
      lenses: Array<{
        size: number; // radius in pixels
        position: { x: number; y: number }; // relative to camera module
        type?: 'wide' | 'ultrawide' | 'telephoto' | 'lidar' | 'flash';
      }>;
      moduleSize?: { width: number; height: number }; // for square modules
    }
    ```
  - Add camera configs for all iPhone models, Android phones, tablets

- [ ] **Add `setDeviceOrientation` to FramesContext**
  - Create `setDeviceOrientation(screenIndex: number, frameIndex: number, orientation: 'front' | 'back')` function
  - Only allow on phones and tablets

- [ ] **Update `DeviceFrame` rendering logic**
  - Check `deviceOrientation` when rendering
  - If `'back'`:
    - Hide screen/image layer
    - Render back panel with device frame color
    - Render camera array based on device config
    - Render device branding (logo)
    - Disable image drag/drop handlers
  - If `'front'`:
    - Render screen/image layer (current behavior)
    - Enable image drag/drop handlers

- [ ] **Add device orientation toggle UI controls**
  - Toggle button or radio group: "Front" / "Back"
  - Only show for phones and tablets
  - Add to `FrameSettingsPanel`
  - Show preview icon of front/back

- [ ] **Disable image interactions when showing back**
  - When `deviceOrientation === 'back'`:
    - Disable `onPanChange` (no image to pan)
    - Disable `onMediaSelect` (no screen to show media)
    - Disable `onPexelsSelect` (no screen to show images)
    - Hide image upload/selection UI
    - Show message: "Back panel - no image display"

**Example Use Cases:**

- **Showcase device back design:**
  - `deviceOrientation`: `'back'`
  - TiltY: ~15-20° (slight tilt to show depth)
  - Shows: Back panel with camera array and branding

- **Showcase camera array:**
  - `deviceOrientation`: `'back'`
  - TiltY: 0° (straight on)
  - Shows: Camera module clearly visible

- **Combined with 3D tilt:**
  - `deviceOrientation`: `'back'`
  - TiltX: 10°, TiltY: 15°
  - Shows: Angled view of back panel

**Camera Array Examples:**

- **iPhone 15 Pro Max:**
  - Type: `'square'`
  - Position: `'top-left'`
  - Lenses: 3 large circular lenses (wide, ultrawide, telephoto) + LiDAR + flash
  - Module: ~80px square

- **iPhone SE:**
  - Type: `'single'` or `'vertical'`
  - Position: `'top-left'`
  - Lenses: 1-2 smaller lenses
  - Module: ~40px vertical

- **Samsung Galaxy S24:**
  - Type: `'vertical'`
  - Position: `'top-left'`
  - Lenses: 3 lenses stacked vertically
  - Module: ~60px vertical

**Technical Notes:**

- Back panel rendering should be a separate component or section in `DeviceFrame`
- Camera arrays should be SVG or CSS-based for scalability
- Device logos can be SVG or text-based
- When switching from `'back'` to `'front'`, restore previous image if it existed
- Consider caching back panel renders for performance

### R4: Foldable Screen Flip (Cover Screen vs Inner Screen)

**User Story:** As an app marketer, I want to toggle between showing the cover screen (front) or inner screen (main) on foldable devices, so I can showcase different device states and use cases.

**Current Status:**
- ✅ Foldable devices are recognized (`galaxy-z-fold-5`, `galaxy-z-flip-5`)
- ✅ Currently only inner/main screen is rendered
- ❌ **No option to show cover screen** - foldables always show the large inner screen
- ❌ **No toggle/control** to switch between cover and inner screen

**Note:** This is separate from R3 (Device Flip). Foldables can have:
- Front/back flip (R3) - show cover screen vs back panel
- Inner/cover screen toggle (R4) - show inner screen vs cover screen

**Background:**
Foldable devices have two screens:
- **Cover screen** (front/outer): Smaller screen visible when device is closed
  - Galaxy Fold: ~6.2" cover screen (narrow, tall)
  - Galaxy Flip: ~1.9" cover screen (very small, on front when closed)
- **Inner screen** (main): Larger screen visible when device is opened
  - Galaxy Fold: ~7.6" inner screen (wide, unfolds)
  - Galaxy Flip: ~6.7" inner screen (tall, unfolds)

**Acceptance Criteria:**

1. WHEN a user sets `foldableScreenMode` to `'cover'` on a foldable device THEN the device SHALL show the cover screen
2. WHEN a user sets `foldableScreenMode` to `'inner'` on a foldable device THEN the device SHALL show the inner screen
3. Default `foldableScreenMode` SHALL be `'inner'` (current behavior)
4. `foldableScreenMode` SHALL only apply to devices with `type: 'fold'` or `type: 'flip'`
5. Regular devices (phones, tablets, etc.) SHALL ignore `foldableScreenMode`
6. Cover screen dimensions SHALL match device specifications:
   - Galaxy Fold: narrower width, same height as inner screen
   - Galaxy Flip: much smaller, different aspect ratio
7. `foldableScreenMode` SHALL work in combination with fold angle and 3D tilt
8. `foldableScreenMode` SHALL be stored per-frame on `ScreenImage` and persist across screen switches

**Implementation Tasks:**

- [ ] **Add `foldableScreenMode` to `ScreenImage` type**
  - Add `foldableScreenMode?: 'cover' | 'inner'` (default: `'inner'`)
  - Only applies to devices with `type: 'fold'` or `type: 'flip'`

- [ ] **Add cover screen dimensions to device config**
  - Extend `DeviceConfig` with `coverScreenWidth?` and `coverScreenHeight?`
  - Add cover screen dimensions for `galaxy-z-fold-5` and `galaxy-z-flip-5`
  - Galaxy Fold cover: narrower (e.g., 260px width vs 380px inner)
  - Galaxy Flip cover: much smaller (e.g., 200px width, 400px height vs 260px x 640px inner)

- [ ] **Add `setFoldableScreenMode` to FramesContext**
  - Create `setFoldableScreenMode(screenIndex: number, frameIndex: number, mode: 'cover' | 'inner')` function
  - Only allow on foldable device types

- [ ] **Update `DeviceFrame` rendering logic**
  - Check `foldableScreenMode` when rendering foldable devices
  - If `'cover'`: render smaller cover screen dimensions
  - If `'inner'`: render normal inner screen dimensions (current behavior)
  - Adjust frame width/height based on screen mode

- [ ] **Add screen mode toggle UI controls**
  - Toggle button or radio group: "Cover Screen" / "Inner Screen"
  - Only show for foldable device types (`type: 'fold'` or `type: 'flip'`)
  - Add to `FrameSettingsPanel` or foldable-specific panel
  - Show preview of which screen is active

**Example Use Cases:**

- **Showcase cover screen (closed state):**
  - `foldableScreenMode`: `'cover'`
  - Fold angle: 180° (fully closed)
  - Shows: Small cover screen, device appears closed

- **Showcase inner screen (open state):**
  - `foldableScreenMode`: `'inner'`
  - Fold angle: 0° (fully open)
  - Shows: Large inner screen, device appears fully opened

- **Partially folded showing inner screen:**
  - `foldableScreenMode`: `'inner'`
  - Fold angle: ~120° (partially folded)
  - TiltY: ~15° (tilted to show both sides)
  - Shows: Inner screen visible on one half, back panel on other half

- **Partially folded showing cover screen:**
  - `foldableScreenMode`: `'cover'`
  - Fold angle: ~45° (slightly open)
  - Shows: Cover screen visible, device slightly ajar

**Technical Notes:**

- Cover screen dimensions should be stored in device config, not calculated
- When switching modes, the same image can be used but scaled/positioned differently
- Consider allowing separate images for cover vs inner screen in the future
- Cover screen mode may need different aspect ratio handling

### Optional Enhancements

- [ ] **Edge resize handles**
  - Add top/right/bottom/left handles (in addition to corners)
  - Keep interactions smooth (preview in rAF, commit on end)
  - Clamp `frameScale` to 20–200

- [ ] **Back panel rendering for folded devices**
  - Render device back panel when foldAngle > 45°
  - Show cameras, branding, etc. on back panel
  - Apply same transforms (fold angle + tilt) to back panel

## Technical Notes

### Transform Order (Already Implemented)

Transforms are applied in this order:
1. Base composition transform (if any, e.g. fan layout)
2. Translate for frame positioning (`frameX`, `frameY`)
3. Scale (`frameScale / 100`) **before** rotations
4. RotateX, rotateY, rotateZ

**Note:** For foldable devices, fold angle transforms are applied **inside `DeviceFrame`** (before the wrapper transforms), so the order is:
1. Split device into halves (if foldable)
2. Apply fold angle to each half
3. Then apply wrapper transforms (tiltX/tiltY/rotateZ/frameScale) from `DraggableFrame`

### Interaction Performance (Already Implemented)

Resize/rotate interactions use the "preview in rAF, commit on end" pattern:
- **mousemove**: update refs + schedule rAF; apply `style.transform` directly to the wrapper DOM for preview
- **mouseup**: commit the final `tiltX/tiltY/rotateZ/frameScale` to React state once

This matches the existing canvas interaction approach documented in `agents.md`.
