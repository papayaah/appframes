# Frame Effects (v2)

## Overview

Visual effects applied to device frames to create polished, professional compositions. This builds on the ideas in `device-frame-effects.md` with a refined scope, concrete UI design, and additional creative effects.

Effects are per-frame (each frame slot in a screen can have different effects) and combine freely.

## Data Model

All effects live on `ScreenImage` in a nested `effects` object:

```typescript
interface FrameEffects {
  // Drop Shadow
  shadow?: {
    enabled: boolean
    offsetX: number        // -50 to 50, default 0
    offsetY: number        // -50 to 50, default 10
    blur: number           // 0 to 80, default 30
    spread: number         // -20 to 40, default 0
    color: string          // default "rgba(0,0,0,0.25)"
    // When true, shadow direction auto-adjusts based on frame tilt
    followTilt: boolean    // default false
  }

  // Glow (colored halo around frame)
  glow?: {
    enabled: boolean
    color: string          // default "#7c3aed" (purple)
    blur: number           // 0 to 100, default 40
    intensity: number      // 0 to 100 (maps to opacity), default 60
    // Pulse animation (for in-app preview only, not exported)
    animated: boolean      // default false
  }

  // Reflection (glossy screen overlay)
  reflection?: {
    enabled: boolean
    intensity: number      // 0 to 100, default 20
    angle: number          // 0 to 360, direction of light source, default 135
  }

  // Border / Outline
  border?: {
    enabled: boolean
    width: number          // 0 to 20, default 2
    color: string          // default "#ffffff"
    style: 'solid' | 'dashed' | 'dotted' | 'gradient'
    gradientFrom?: string  // for gradient style
    gradientTo?: string    // for gradient style
    radius: number         // extra border radius beyond frame's own, 0 to 40, default 0
  }

  // Opacity
  opacity?: number         // 0 to 100, default 100

  // Gradient Overlay (color tint on the screen content)
  colorOverlay?: {
    enabled: boolean
    color: string          // default "#000000"
    opacity: number        // 0 to 100, default 0
    blendMode: 'normal' | 'multiply' | 'overlay' | 'screen' | 'soft-light'
  }

  // Backdrop Shadow (soft contact shadow beneath the frame)
  contactShadow?: {
    enabled: boolean
    blur: number           // 0 to 60, default 20
    opacity: number        // 0 to 100, default 15
    offsetY: number        // 0 to 40, default 5
    // Elliptical shape for realistic ground shadow
    scaleX: number         // 50 to 150, default 90
  }

  // Neon Outline (animated glowing outline distinct from glow)
  neonOutline?: {
    enabled: boolean
    color: string          // default "#00ff88"
    width: number          // 1 to 6, default 2
    blur: number           // 0 to 30, default 10
    opacity: number        // 0 to 100, default 80
  }

  // 3D Floating Effect (layered shadow to simulate height)
  floating?: {
    enabled: boolean
    height: number         // 0 to 5 (abstract levels), default 2
    // Generates multi-layered shadows that increase in blur/offset
  }

  // Frosted Glass (blur the area behind the frame)
  frost?: {
    enabled: boolean
    blur: number           // 0 to 20, default 8
    opacity: number        // 0 to 100 (frame background opacity), default 90
  }
}
```

## Effects Detail

### 1. Drop Shadow

The essential depth effect. A configurable shadow cast by the frame.

**CSS approach:**
```css
box-shadow: [offsetX]px [offsetY]px [blur]px [spread]px [color];
```

**Tilt-following mode:** When `followTilt` is true, shadow offset is computed from the frame's `tiltX` and `tiltY`:
```
effectiveOffsetX = shadow.offsetX + (tiltY * 0.5)
effectiveOffsetY = shadow.offsetY + (tiltX * 0.5)
```

**Presets:**
| Preset | offsetX | offsetY | blur | spread | color |
|--------|---------|---------|------|--------|-------|
| Subtle | 0 | 4 | 12 | 0 | rgba(0,0,0,0.10) |
| Medium | 0 | 10 | 30 | 0 | rgba(0,0,0,0.20) |
| Heavy | 0 | 20 | 50 | 5 | rgba(0,0,0,0.30) |
| Directional | 10 | 10 | 20 | 0 | rgba(0,0,0,0.20) |

---

### 2. Glow

A colored halo radiating from the frame's edges. Creates a premium, modern aesthetic.

**CSS approach:**
```css
/* Multiple box-shadows for a soft, natural glow */
box-shadow:
  0 0 [blur*0.5]px [color at intensity],
  0 0 [blur]px [color at intensity*0.6],
  0 0 [blur*1.5]px [color at intensity*0.3];
```

**Presets:**
| Preset | color | blur | intensity |
|--------|-------|------|-----------|
| Purple Haze | #7c3aed | 40 | 60 |
| Blue Neon | #3b82f6 | 50 | 70 |
| Sunset | #f97316 | 35 | 50 |
| White Soft | #ffffff | 30 | 40 |
| Brand Match | (auto from bg) | 40 | 60 |

**"Brand Match" mode:** Auto-pick glow color from the screen's background gradient dominant color for instant cohesion.

---

