# Device Frame System: Modular DIY Approach

## Overview

This spec defines a modular, DIY approach to device frames where users start with base frame types and customize them with modular features. This eliminates the need to maintain hundreds of similar phone models while still providing preset templates for quick selection.

## Core Philosophy

Instead of maintaining separate configs for every phone model (iPhone 14, iPhone 15, Samsung S23, Pixel 7, etc.), we provide:
1. **Base frame types** - Generic foundations (phone, tablet, laptop, desktop)
2. **Modular features** - Components that can be added/removed (bezels, notches, home buttons, etc.)
3. **Preset templates** - Quick-select combinations that match popular devices (iPhone, Samsung, etc.)
4. **Distinct devices** - Unique devices that can't be replicated with modular parts (Surface Laptop, iMac, etc.)

## Base Frame Types

These are the foundational frame categories that users start with:

### 1. **Phone**
- Generic phone frame
- Standard aspect ratio
- Can be customized with features

### 2. **Tablet**
- Generic tablet frame
- Standard aspect ratio
- Can be customized with features

### 3. **Laptop**
- Generic laptop frame
- Standard aspect ratio
- Can be customized with features

### 4. **Desktop**
- Generic desktop/monitor frame
- Standard aspect ratio
- Can be customized with features

### 5. **Frameless Phone**
- No bezels, edge-to-edge
- Already generic ✓

### 6. **Frameless Tablet**
- No bezels, edge-to-edge
- Already generic ✓

### 7. **Frameless Laptop**
- No bezels, edge-to-edge
- Already generic ✓

### 8. **Frameless Desktop**
- No bezels, edge-to-edge
- Already generic ✓

## Modular Features

Users can add/remove these features on base frames:

### Phone Features
- **Bezel Style**: None, Thin, Standard, Thick
- **Top Notch**: None, Notch, Dynamic Island, Punch Hole (center), Punch Hole (left)
- **Bottom Home Button**: None, Home Button, Gesture Bar
- **Size**: Small, Standard, Large, Extra Large
- **Corner Radius**: Sharp, Rounded, Very Rounded

### Tablet Features
- **Bezel Style**: None, Thin, Standard, Thick
- **Top Notch**: None, Notch, Punch Hole
- **Bottom Home Button**: None, Home Button, Gesture Bar
- **Size**: Small, Standard, Large
- **Corner Radius**: Sharp, Rounded, Very Rounded

### Laptop Features
- **Bezel Style**: None, Thin, Standard, Thick
- **Top Notch**: None, Notch (like MacBook Pro)
- **Keyboard**: None, Visible, Hidden
- **Size**: Standard, Large
- **Corner Radius**: Sharp, Rounded

### Desktop Features
- **Bezel Style**: None, Thin, Standard, Thick
- **Stand**: None, Simple Stand, Apple Stand, VESA Mount
- **Size**: Standard, Large, Extra Large
- **Corner Radius**: Sharp, Rounded

## Preset Templates

Quick-select combinations that match popular devices. These are just saved configurations of base frames + features:

### Phone Presets
- **iPhone** - Phone + Notch + Standard Size
- **iPhone Pro** - Phone + Dynamic Island + Standard Size
- **iPhone SE** - Phone + Home Button + Small Size
- **Samsung Galaxy** - Phone + Punch Hole (center) + Standard Size
- **Pixel** - Phone + Punch Hole (left) + Standard Size
- **Flip** - Foldable (vertical) - *keep as distinct*
- **Fold** - Foldable (horizontal) - *keep as distinct*

### Tablet Presets
- **iPad** - Tablet + Standard Bezel + Standard Size
- **iPad Pro** - Tablet + Thin Bezel + Large Size
- **iPad Mini** - Tablet + Standard Bezel + Small Size
- **Galaxy Tab** - Tablet + Standard Bezel + Standard Size

### Laptop Presets
- **MacBook Air** - Laptop + No Notch + Standard Size
- **MacBook Pro** - Laptop + Notch + Standard Size
- **Generic Laptop** - Laptop + Standard Bezel + Standard Size

### Desktop Presets
- **Generic Monitor** - Desktop + Simple Stand + Standard Size
- **Studio Display** - Desktop + Apple Stand + Standard Size

