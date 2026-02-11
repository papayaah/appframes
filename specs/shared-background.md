# Shared Background Spec

## The Problem

In app store listings, screenshots are displayed side-by-side. A common design technique is making the background flow continuously across all screens — a single gradient, pattern, or image that spans the entire set, so each screen shows its slice. This creates visual cohesion and a "panoramic" effect as users scroll.

Currently, each screen has its own independent `backgroundColor` and optional `canvasBackgroundMediaId`. There's no way to create a background that spans across screens.

## How It Works

### The Concept

A **shared background** is a single wide background (image or gradient) that stretches across all screens in order. Each screen renders only its portion — screen 1 shows the left slice, screen 2 the next slice, and so on. When the exported screenshots are placed side-by-side in the App Store, the background appears seamless.

```
┌─────────────────────────────────────────────────┐
│           Full shared background                 │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ Screen 1 │ Screen 2 │ Screen 3 │ Screen 4 │  │
│  │  slice   │  slice   │  slice   │  slice   │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────┘
```

### Enabling Shared Background

In the Layout sidebar panel (where background color is already set), add a toggle:

- **Per-screen background** (default, current behavior)
- **Shared background** — one background across all screens

When "Shared background" is enabled:
- The per-screen background color picker is replaced with a shared background editor
- The setting applies to all screens in the current canvas size

### Shared Background Types

**1. Shared Gradient**

A gradient that spans the full width of all screens combined.

- User picks two or more color stops
- Direction: horizontal (most common for side-by-side scrolling), vertical, diagonal
- The gradient is rendered as if it covers `screen_width × num_screens` wide, and each screen clips its portion

Example: a gradient from `#667eea` (left) to `#764ba2` (right) across 4 screens — screen 1 shows the blue-ish left quarter, screen 4 shows the purple-ish right quarter.

**2. Shared Image**

A single image that gets spread across all screens proportionally.

The user uploads one image (a wide design with waves, blobs, patterns, gradients — whatever they want). The system treats all screens as one combined canvas and fits the image across it. Each screen then renders its slice.

#### How the image fits the combined canvas

The "combined canvas" is the virtual rectangle you get if you placed all screens side-by-side:

```
Combined canvas for 4 portrait iPhone screens (1290×2796 each):
  Width  = 1290 × 4 = 5160px
  Height = 2796px
  Aspect ratio = ~1.85:1 (very wide)
```

The uploaded image likely won't match this exact aspect ratio, so we need a fitting mode:

**Fill (default)** — The image covers the entire combined canvas. It scales up until both dimensions are covered, then crops the overflow. This guarantees no gaps — every pixel of every screen has the image behind it. Tall images get cropped on the sides; wide images get cropped top/bottom.

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░ cropped top ░░░░░░░░░░░░░░░░│  ← Image extends beyond
├─────────────────────────────────────────┤
│  Screen 1  │  Screen 2  │  Screen 3    │  ← Visible area
├─────────────────────────────────────────┤
│░░░░░░░░░░░ cropped bottom ░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

**Fit** — The image fits entirely within the combined canvas without cropping. The background color fills any remaining space. Good when the full image must be visible.

```
┌─────────────────────────────────────────┐
│  bg color  │           │   bg color     │
│  ┌─────────────────────────────┐        │
│  │  Screen 1  │  Screen 2  │  Screen 3 ││
│  └─────────────────────────────┘        │
│            │           │                │
└─────────────────────────────────────────┘
```

#### Vertical and horizontal alignment

When the image is cropped (Fill mode), the user controls which part is visible:

- **Vertical align**: top / center / bottom — shifts the crop region up or down
- **Horizontal align**: left / center / right — shifts the crop region left or right

For Fit mode, alignment controls where the image sits within the combined canvas (and which sides get the background color fill).

#### What size should the user upload?

For best results, the image should roughly match the combined canvas aspect ratio. A helper tip in the UI:

> "For 4 iPhone screens, upload an image around **5160×2796px** (or any 1.85:1 ratio). The image will be spread evenly across all screens."

The recommended dimensions update dynamically based on the current canvas size and screen count.

#### Example workflow

1. User has 4 screens for iPhone 6.9"
2. They create a 5160×2796 image in Figma/Canva with a mint background and flowing teal wave shapes
3. They upload it as a shared background image
4. Screen 1 shows the left quarter, screen 2 the next quarter, etc.
5. When exported and placed side-by-side in the App Store, the waves flow seamlessly