### 3. Reflection (Glossy Screen)

A subtle glass-like reflection overlay on the screen area (not the frame bezel).

**CSS approach:**
```css
/* Pseudo-element overlay on the screen content area */
.screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    [angle]deg,
    rgba(255,255,255, [intensity * 0.002]) 0%,
    transparent 40%
  );
  pointer-events: none;
}
```

Works best on dark screenshots. Subtle by default -- should enhance, not obscure content.

---

### 4. Border / Outline

A colored border around the frame, useful for visual grouping and brand consistency.

**CSS approach:**
```css
/* Solid border */
border: [width]px [style] [color];
border-radius: [frame-radius + radius]px;

/* Gradient border -- use background-clip trick */
background: linear-gradient([gradientFrom], [gradientTo]);
-webkit-background-clip: padding-box;
border: [width]px solid transparent;
```

**Presets:**
| Preset | width | color | style |
|--------|-------|-------|-------|
| Thin White | 1 | #ffffff | solid |
| Brand Accent | 2 | (brand color) | solid |
| Rainbow | 2 | gradient | gradient |
| Dashed | 2 | #ffffff | dashed |

---

### 5. Contact Shadow

A soft, elliptical "ground" shadow beneath the frame, making it feel like the device is sitting on a surface. Different from drop shadow -- this is wider and softer, simulating ambient occlusion.

**CSS approach:**
```css
/* Pseudo-element beneath the frame */
.frame-wrapper::before {
  content: '';
  position: absolute;
  bottom: -[offsetY]px;
  left: 50%;
  transform: translateX(-50%) scaleX([scaleX/100]);
  width: 80%;
  height: 20px;
  background: radial-gradient(
    ellipse at center,
    rgba(0,0,0,[opacity/100]) 0%,
    transparent 70%
  );
  filter: blur([blur]px);
}
```

---

### 6. Neon Outline

A glowing colored outline that traces the frame's shape. Different from glow (which is a soft halo) -- this is a sharp, defined outline with glow.

**CSS approach:**
```css
/* Outline glow via box-shadow */
box-shadow:
  0 0 [blur]px [color at opacity],
  inset 0 0 [blur*0.5]px [color at opacity*0.3];
border: [width]px solid [color at opacity];
```

Works especially well on dark backgrounds. Creates a cyberpunk/gaming aesthetic.

---

### 7. Floating Effect

Simulates the device hovering above the canvas at different heights using multi-layered progressive shadows. The higher the "height" level, the more shadow layers with increasing blur and offset.

**CSS approach (height levels):**
```
Level 1: box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)
Level 2: box-shadow: 0 3px 6px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)
Level 3: box-shadow: 0 10px 20px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)
Level 4: box-shadow: 0 15px 25px rgba(0,0,0,0.10), 0 5px 10px rgba(0,0,0,0.06)
Level 5: box-shadow: 0 20px 40px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)
```

This is a simplified alternative to manually configuring drop shadow. Good for users who just want "make it look elevated" without tweaking values.

---

### 8. Frosted Glass

Makes the frame semi-transparent with a backdrop blur, creating a frosted glass appearance. The canvas background shows through the frame area with a blur effect.

**CSS approach:**
```css
.frame-wrapper {
  backdrop-filter: blur([blur]px);
  background: rgba(255,255,255, [opacity/100]);
}
```

**Caveat:** `backdrop-filter` has inconsistent support in `html-to-image` export. May need a fallback (render blurred background copy behind the frame for export).

---

## UI Design

### Location in Settings Sidebar

When a frame is selected, the SettingsSidebar already shows "Frame" and "Image" sections. Add a third section: **"Effects"**.

```
+-- Settings Sidebar --+
| FRAME                |
| [frame controls]     |
|                      |
| IMAGE                |
| [image controls]     |
|                      |
| EFFECTS              |
| [effect controls]    |
+----------------------+
```

### Effects Panel Layout

The Effects section uses a compact, toggle-based layout. Each effect is a collapsible row:

```
+-- EFFECTS -----------------------------------------+
|                                                     |
| [Presets: None | Subtle | Premium | Dramatic | Neon]|
|                                                     |
| Shadow                                    [toggle]  |
|   Offset Y  [========|====] 10                      |
|   Blur      [==========|==] 30                      |
|   Color     [#] rgba(0,0,0,0.25)                    |
|   [ ] Follow tilt                                   |
|                                                     |
| Glow                                      [toggle]  |
|   Color     [#] #7c3aed                             |
|   Blur      [========|====] 40                      |
|   Intensity [==========|==] 60                      |
|                                                     |
| Reflection                                [toggle]  |
|   Intensity [====|========] 20                      |
|                                                     |
| Border                                    [toggle]  |
|   Width     [=|===========] 2                       |
|   Color     [#] #ffffff                             |
|   Style     [solid] [dashed] [gradient]             |
|                                                     |
| Opacity     [==================|] 100               |
|                                                     |
| [+ More Effects]                                    |
|   Contact Shadow, Neon Outline, Floating, Frost     |
+----------------------------------------------------+
```

