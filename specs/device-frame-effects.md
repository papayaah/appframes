# Device Frame Visual Effects

## Overview

This spec proposes additional visual effects that can be applied to device frames to enhance compositions, especially when combined with 3D tilt/rotation transforms.

## Proposed Effects

### 1. Drop Shadow (Depth Effect) ⭐ **High Priority**

**User Story:** As an app marketer, I want to add depth to device frames, so compositions feel more dimensional and professional.

**Effect:**
- Configurable drop shadow on the frame wrapper
- Shadow intensity/opacity, blur radius, offset X/Y
- Shadow color (default: black with opacity, but could be colored for creative effects)
- Shadow should respect 3D tilt (shadow direction could follow tilt angle for realism)

**Implementation:**
- Add to `ScreenImage`: `shadowEnabled?: boolean`, `shadowBlur?: number`, `shadowOffsetX?: number`, `shadowOffsetY?: number`, `shadowColor?: string`
- Apply via `boxShadow` on `DraggableFrame` wrapper
- Default: subtle shadow (`0 10px 30px rgba(0,0,0,0.15)`)
- Range: blur 0-50px, offset -50 to +50px

**Why it's great:** Works beautifully with 3D tilt - shadows add depth and make tilted frames pop off the canvas.

---

### 2. Glow Effect (Halo) ⭐ **High Priority**

**User Story:** As an app marketer, I want frames to glow, so they stand out and create a premium, modern aesthetic.

**Effect:**
- Colored glow around the frame (like a halo)
- Glow color, intensity, blur radius
- Can be used for brand colors, accent colors, or subtle white glow

**Implementation:**
- Add to `ScreenImage`: `glowEnabled?: boolean`, `glowColor?: string`, `glowBlur?: number`, `glowIntensity?: number`
- Apply via multiple `boxShadow` layers or `filter: drop-shadow()`
- Example: `0 0 40px rgba(102, 126, 234, 0.6)` for blue glow

**Why it's great:** Creates a premium, app-store-like aesthetic. Colored glows can match brand colors.

---

### 3. Reflection Effect (Glass Surface)

**User Story:** As an app marketer, I want frames to have a glass-like reflection, so they look more realistic and premium.

**Effect:**
- Subtle reflection gradient overlay on the screen
- Mimics glossy screen surface
- Reflection intensity/opacity control
- Could be directional (top-to-bottom fade) or radial

**Implementation:**
- Add pseudo-element overlay on screen with gradient
- `background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%)`
- Add to `ScreenImage`: `reflectionEnabled?: boolean`, `reflectionIntensity?: number` (0-100)

**Why it's great:** Makes screens look more realistic, especially for phones and tablets. Works well with 3D tilt.

---

### 4. Border Effects

**User Story:** As an app marketer, I want to add colored borders or outlines to frames, so I can create visual groupings or brand consistency.

**Effect:**
- Colored border around frame
- Border width, color, style (solid, dashed, gradient)
- Border radius control (for custom shapes)

**Implementation:**
- Add to `ScreenImage`: `borderEnabled?: boolean`, `borderWidth?: number`, `borderColor?: string`, `borderStyle?: 'solid' | 'dashed' | 'dotted'`
- Apply via `border` CSS property on frame wrapper
- Range: width 0-20px

**Why it's great:** Simple but effective for creating visual hierarchy and brand consistency.

---

### 5. Lighting Effect (Directional Shadow Based on Tilt)

**User Story:** As an app marketer, I want shadows to automatically adjust based on tilt angle, so the 3D effect feels more realistic.

**Effect:**
- Shadow direction dynamically calculated from `tiltX` and `tiltY`
- Shadow offset follows the "light source" direction
- Creates realistic lighting that matches the 3D perspective

**Implementation:**
- Calculate shadow offset from tilt angles:
  - `shadowOffsetX = tiltY * shadowIntensity`
  - `shadowOffsetY = tiltX * shadowIntensity`
- Could be automatic (when tilt is applied) or manual override

**Why it's great:** Makes 3D tilts feel more realistic - shadows naturally follow the light source direction.

---

### 6. Opacity/Transparency Control

**User Story:** As an app marketer, I want to adjust frame opacity, so I can create layered, ghosted effects.

**Effect:**
- Frame opacity control (0-100%)
- Affects entire frame (device + screen)
- Useful for creating "ghost" frames or layered compositions

**Implementation:**
- Add to `ScreenImage`: `frameOpacity?: number` (0-100, default 100)
- Apply via `opacity` CSS property on `DraggableFrame` wrapper

**Why it's great:** Simple but powerful for creative compositions - ghost frames, overlays, etc.

---

### 7. Blur Effect (Background Blur)

**User Story:** As an app marketer, I want to blur the frame background, so I can create depth-of-field effects.