## Data Model

### New Fields on Project Level

The shared background is stored per canvas size since different store sizes may need different backgrounds.

```typescript
// New type
interface SharedBackground {
  enabled: boolean
  screenIds: string[]             // Which screens participate, in visual order
  type: 'gradient' | 'image'
  // For gradient
  gradient?: {
    stops: Array<{ color: string; position: number }> // position: 0-100
    direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
  }
  // For image
  mediaId?: number                                     // References media library
  imageFit?: 'fill' | 'fit'                            // Default: 'fill'
  imageVerticalAlign?: 'top' | 'center' | 'bottom'    // Default: 'center'
  imageHorizontalAlign?: 'left' | 'center' | 'right'  // Default: 'center'
}
```

`screenIds` defines which screens share the background and their order within the group. Only these screens get sliced; the rest keep their per-screen backgrounds.

### Where It Lives

Add `sharedBackground` to the screen-level `CanvasSettings`:

```typescript
interface CanvasSettings {
  // ... existing fields
  sharedBackground?: SharedBackground
}
```

Since `CanvasSettings` is per-screen, we store the shared background config on every participating screen (synced when edited). Non-participating screens have `sharedBackground.enabled = false` or no `sharedBackground` at all.

Alternatively, we could lift it to the project level:

```typescript
interface Project {
  // ... existing fields
  sharedBackgrounds?: Record<string, SharedBackground>  // keyed by canvas size
}
```

The project-level approach is cleaner here since `screenIds` is inherently a cross-screen concept — it avoids duplicating the same `screenIds` array on every participating screen.

### How a screen knows its slice position

When rendering screen X, the system checks if that screen is in the shared background group:

```typescript
function getSliceInfo(screenId: string, allScreens: Screen[], sharedBg: SharedBackground) {
  // Filter to only the participating screen IDs, in their array order
  const participatingIds = sharedBg.screenIds.filter(id =>
    allScreens.some(s => s.id === id)
  )
  const sliceIndex = participatingIds.indexOf(screenId)
  if (sliceIndex === -1) return null  // This screen is not in the group

  return {
    sliceIndex,                          // This screen's position in the group (0-based)
    totalSlices: participatingIds.length  // Total screens in the group
  }
}
```

The slice math then uses `sliceIndex` and `totalSlices` instead of the screen's global array index and total screen count. Screen 1, 2, 3 in a 5-screen project with only those 3 selected → each gets 1/3 of the background.

## Rendering

### How Each Screen Renders Its Slice

When `sharedBackground.enabled` is true, the canvas background rendering changes:

**For gradients:**

The trick is adjusting the gradient stops based on the screen's position. For a horizontal gradient across N screens, screen at index `i`:

```typescript
// For a horizontal gradient, each screen shows 1/N of the full gradient
// We need to remap the stops so that the visible portion of this screen
// shows the correct segment of the overall gradient

function getScreenGradientCSS(
  gradient: SharedBackground['gradient'],
  screenIndex: number,
  totalScreens: number
): string {
  const sliceStart = screenIndex / totalScreens       // 0.0 to ~1.0
  const sliceEnd = (screenIndex + 1) / totalScreens   // ~0.0 to 1.0

  // Remap each stop from full-range [0,1] to screen-local [-X%, +X%]
  const remappedStops = gradient.stops.map(stop => {
    const globalPos = stop.position / 100
    const localPos = (globalPos - sliceStart) / (sliceEnd - sliceStart) * 100
    return `${stop.color} ${localPos}%`
  })

  return `linear-gradient(to right, ${remappedStops.join(', ')})`
}
```

This means screen 1 of 4 remaps the full gradient into its 0-25% window, screen 2 into 25-50%, etc. The CSS gradient handles the extrapolation naturally — stops outside 0-100% just extend the edge colors.

**For images:**

Each screen shows its horizontal slice of the image. The approach differs by fit mode.

The key idea: we think of the image as covering a virtual canvas that is N screens wide. Each screen is a viewport into 1/N of that canvas.