- **Top-level presets** apply curated combinations with one click
- Each effect has a toggle switch (on/off) and expandable controls
- Color pickers use the same color editor already in the app
- Sliders show numeric values
- "More Effects" expands to show less common effects

### Effect Presets (One-Click Combinations)

| Preset | Shadow | Glow | Reflection | Border | Other |
|--------|--------|------|------------|--------|-------|
| **None** | off | off | off | off | -- |
| **Subtle** | medium, followTilt | off | 15% | off | -- |
| **Premium** | medium | white soft | 20% | thin white | -- |
| **Dramatic** | heavy | off | off | off | floating level 4 |
| **Neon** | off | blue neon | off | neon outline | -- |
| **Floating** | off | off | off | off | floating level 3, contact shadow |

### Applying Effects to Multiple Frames

When multiple frames exist in a composition (dual, triple, fan):
- Effects are per-frame by default
- Add an "Apply to all frames" button that copies the current frame's effects to all other frames in the same screen
- When selecting a different frame, show its own effects (which may differ)

## CSS Implementation

All effects are applied on the frame wrapper element in `DraggableFrame` or `DeviceFrame`. Multiple effects combine naturally via CSS:

```typescript
function getFrameEffectStyles(effects: FrameEffects, tiltX = 0, tiltY = 0): React.CSSProperties {
  const shadows: string[] = []
  const styles: React.CSSProperties = {}

  // Drop shadow
  if (effects.shadow?.enabled) {
    const s = effects.shadow
    const ox = s.followTilt ? s.offsetX + tiltY * 0.5 : s.offsetX
    const oy = s.followTilt ? s.offsetY + tiltX * 0.5 : s.offsetY
    shadows.push(`${ox}px ${oy}px ${s.blur}px ${s.spread}px ${s.color}`)
  }

  // Glow
  if (effects.glow?.enabled) {
    const g = effects.glow
    const alpha = g.intensity / 100
    const c = hexToRgba(g.color, alpha)
    shadows.push(`0 0 ${g.blur * 0.5}px ${c}`)
    shadows.push(`0 0 ${g.blur}px ${hexToRgba(g.color, alpha * 0.6)}`)
    shadows.push(`0 0 ${g.blur * 1.5}px ${hexToRgba(g.color, alpha * 0.3)}`)
  }

  // Neon outline
  if (effects.neonOutline?.enabled) {
    const n = effects.neonOutline
    const c = hexToRgba(n.color, n.opacity / 100)
    shadows.push(`0 0 ${n.blur}px ${c}`)
    shadows.push(`inset 0 0 ${n.blur * 0.5}px ${hexToRgba(n.color, n.opacity * 0.3 / 100)}`)
    styles.border = `${n.width}px solid ${c}`
  }

  // Floating
  if (effects.floating?.enabled) {
    const level = effects.floating.height
    // Progressive shadow layers based on height
    const layers = getFloatingShadowLayers(level)
    shadows.push(...layers)
  }

  if (shadows.length > 0) {
    styles.boxShadow = shadows.join(', ')
  }

  // Border
  if (effects.border?.enabled) {
    const b = effects.border
    if (b.style === 'gradient' && b.gradientFrom && b.gradientTo) {
      // Gradient border via background trick
      styles.backgroundImage = `linear-gradient(135deg, ${b.gradientFrom}, ${b.gradientTo})`
      styles.backgroundClip = 'padding-box'
      styles.border = `${b.width}px solid transparent`
    } else {
      styles.border = `${b.width}px ${b.style} ${b.color}`
    }
    if (b.radius > 0) {
      styles.borderRadius = b.radius
    }
  }

  // Opacity
  if (effects.opacity != null && effects.opacity < 100) {
    styles.opacity = effects.opacity / 100
  }

  // Frost
  if (effects.frost?.enabled) {
    styles.backdropFilter = `blur(${effects.frost.blur}px)`
    styles.WebkitBackdropFilter = `blur(${effects.frost.blur}px)`
  }

  return styles
}
```

## Export Compatibility

Effects that use standard CSS (`box-shadow`, `border`, `opacity`, `filter`) export cleanly with `html-to-image`.

Potentially problematic:
- `backdrop-filter` (frost) -- may not render in export. Fallback: skip frost in export or pre-render a blurred background copy.
- Animated glow pulse -- disable during export (already handled by `data-export-hide` pattern).

Test each effect with the actual export pipeline before shipping.

## Implementation Priority

### Phase 1 (ship first -- highest impact, easiest)
1. **Drop Shadow** -- essential, pure CSS, works with tilt
2. **Glow** -- high visual impact, pure CSS
3. **Floating** -- simple preset-based shadow layers
4. **Opacity** -- single CSS property
5. **Presets** -- one-click combinations of the above

### Phase 2 (ship next -- medium complexity)
6. **Border** -- straightforward, gradient variant needs care
7. **Neon Outline** -- builds on glow/border
8. **Contact Shadow** -- pseudo-element, moderate complexity

### Phase 3 (ship later -- advanced/risky)
9. **Reflection** -- pseudo-element overlay, needs care not to obscure content
10. **Color Overlay** -- pseudo-element with blend modes
11. **Frosted Glass** -- `backdrop-filter` export issues