**Effect:**
- Backdrop blur on the frame (frosted glass effect)
- Blur radius control
- Could blur just the device frame, or create a backdrop blur effect

**Implementation:**
- Add to `ScreenImage`: `blurEnabled?: boolean`, `blurRadius?: number`
- Apply via `filter: blur()` or `backdrop-filter: blur()` on frame wrapper
- Range: 0-20px blur radius

**Why it's great:** Creates modern frosted glass aesthetic. Works well for overlays and depth effects.

---

### 8. Gradient Overlay

**User Story:** As an app marketer, I want to add color overlays to frames, so I can create mood or brand consistency.

**Effect:**
- Gradient overlay on top of the frame
- Color stops, direction, opacity
- Can be used for color grading or brand tinting

**Implementation:**
- Add to `ScreenImage`: `gradientOverlayEnabled?: boolean`, `gradientStops?: Array<{color: string, position: number}>`, `gradientDirection?: number` (degrees)
- Apply via pseudo-element with `background: linear-gradient()`
- Blend mode: `overlay` or `multiply` for subtle effects

**Why it's great:** Creative color grading - can make all frames feel cohesive or add mood.

---

### 9. Outline/Stroke Effect

**User Story:** As an app marketer, I want to add an outline around frames, so they stand out on busy backgrounds.

**Effect:**
- Colored outline/stroke around frame
- Width, color, offset (for outer stroke)
- Different from border (outline doesn't affect layout)

**Implementation:**
- Add to `ScreenImage`: `outlineEnabled?: boolean`, `outlineWidth?: number`, `outlineColor?: string`, `outlineOffset?: number`
- Apply via `outline` CSS property or `box-shadow` with spread radius
- Range: width 0-10px, offset -10 to +10px

**Why it's great:** Makes frames pop on complex backgrounds. Useful for export compositions.

---

### 10. Ambient Occlusion (Soft Shadow)

**User Story:** As an app marketer, I want soft, realistic shadows, so frames feel grounded on the canvas.

**Effect:**
- Soft, large-radius shadow that creates "contact shadow" effect
- Makes frames feel like they're sitting on a surface
- Multiple shadow layers for realism

**Implementation:**
- Combine multiple `boxShadow` layers:
  - Close shadow: `0 2px 4px rgba(0,0,0,0.1)`
  - Medium shadow: `0 8px 16px rgba(0,0,0,0.08)`
  - Far shadow: `0 20px 40px rgba(0,0,0,0.05)`
- Add to `ScreenImage`: `ambientOcclusionEnabled?: boolean`, `ambientOcclusionIntensity?: number`

**Why it's great:** Makes frames feel grounded and realistic. Professional look.

---

## Recommended Priority

### Phase 1 (High Impact, Easy Implementation)
1. **Drop Shadow** - Essential for depth, works great with 3D tilt
2. **Glow Effect** - Premium aesthetic, high visual impact
3. **Opacity Control** - Simple but versatile

### Phase 2 (Medium Impact)
4. **Lighting Effect** - Enhances 3D tilt realism
5. **Border Effects** - Useful for grouping/branding
6. **Outline/Stroke** - Good for export compositions

### Phase 3 (Creative/Advanced)
7. **Reflection Effect** - Realistic glass surface
8. **Blur Effect** - Modern frosted glass aesthetic
9. **Gradient Overlay** - Creative color grading
10. **Ambient Occlusion** - Professional realism

---

## Technical Considerations

### Performance
- Effects should use CSS properties (not canvas) for smooth performance
- Use `will-change` hints for animated effects
- Consider GPU acceleration (`transform: translateZ(0)`) for complex effects

### Export Compatibility
- All effects must render correctly in html-to-image export
- Some effects (backdrop-filter) may not work in all export contexts
- Test with actual export pipeline

### UI Controls
- Group related effects in `FrameSettingsPanel` or new "Effects" panel
- Use sliders for numeric values (blur, opacity, intensity)
- Use color pickers for color values
- Preset buttons for common combinations (e.g., "Subtle Shadow", "Premium Glow")

### Data Model
- All effects should be stored per-frame on `ScreenImage`
- Default values should be sensible (most effects disabled by default, or subtle presets)
- Effects should be independent (can combine multiple effects)

---

## Example Combinations

**Premium Look:**
- Drop shadow (medium blur, subtle offset)
- Glow effect (white, low intensity)
- Reflection (subtle, 20% intensity)

**Dramatic 3D:**
- Drop shadow (large blur, offset based on tilt)
- Lighting effect (automatic based on tiltX/tiltY)
- Opacity (100% - no change)

**Creative Overlay:**
- Gradient overlay (brand color, 30% opacity)
- Blur effect (light, 5px)
- Border (thin, brand color)

**Ghost Frame:**
- Opacity (40%)
- Glow effect (white, medium intensity)
- No shadow (or very subtle)