```typescript
function getScreenBackgroundImageStyle(
  imageUrl: string,
  screenIndex: number,
  totalScreens: number,
  imageFit: 'fill' | 'fit',
  verticalAlign: 'top' | 'center' | 'bottom',
  horizontalAlign: 'left' | 'center' | 'right',
  // We need the image's natural dimensions and the screen dimensions
  imageWidth: number,
  imageHeight: number,
  screenWidth: number,
  screenHeight: number,
): React.CSSProperties {
  const combinedWidth = screenWidth * totalScreens
  const combinedHeight = screenHeight

  const combinedAspect = combinedWidth / combinedHeight
  const imageAspect = imageWidth / imageHeight

  // Calculate how the image maps onto the combined canvas
  let renderWidth: number
  let renderHeight: number

  if (imageFit === 'fill') {
    // Cover: scale until both dimensions are covered, crop overflow
    if (imageAspect > combinedAspect) {
      // Image is wider than combined canvas — match heights, crop sides
      renderHeight = combinedHeight
      renderWidth = combinedHeight * imageAspect
    } else {
      // Image is taller — match widths, crop top/bottom
      renderWidth = combinedWidth
      renderHeight = combinedWidth / imageAspect
    }
  } else {
    // Fit/contain: scale until image fits entirely, background color fills gaps
    if (imageAspect > combinedAspect) {
      renderWidth = combinedWidth
      renderHeight = combinedWidth / imageAspect
    } else {
      renderHeight = combinedHeight
      renderWidth = combinedHeight * imageAspect
    }
  }

  // Express as percentage of a single screen
  const bgWidthPercent = (renderWidth / screenWidth) * 100
  const bgHeightPercent = (renderHeight / screenHeight) * 100

  // Calculate horizontal position:
  // The image is renderWidth wide, the combined canvas is combinedWidth wide.
  // The offset for this screen's slice:
  const alignOffsetX = horizontalAlign === 'left' ? 0
    : horizontalAlign === 'right' ? (renderWidth - combinedWidth)
    : (renderWidth - combinedWidth) / 2

  const sliceX = (screenIndex * screenWidth) + alignOffsetX
  const bgPosXPercent = -(sliceX / screenWidth) * 100

  // Vertical position based on alignment
  const alignOffsetY = verticalAlign === 'top' ? 0
    : verticalAlign === 'bottom' ? (renderHeight - combinedHeight)
    : (renderHeight - combinedHeight) / 2
  const bgPosYPercent = -(alignOffsetY / screenHeight) * 100

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${bgWidthPercent}% ${bgHeightPercent}%`,
    backgroundPosition: `${bgPosXPercent}% ${bgPosYPercent}%`,
    backgroundRepeat: 'no-repeat',
  }
}
```

**How this works visually:**

For Fill mode with 4 screens and a 4000×2000 image on iPhone 6.9" (1290×2796):
- Combined canvas: 5160×2796 (aspect ~1.85:1)
- Image aspect: 2:1 (wider than combined)
- Image scales to height: 2796px tall, 5592px wide
- 432px of horizontal overflow is cropped (controlled by horizontal align)
- Each screen shows its 1290px-wide slice of the fitted image

For Fit mode with the same setup:
- Image scales to width: 5160px wide, 2580px tall
- 216px of vertical gap filled by background color (controlled by vertical align)
- Each screen shows its slice with some background color visible top/bottom

### Export

The `ExportSurface` component already renders backgrounds per-screen. It just needs to use the same slice logic above. Each exported screen gets its portion of the shared background baked in — no changes to the ZIP/download flow.

### Thumbnails

The `ScreenThumbnail` in `ScreensPanel` already re-renders when settings change. It will automatically show each screen's slice since it uses the same rendering pipeline.

## Background Effects

Background effects apply to the rendered background (color, gradient, or image) regardless of whether it's per-screen or shared. They are layered on top of the background in this order:

```
Bottom → Top:
1. Background (solid color / gradient / image)
2. Blur (applied to the background itself)
3. Color overlay / tint
4. Vignette
5. Noise / grain texture
```

### Available Effects

**Blur**
- Applies a Gaussian blur to the background
- Range: 0–50px (slider)
- Default: 0 (off)
- Useful for: blurred screenshot backgrounds, soft out-of-focus looks, making foreground devices pop
- CSS: `filter: blur(Xpx)` on the background layer

**Color Overlay**
- A semi-transparent color layer on top of the background
- Color: any hex color (color picker)
- Opacity: 0–100% (slider)
- Default: 0% opacity (off)
- Useful for: tinting a photo background, darkening for contrast, brand color washes
- CSS: a `::after` pseudo-element or overlay div with `background-color` + `opacity`

**Vignette**
- Darkens the edges of the canvas, drawing focus to the center
- Intensity: 0–100% (slider)
- Default: 0 (off)
- Useful for: dramatic/moody looks, focusing attention on the device
- CSS: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,X) 100%)` overlay

