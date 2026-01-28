# DIY Device Frames

## Overview

A modular approach to device frames where users build their own frame by selecting a base type and customizing features. Templates provide quick shortcuts that pre-populate these settings.

## User Flow

1. **Select base type or template** from the device selector list
2. **View/modify settings** in the frame settings panel
3. **See changes immediately** on the canvas

## Base Frame Types

| Type | Description |
|------|-------------|
| Phone | Standard portrait mobile device |
| Flip | Vertical foldable (folds horizontally with crease in middle) |
| Foldable | Horizontal foldable (unfolds to tablet-like size) |
| Tablet | Larger touch device |
| Laptop | Device with keyboard/trackpad |
| Desktop | Monitor/display |

## Customization Options

### Phone

| Feature | Options |
|---------|---------|
| View | Front, Back |
| Bezel | None, Thin, Standard, Thick |
| Top Cutout | None, Notch, Dynamic Island, Punch Hole (center), Punch Hole (left), Punch Hole (right) |
| Bottom | None, Home Button, Gesture Bar |
| Corners | Sharp, Rounded, Very Rounded |

**Back View** (when View = Back):

| Feature | Options |
|---------|---------|
| Camera Layout | Single, Dual Vertical, Dual Horizontal, Triple, Square (iPhone-style), Circle (Pixel-style) |
| Flash | Yes, No |

### Flip

| Feature | Options |
|---------|---------|
| View | Front, Back |
| Bezel | Thin, Standard |
| Cover Screen | Yes, No |
| Corners | Rounded, Very Rounded |

### Foldable

| Feature | Options |
|---------|---------|
| View | Front, Back |
| State | Folded, Unfolded |
| Bezel | Thin, Standard |
| Corners | Rounded, Very Rounded |

### Tablet

| Feature | Options |
|---------|---------|
| View | Front, Back |
| Bezel | None, Thin, Standard, Thick |
| Top Cutout | None, Punch Hole |
| Bottom | None, Home Button |
| Corners | Sharp, Rounded, Very Rounded |

### Laptop

| Feature | Options |
|---------|---------|
| Bezel | None, Thin, Standard, Thick |
| Top Cutout | None, Notch |
| Corners | Sharp, Rounded |
| Base Style | Standard, Fabric (Surface-style) |
| Hinge | Hidden, Visible |

### Desktop

| Feature | Options |
|---------|---------|
| Bezel | None, Thin, Standard, Thick |
| Stand | None, Simple, Apple-style, VESA Mount |
| Corners | Sharp, Rounded |
| Chin | None, Standard, Large (iMac-style) |
| All-in-One | No, Yes (shows computer base like iMac) |

## Templates

Templates are pre-configured DIY settings. Selecting a template populates the frame settings panel with those options. Users can then modify any option.

### Phone
- **iPhone** - Notch, Rounded, Square Camera (back)
- **iPhone Pro** - Dynamic Island, Rounded, Square Camera (back)
- **iPhone SE** - Home Button, Rounded, Single Camera (back)
- **Pixel** - Punch Hole (left), Rounded, Circle Camera (back)
- **Galaxy** - Punch Hole (center), Rounded, Triple Camera (back)

### Flip
- **Galaxy Z Flip** - Rounded, Cover Screen

### Foldable
- **Galaxy Z Fold** - Rounded, Unfolded

### Tablet
- **iPad** - Rounded, Standard Bezel
- **iPad Pro** - Rounded, Thin Bezel
- **iPad Mini** - Rounded, Standard Bezel
- **Galaxy Tab** - Rounded, Standard Bezel

### Laptop
- **MacBook Air** - Rounded, No Notch, Standard Base
- **MacBook Pro** - Rounded, Notch, Standard Base
- **Surface Laptop** - Rounded, No Notch, Fabric Base, Visible Hinge

### Desktop
- **Monitor** - Simple Stand, No Chin
- **iMac** - Apple-style Stand, Large Chin, All-in-One
- **Studio Display** - Apple-style Stand, No Chin
- **Pro Display XDR** - Apple-style Stand, Thick Bezel, No Chin

## UI Design

### Device Selector: No Preview

The device/template selector is a simple list without frame previews.

1. List format is clean and scannable
2. No performance cost rendering previews
3. Compact list items
4. Names and subtitles provide sufficient information
5. Canvas shows the actual frame immediately after selection

### Frame Settings Panel

The existing frame settings panel expands to include DIY options based on device type.

**Existing (keep):**
- Frame Color (presets + custom)
- Rotation (-180° to 180°)
- Scale (20% to 200%)

**DIY options (based on device type):**
- View (Front/Back)
- Bezel
- Top Cutout
- Bottom
- Corners
- Device-specific options (Stand, Chin, Base Style, etc.)

When a template is selected, options are pre-populated. Changes apply immediately to the canvas.

## Frameless

Setting Bezel to "None" creates a frameless look for any device type.

## Implementation Notes

- Keep components small and focused (single responsibility)
- Split into separate files rather than large monolithic components
- Example structure:
  - `DIYOptions/` - folder for option selectors
    - `BezelSelector.tsx`
    - `TopCutoutSelector.tsx`
    - `CameraLayoutSelector.tsx`
    - etc.
  - `DeviceRenderers/` - folder for rendering each device type
    - `PhoneRenderer.tsx`
    - `TabletRenderer.tsx`
    - `LaptopRenderer.tsx`
    - `DesktopRenderer.tsx`
    - `FlipRenderer.tsx`
    - `FoldableRenderer.tsx`
  - `templates.ts` - template configurations
  - `types.ts` - TypeScript interfaces
