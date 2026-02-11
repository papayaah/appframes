# Screen Templates Spec

## Overview

A template gallery that lets users start from pre-designed screen layouts instead of blank canvases. Each template is a fully configured screen — background, composition, device frame(s), text elements with styling, and frame transforms — ready to use after swapping in their own screenshots.

## How It Works

### Browsing Templates

When a user creates a new project or adds a new screen, they see a template picker. Templates are displayed as thumbnail cards in a scrollable grid, organized by category. Clicking a template applies it to the current screen (or creates a new screen from it).

### What a Template Contains

A template is a serialized `Screen` object with everything pre-configured:

- **Canvas settings**: background color/gradient, composition type (single/dual/stack/triple/fan), orientation
- **Frame configuration(s)**: device type + DIY options (bezel, cutout, corners, camera), frame color, transforms (scale, rotation, tilt, position)
- **Text elements**: pre-written placeholder text ("Your App Name", "Feature description here"), fully styled (font, size, weight, color, shadow, background, position)
- **No images**: frames ship empty — the user drops in their own screenshots

### Applying a Template

When the user picks a template:

1. A new screen is created (or the current blank screen is replaced)
2. All template properties are applied (settings, frames, text elements)
3. The frame slots are empty, waiting for the user to drop in images
4. The user can then customize anything — the template is just a starting point

## Template Categories

Templates are grouped by visual style:

| Category | Description |
|----------|-------------|
| **Minimal** | Clean backgrounds (white, light gray), single or dual frames, simple sans-serif text |
| **Bold** | Vibrant gradient backgrounds, large bold headlines, dynamic frame transforms (tilts, rotations) |
| **Dark** | Dark/black backgrounds, light text, subtle shadows, moody aesthetic |
| **Gradient** | Colorful gradient backgrounds, complementary frame colors, modern feel |
| **Showcase** | Triple/fan compositions, multiple frames at angles, "feature tour" layouts |
| **Editorial** | Text-heavy layouts, large typography, magazine-style with frames as supporting elements |

## Starter Templates

### Minimal

**Clean Single**
- Background: `#FFFFFF`
- Composition: `single`
- Frame: iPhone Pro, no tilt, scale 100%, centered
- Text: one element top-center — "Your App Name" in Inter 32px weight 700, color `#1a1a1a`

**Minimal Duo**
- Background: `#F5F5F5`
- Composition: `dual`
- Frames: 2x iPhone Pro, no transforms
- Text: headline top-center — "Feature One & Two" in Inter 28px weight 600, color `#333333`

**Floating Single**
- Background: `#FAFAFA`
- Composition: `single`
- Frame: iPhone Pro, scale 90%, subtle shadow via tiltX 5°
- Text: title top-center, subtitle below — clean hierarchy

### Bold

**Hero Gradient**
- Background: linear gradient `#667eea` → `#764ba2`
- Composition: `single`
- Frame: iPhone Pro, white frame color, scale 95%
- Text: big headline "Introducing" in Poppins 40px weight 800 white, subtext below in 18px weight 400

**Tilted Pair**
- Background: linear gradient `#f093fb` → `#f5576c`
- Composition: `dual`
- Frames: both tilted (rotateZ ±8°), scale 85%
- Text: center headline in Montserrat 36px weight 900 white

**Triple Showcase**
- Background: linear gradient `#4facfe` → `#00f2fe`
- Composition: `triple`
- Frames: center frame larger (scale 100%), sides smaller (scale 85%) with slight tilt
- Text: headline top, three small labels under each frame

### Dark

**Dark Elegance**
- Background: `#0a0a0a`
- Composition: `single`
- Frame: iPhone Pro, dark gray frame color `#1a1a1a`, scale 95%
- Text: headline in Playfair Display 34px weight 700 white, subtle text shadow

**Midnight Duo**
- Background: linear gradient `#0f0c29` → `#302b63` → `#24243e`
- Composition: `dual`
- Frames: iPhone Pro, frame color `#2a2a2a`
- Text: headline in Space Grotesk 30px weight 600 `#e0e0e0`

### Gradient