**Noise / Grain**
- Adds a subtle noise texture over the background
- Intensity: 0–100% (slider)
- Default: 0 (off)
- Useful for: textured/organic feel, reducing banding on gradients, retro aesthetics
- Implementation: SVG filter with `<feTurbulence>` or a pre-made noise PNG tiled at low opacity

### Data Model Addition

```typescript
interface BackgroundEffects {
  blur?: number                    // 0-50, default 0
  overlayColor?: string            // Hex color, default '#000000'
  overlayOpacity?: number          // 0-100, default 0
  vignetteIntensity?: number       // 0-100, default 0
  noiseIntensity?: number          // 0-100, default 0
}
```

Added to `CanvasSettings`:

```typescript
interface CanvasSettings {
  // ... existing fields
  backgroundEffects?: BackgroundEffects
  sharedBackground?: SharedBackground
}
```

The `backgroundEffects` is per-screen. When shared background is enabled, effects are still per-screen — this allows subtle variation (e.g., screen 1 has stronger vignette to draw the eye, later screens are lighter). But in practice most users will want the same effects on all screens, so a "Apply to all screens" button syncs the effects across screens.

### Rendering

Effects are rendered as stacked layers inside the canvas background area:

```tsx
<div className="canvas" style={{ ...getBackgroundStyle(backgroundColor) }}>
  {/* Layer 1: Background image (if any) */}
  <CanvasBackground mediaId={...} blur={effects.blur} />

  {/* Layer 2: Color overlay */}
  {effects.overlayOpacity > 0 && (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: effects.overlayColor,
      opacity: effects.overlayOpacity / 100,
      pointerEvents: 'none',
    }} />
  )}

  {/* Layer 3: Vignette */}
  {effects.vignetteIntensity > 0 && (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${effects.vignetteIntensity / 100}) 100%)`,
      pointerEvents: 'none',
    }} />
  )}

  {/* Layer 4: Noise */}
  {effects.noiseIntensity > 0 && (
    <div style={{
      position: 'absolute', inset: 0,
      opacity: effects.noiseIntensity / 100,
      pointerEvents: 'none',
    }}>
      <svg width="100%" height="100%">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5" />
      </svg>
    </div>
  )}

  {/* Layer 5: Content (frames, text) */}
  <div style={{ position: 'relative', zIndex: 1 }}>
    <CompositionRenderer ... />
    <TextElements ... />
  </div>
