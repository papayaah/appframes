# Device Naming Generalization

## Overview

This spec defines a generalized naming scheme for device frames that removes specific model numbers and focuses on device categories, sizes, and key distinguishing features. This approach makes the app more maintainable and avoids the need to add every new model release.

## Principles

1. **Remove model numbers**: No "14", "15", "S23", etc.
2. **Focus on size categories**: Small, Standard, Large, Extra Large
3. **Distinguish by key features**: Dynamic Island vs Notch, Home Button, etc.
4. **Use manufacturer product lines**: iPhone Pro, iPad Pro, MacBook Pro, etc.
5. **Keep foldable names simple**: Flip, Fold (already done)

## iOS Phones

### Current Devices
- iPhone 14 Pro → **iPhone Pro** (Dynamic Island, standard size)
- iPhone 14 → **iPhone** (Notch, standard size)
- iPhone 13 → **iPhone** (Notch, standard size) - *duplicate, can be merged*
- iPhone SE → **iPhone SE** (Home Button, small size)

### Proposed Generalized Names

1. **iPhone SE**
   - Small size
   - Home Button
   - Dimensions: Compact

2. **iPhone**
   - Standard size
   - Notch
   - Dimensions: Standard

3. **iPhone Pro**
   - Standard size
   - Dynamic Island
   - Dimensions: Standard (Pro features)

4. **iPhone Pro Max** *(new - for extra large)*
   - Large size
   - Dynamic Island
   - Dimensions: Extra large

### Recommendation
- Keep: iPhone SE, iPhone, iPhone Pro
- Add: iPhone Pro Max (for large size variant)
- Remove: Model number distinctions (14, 13, etc.)

## Android Phones

### Current Devices
- Pixel 7 → **Pixel** (Punch Hole)
- Samsung S23 → **Galaxy S** (Punch Hole)
- Flip → **Flip** (Foldable) ✓
- Fold → **Fold** (Foldable) ✓

### Proposed Generalized Names

1. **Pixel**
   - Standard Android phone
   - Punch Hole camera
   - Dimensions: Standard

2. **Galaxy S**
   - Samsung flagship
   - Punch Hole camera
   - Dimensions: Standard

3. **Flip**
   - Foldable (vertical fold)
   - Punch Hole camera
   - Dimensions: Tall, narrow

4. **Fold**
   - Foldable (horizontal fold)
   - Punch Hole camera
   - Dimensions: Wide

### Recommendation
- Keep: Pixel, Galaxy S, Flip, Fold
- Remove: Model numbers (7, S23, etc.)

## iOS Tablets

### Current Devices
- iPad Pro → **iPad Pro** ✓
- iPad Air → **iPad Air** ✓
- iPad Mini → **iPad Mini** ✓

### Proposed Generalized Names

1. **iPad Mini**
   - Small tablet
   - Rounded corners
   - Dimensions: Compact

2. **iPad Air**
   - Standard tablet
   - Rounded corners
   - Dimensions: Standard

3. **iPad Pro**
   - Large tablet
   - Rounded corners
   - Dimensions: Large

### Recommendation
- Keep all as-is (already generalized)

## Android Tablets

### Current Devices
- Galaxy Tab S9 → **Galaxy Tab** (remove model number)

### Proposed Generalized Names

1. **Galaxy Tab**
   - Standard Android tablet
   - Rounded corners
   - Dimensions: Standard

### Recommendation
- Rename: Galaxy Tab S9 → **Galaxy Tab**

## macOS Laptops

### Current Devices
- MacBook Pro 16" → **MacBook Pro** (Large)
- MacBook Pro 14" → **MacBook Pro** (Standard)
- MacBook Air → **MacBook Air** ✓

### Proposed Generalized Names

1. **MacBook Air**
   - Thin and light
   - No notch
   - Dimensions: Standard

2. **MacBook Pro**
   - Professional
   - Notch
   - Dimensions: Standard (can represent both 14" and 16" as they're visually similar)

### Recommendation
- Keep: MacBook Air
- Merge: MacBook Pro 14" and 16" → **MacBook Pro** (use standard size, notch indicates Pro)

## Windows Laptops

### Current Devices
- Surface Laptop → **Surface Laptop** ✓

### Proposed Generalized Names

1. **Surface Laptop**
   - Standard Windows laptop
   - No notch
   - Dimensions: Standard

### Recommendation
- Keep as-is (already generalized)

## macOS Desktops

### Current Devices
- iMac 24" → **iMac** (remove size)
- Studio Display → **Studio Display** ✓
- Pro Display XDR → **Pro Display XDR** ✓

### Proposed Generalized Names

1. **iMac**
   - All-in-one desktop
   - Color-matched stand
   - Dimensions: Standard (24" is typical)

2. **Studio Display**
   - Monitor
   - Stand/base
   - Dimensions: Standard

3. **Pro Display XDR**
   - Professional monitor
   - Stand/base
   - Dimensions: Large

### Recommendation
- Rename: iMac 24" → **iMac**
- Keep: Studio Display, Pro Display XDR

## No Bezel Devices

### Current Devices
- Frameless Phone → **Frameless Phone** ✓
- Frameless Tablet → **Frameless Tablet** ✓
- Frameless Laptop → **Frameless Laptop** ✓
- Frameless Desktop → **Frameless Desktop** ✓

### Recommendation
- Keep all as-is (already generic)

## Summary of Changes

### Rename
- `iphone-14-pro` → `iphone-pro` (name: "iPhone Pro")
- `iphone-14` → `iphone` (name: "iPhone")
- `iphone-13` → `iphone` (name: "iPhone") - *merge with above*
- `pixel-7` → `pixel` (name: "Pixel")
- `samsung-s23` → `galaxy-s` (name: "Galaxy S")
- `galaxy-tab-s9` → `galaxy-tab` (name: "Galaxy Tab")
- `macbook-pro-16` → `macbook-pro` (name: "MacBook Pro")
- `macbook-pro-14` → `macbook-pro` (name: "MacBook Pro") - *merge with above*
- `imac-24` → `imac` (name: "iMac")

### Add
- `iphone-pro-max` (name: "iPhone Pro Max") - for large size variant

### Keep As-Is
- `iphone-se` → "iPhone SE"
- `galaxy-z-flip-5` → "Flip"
- `galaxy-z-fold-5` → "Fold"
- `ipad-pro` → "iPad Pro"
- `ipad-air` → "iPad Air"
- `ipad-mini` → "iPad Mini"
- `macbook-air` → "MacBook Air"
- `surface-laptop` → "Surface Laptop"
- `studio-display` → "Studio Display"
- `pro-display-xdr` → "Pro Display XDR"
- All frameless devices

## Implementation Notes

1. **Backward Compatibility**: Old device IDs should still work (map old IDs to new ones)
2. **Device Config**: Update `getDeviceConfig()` to handle both old and new IDs
3. **Name Mapping**: Update `DeviceTab.tsx` and `LayersTab.tsx` with new names
4. **Visual Differences**: Ensure device configs maintain appropriate size differences (e.g., Pro Max larger than Pro)

## Device Size Hierarchy

### Phones (iOS)
- Small: iPhone SE
- Standard: iPhone, iPhone Pro
- Large: iPhone Pro Max

### Phones (Android)
- Standard: Pixel, Galaxy S
- Foldable: Flip (tall), Fold (wide)

### Tablets
- Small: iPad Mini
- Standard: iPad Air, Galaxy Tab
- Large: iPad Pro

### Laptops
- Standard: MacBook Air, MacBook Pro, Surface Laptop

### Desktops
- Standard: iMac, Studio Display
- Large: Pro Display XDR