**Sunset Glow**
- Background: linear gradient `#fa709a` → `#fee140`
- Composition: `single`
- Frame: iPhone Pro, white frame, scale 90%, rotateZ 5°
- Text: title in Nunito 36px weight 800 white with text shadow

**Ocean Breeze**
- Background: linear gradient `#a8edea` → `#fed6e3`
- Composition: `dual`
- Frame: iPhone Pro, white frame
- Text: headline in Quicksand 32px weight 700 `#2d3436`

### Showcase

**Fan Display**
- Background: `#1a1a2e`
- Composition: `fan`
- Frames: 3x iPhone Pro in fan arrangement, white frames
- Text: large title top-center in Poppins 38px weight 800 white

**Feature Tour**
- Background: linear gradient `#6c5ce7` → `#a29bfe`
- Composition: `triple`
- Frames: center prominent, sides angled
- Text: main headline + three feature labels ("Fast", "Simple", "Secure") positioned near each frame

**Stacked Comparison**
- Background: `#dfe6e9`
- Composition: `stack`
- Frames: 2x iPhone Pro stacked, slight offset
- Text: "Before" / "After" labels, headline top

### Editorial

**Magazine Hero**
- Background: `#FFFFFF`
- Composition: `single`
- Frame: iPhone Pro, small scale 70%, positioned to the right (frameX offset)
- Text: large left-aligned headline in Playfair Display 48px weight 900 `#1a1a1a`, body text below in Inter 16px

**Bold Statement**
- Background: `#000000`
- Composition: `single`
- Frame: iPhone Pro, scale 75%, positioned right
- Text: huge left-aligned text in Space Grotesk 56px weight 900 white, "The future of [X]"

## UI Design

### Where Templates Appear

**1. New screen creation**
When clicking "+" to add a screen, show two options:
- "Blank Screen" (current behavior)
- "From Template" → opens template picker

**2. Template picker panel**
A modal or sidebar panel with:
- Category tabs/pills across the top (Minimal, Bold, Dark, Gradient, Showcase, Editorial)
- Grid of template thumbnail cards (2-3 per row)
- Each card shows a small preview rendering of the template (with gray placeholder rectangles where screenshots would go)
- Hovering a card shows the template name
- Clicking a card applies it and closes the picker

**3. Screens panel integration**
In the bottom screens strip, the "+" button gets a small dropdown: "Blank" or "Template"

### Template Card

Each card in the grid:
- Aspect ratio matches the most common canvas size (e.g., iPhone 6.9")
- Shows a miniature rendering: background color/gradient, frame outlines (gray fill as placeholder), text elements
- Template name below the card
- Category badge (optional)

## Data Structure

```typescript
interface ScreenTemplate {
  id: string
  name: string
  category: 'minimal' | 'bold' | 'dark' | 'gradient' | 'showcase' | 'editorial'
  // The screen data to apply (no images, just layout + style)
  screen: Omit<Screen, 'id'>
}
```

Templates are stored as a static array in a `templates.ts` file — no database needed. Each template is a hardcoded `Screen` object with all properties filled in except images.

### Applying a Template

```typescript
function applyTemplate(template: ScreenTemplate): Screen {
  return {
    ...template.screen,
    id: generateId(),
    // Ensure fresh IDs for text elements
    textElements: template.screen.textElements.map(t => ({
      ...t,
      id: generateId()
    }))
  }
}
```

## What This Does NOT Include

- **Multi-screen templates** (e.g., "generate 5 screens for an Apple listing"): out of scope for v1. Each template is one screen. Users can apply different templates to different screens manually.
- **User-created templates** (save current screen as template): future feature.
- **Template previews with real images**: templates always show placeholder frames.
- **AI-generated templates**: all templates are hand-crafted in code.

## Implementation Notes

- Templates reference device types by `diyTemplateId` (e.g., `"iphone-pro"`) so they work with the existing DIY system
- Text element positions use the 0-100% coordinate system already in place
- Background gradients use the existing gradient string format (e.g., `"linear-gradient(135deg, #667eea, #764ba2)"`)
- Template thumbnails can be pre-rendered as static images, or rendered live at small scale using the existing canvas renderer
- The template picker should respect the current canvas size — all templates work at any size since they use relative positioning