</div>
```

For blur on solid color / gradient backgrounds (no image), blur is applied to the background div itself via `filter: blur()`. For image backgrounds, blur is applied to the `CanvasBackground` component's image element.

## UI

### Where Everything Lives: Right Sidebar (CanvasSettingsPanel)

All background controls live in the right sidebar's Canvas Settings panel — the same place where background color swatches already are. When the user clicks on the canvas (not a frame or text), the SettingsSidebar opens showing:

```
Canvas Settings (right sidebar)
┌─────────────────────────────────┐
│  Canvas Orientation              │
│  [Portrait] [Landscape]         │
├─────────────────────────────────┤
│  Background                      │
│                                 │
│  ○ Per-screen   ● Shared        │  ← Toggle (SegmentedControl)
│                                 │
│  ┌─ Color / Gradient ──────────┐│
│  │ [■][■][■][■][■][■]         ││  ← Preset swatches (existing)
│  │ [■][■][■][■][■][■]         ││
│  │ [■][■][■][■][■][🎨]        ││  ← Custom color/gradient picker
│  └─────────────────────────────┘│
│                                 │
│  ┌─ Background Image ──────────┐│
│  │ [Upload / Choose from media] ││
│  │ Fit: [Fill] [Fit]           ││  ← Only when image is set
│  │ V-Align: [Top][Center][Bot] ││
│  │ H-Align: [Left][Center][Rt] ││
│  │ [Remove Image]              ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─ Screens in shared BG ──────┐│  ← Only in shared mode
│  │  [1✓] [2✓] [3✓] [4 ] [5 ]  ││  ← Toggle each screen in/out
│  │                             ││
│  │  Preview:                   ││
│  │  ┌──┬──┬──┐                 ││  ← Shows only participating screens
│  │  │ 1│ 2│ 3│                 ││
│  │  └──┴──┴──┘                 ││
│  │  Tip: Upload ~3870×2796px   ││  ← Size updates for 3 screens
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  Background Effects              │
│                                 │
│  Blur           [━━━━━○━━] 12px │
│  Overlay Color  [■ #000] 40%    │
│  Vignette       [━━━━━━━━○] 60% │
│  Noise          [━○━━━━━━━] 10% │
│                                 │
│  [Apply effects to all screens] │  ← Syncs effects across screens
│                                 │
└─────────────────────────────────┘
```

### How Per-screen vs Shared Toggle Works

The toggle sits at the top of the Background section. When switching modes:

**Per-screen (default):**
- Color/gradient swatches work exactly as they do today — each screen has its own background
- Background image is per-screen (existing `canvasBackgroundMediaId`)
- Effects apply to the current screen only

**Shared:**
- A row of numbered screen buttons appears — toggle each screen in/out of the shared background group
- By default, the currently selected screens are included when first enabling shared mode
- Color/gradient swatches set the base color for all participating screens
- Background image is shared — sliced across only the participating screens
- The preview strip shows only participating screens with their slices
- Recommended image size updates based on participant count
- Effects still apply per-screen (with "Apply to all" shortcut)

The **same controls** are visible in both modes — color swatches, image upload, effects sliders. The only difference is whether changes affect one screen or the shared group, and whether the image is sliced.

### Selecting Which Screens Share the Background

The screen selector row shows small numbered buttons for each screen in the canvas size. Toggling a screen in/out:

- **Adding a screen**: inserts it into `screenIds` at its natural array position (maintains visual order). The slicing recalculates — each screen's slice gets narrower.
- **Removing a screen**: drops it from `screenIds`. That screen reverts to its per-screen background (or a default). Remaining screens' slices get wider.
- **Minimum**: at least 2 screens must be selected for shared mode to make sense. If only 1 remains, it effectively behaves like per-screen.

The order in `screenIds` always matches the screen array order (left to right in the ScreensPanel). Reordering screens in the panel automatically updates the order in `screenIds`.

### Visual Indicator in Screens Panel

When shared background is active, show a subtle visual cue in the bottom screens strip — a thin colored line or bracket connecting only the participating screen thumbnails. Non-participating screens have no indicator. This makes it immediately clear which screens share a background and which are independent.

## Edge Cases

**Adding a new screen**: New screens are not automatically added to the shared background group. The user toggles them in if they want. This avoids unexpectedly changing the slicing for existing screens.

**Deleting a screen**: If a participating screen is deleted, it's removed from `screenIds`. The remaining screens' slices widen to fill the gap. If only 1 screen remains in the group, shared mode still works (shows the full background) but the UI hints that they should add more screens or switch to per-screen.

**Reordering screens**: `screenIds` order always follows the screen array order. When a user drags screen 3 before screen 1 in the ScreensPanel, the `screenIds` order updates accordingly, and slices redistribute.

**Non-participating screens**: Screens not in the shared group keep their own per-screen background (color, image, effects). They're completely independent.

**Mixed canvas sizes**: Each canvas size has its own shared background config with its own `screenIds`. Switching canvas sizes shows that size's configuration.

**Duplicating a screen**: If a participating screen is duplicated, the new screen is not automatically added to the shared group (same as adding a new screen).

## What This Does NOT Include

- **Shared foreground elements** (shapes, decorations that span screens): out of scope. The organic blobs in the reference screenshot are part of the background image itself, not separate vector elements.
- **Animated/interactive background editor** (drawing shapes, adding blobs): users create these in external tools and upload as a shared background image.
- **Vertical shared backgrounds** (for vertically-scrolling store layouts): the slicing is horizontal only, matching how app stores display screenshots side-by-side.

## Implementation Notes

- The gradient remapping math is the core logic — everything else is wiring up existing patterns
- Shared image backgrounds reuse the existing `useMediaImage` hook and OPFS storage
- The `CanvasBackground` component in `Canvas.tsx` is the main place to add the slicing logic
- Export uses `ExportSurface` which already renders the same background — just needs the same slice-aware logic
- The gradient editor UI could use a library like `react-colorful` or be built with Mantine's color inputs