## Distinct Devices (Keep As-Is)

These devices are unique enough that they can't be replicated with modular parts. Keep them as separate, distinct device configs:

### Laptops
- **Surface Laptop** - Unique design, distinctive look

### Desktops
- **iMac** - All-in-one with color-matched stand, unique design
- **Studio Display** - Distinctive Apple design
- **Pro Display XDR** - Professional monitor with unique stand

### Tablets
- **iPad Pro** - Distinctive design (if we want to keep it separate from generic tablet)
- **iPad Air** - Distinctive design (if we want to keep it separate)
- **iPad Mini** - Distinctive size (if we want to keep it separate)

*Note: We can decide whether to keep iPad variants as distinct devices or convert them to presets of the generic tablet.*

## Implementation Architecture

### Data Structure

```typescript
interface BaseFrame {
  type: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'frameless-phone' | 'frameless-tablet' | 'frameless-laptop' | 'frameless-desktop';
  features: {
    bezelStyle?: 'none' | 'thin' | 'standard' | 'thick';
    topNotch?: 'none' | 'notch' | 'dynamic-island' | 'punch-hole-center' | 'punch-hole-left';
    bottomHomeButton?: 'none' | 'home-button' | 'gesture-bar';
    size?: 'small' | 'standard' | 'large' | 'extra-large';
    cornerRadius?: 'sharp' | 'rounded' | 'very-rounded';
    // ... other features
  };
}

interface PresetTemplate {
  id: string; // e.g., 'iphone', 'samsung-galaxy'
  name: string; // e.g., "iPhone", "Samsung Galaxy"
  baseFrame: BaseFrame;
}

interface DistinctDevice {
  id: string; // e.g., 'surface-laptop', 'imac'
  name: string; // e.g., "Surface Laptop", "iMac"
  // Full device config (not modular)
}
```

### User Flow

1. **Start with base frame**: User selects "Phone", "Tablet", "Laptop", or "Desktop"
2. **Customize features**: User adds/removes features (notch, bezel, home button, etc.)
3. **Or use preset**: User can select a preset template (iPhone, Samsung, etc.) which applies a saved configuration
4. **Save custom preset**: User can save their custom configuration as a new preset
5. **Select distinct device**: User can also select a distinct device (Surface Laptop, iMac, etc.)

### UI Components

1. **Base Frame Selector**: Choose phone/tablet/laptop/desktop
2. **Feature Customization Panel**: Toggle/modify features
3. **Preset Template Selector**: Quick-select popular combinations
4. **Distinct Device Selector**: Choose unique devices (Surface, iMac, etc.)

## Migration Strategy

### Phase 1: Add Modular System
- Implement base frames and feature system
- Keep existing device configs working (backward compatibility)
- Add preset templates that map to existing devices

### Phase 2: Convert Phones to Presets
- Convert all phone devices (iPhone 14, iPhone 15, Samsung S23, Pixel 7, etc.) to preset templates
- Each preset uses base "Phone" frame + appropriate features
- Old device IDs still work (map to presets)

### Phase 3: Convert Generic Tablets/Laptops
- Convert generic tablets/laptops to presets
- Keep distinct devices (Surface, iMac) as separate configs

### Phase 4: Cleanup
- Remove redundant device configs
- Keep only base frames, presets, and distinct devices

## Benefits

1. **Maintainability**: No need to add every new phone model - just create a preset
2. **Flexibility**: Users can create any combination they want
3. **Scalability**: Easy to add new features without creating new device configs
4. **User Experience**: DIY approach is more engaging, presets provide quick access
5. **Reduced Complexity**: Fewer device configs to maintain

## Summary

- **Base Frames**: Phone, Tablet, Laptop, Desktop (plus frameless variants)
- **Modular Features**: Bezels, notches, home buttons, sizes, corner radius, etc.
- **Preset Templates**: Quick-select combinations (iPhone, Samsung, etc.)
- **Distinct Devices**: Keep unique devices (Surface Laptop, iMac, Studio Display, Pro Display XDR)
- **Foldables**: Keep Flip and Fold as distinct (can't be replicated with modular parts)
