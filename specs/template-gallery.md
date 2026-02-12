# Template Gallery

## Overview

A browseable template gallery where users discover and apply professionally designed multi-screen template sets. Inspired by appscreens.com's template library. Each template is a complete set of 4-6 coordinated screens (matching backgrounds, text styling, frame configuration) ready to use after swapping in screenshots.

This is different from the per-screen template picker in `screen-templates.md` -- that spec covers picking a template for a single screen. This spec covers a full gallery experience for discovering and applying complete multi-screen sets.

## What a Template Set Contains

A template set is a collection of coordinated screens that form a cohesive App Store / Play Store listing:

- **4-6 screens** designed to work together as a set
- **Consistent visual theme** across all screens (colors, fonts, frame style, layout)
- **Varied text per screen** ("Track your progress", "Share with friends", etc.) -- each screen has different headline/body text but same styling
- **Varied compositions** -- some screens might use single frame, others dual or fan, but all feel cohesive
- **No images** -- frame slots are empty, user drops in their own screenshots
- **Canvas size target** -- each template set targets a specific canvas size (iPhone 6.9", iPad, etc.) but can adapt

### Data Structure

```typescript
interface TemplateSet {
  id: string
  name: string                    // "Inner Glow", "Bold Gradient", etc.
  description?: string            // Short tagline
  tags: string[]                  // ["minimal", "dark", "gradient", "corporate", "playful"]
  device: 'iphone' | 'ipad' | 'android' | 'multi'  // Primary device target
  canvasSize: string              // Target canvas size ID
  thumbnailUrl?: string           // Pre-rendered preview image (optional, can render live)
  screens: TemplateScreen[]       // 4-6 coordinated screens
  metadata: {
    author?: string
    createdAt: string
    featured?: boolean
    popularity?: number           // Usage count for sorting
  }
}

interface TemplateScreen {
  // Everything from Screen except id and actual images
  settings: Omit<CanvasSettings, 'selectedScreenIndex' | 'selectedTextId'>
  textElements: Omit<TextElement, 'id'>[]
  images: Array<{
    // Frame config without actual image data
    deviceFrame: string
    diyOptions?: DIYOptions
    frameColor?: string
    frameScale?: number
    rotateZ?: number
    tiltX?: number
    tiltY?: number
    frameX?: number
    frameY?: number
    // Frame effects (from frame-effects spec)
    effects?: FrameEffects
  }>
}
```

## Gallery UI

### Page Location

The template gallery lives at `/templates` as a standalone page accessible from:
- The main app header (a "Templates" link/button)
- The "+" button in ScreensPanel (option: "From Template Set")
- The landing page

### Layout

#### Hero Section
- Headline: "Screenshot Templates" or similar
- Subtitle: brief description
- "Browse templates" CTA scrolls to the gallery grid
- Right side: animated/rotating preview of featured templates (3-4 overlapping template cards)

#### Filter Bar
A horizontal bar with filter controls:

| Filter | Options | Behavior |
|--------|---------|----------|
| **Device** | All, iPhone, iPad, Android | Filter by target device |
| **Tags** | Pill/chip selector from all available tags | Multi-select, AND logic |
| **Layout** | All, Single Frame, Multi Frame, Text-Heavy | Filter by composition style |
| **Sort** | Popular, Newest, Name A-Z | Sort order |
| **Search** | Free text input | Fuzzy match on name, description, tags |

- Show total template count (e.g., "42 templates")
- Filters update results instantly (no page reload)
- Active filters shown as dismissible chips

#### Template Cards Grid

2-column grid (responsive: 1 column on mobile). Each card:

```
+----------------------------------------------------------+
| Template Name                   Try in Sandbox | Use This |
|                                                           |
| +--------+ +--------+ +--------+ +--------+ +--------+   |
| |        | |        | |        | |        | |        |   |
| | Screen | | Screen | | Screen | | Screen | | Screen |   |
| |   1    | |   2    | |   3    | |   4    | |   5    |   |
| |        | |        | |        | |        | |        |   |
| +--------+ +--------+ +--------+ +--------+ +--------+   |
+----------------------------------------------------------+
```

- **Template name** -- top left, bold
- **Action buttons** -- top right:
  - "Try in Sandbox" -- opens a temporary preview project with the template applied
  - "Use This" -- applies the template set to the current project (replaces all screens)
- **Screen previews** -- horizontal row of miniature rendered screens showing the full design:
  - Background colors/gradients visible
  - Frame outlines with gray placeholder rectangles (no real screenshots)
  - Text elements rendered at small scale
  - Scroll horizontally if more than ~5 screens
- **Hover state** -- subtle scale-up, shadow increase
- **Tag pills** -- small colored pills below the name showing 1-2 primary tags

### Screen Preview Rendering

Each miniature screen in the template card is a live-rendered mini canvas (not a static image). This reuses the existing canvas rendering pipeline at a small scale:

- Render at ~120x260px (for portrait phone templates)
- Show background, frame outlines (gray fill), text elements
- No interactivity -- purely visual
- Use `transform: scale()` on the existing canvas component for rendering
- Alternatively, pre-render as static thumbnails at build time or on first load and cache

## User Flows

### Flow 1: Browse and Apply

1. User navigates to `/templates` (or opens template gallery from app)
2. Browses the grid, optionally filtering by device/tags/layout
3. Sees template cards with multi-screen previews
4. Clicks "Use This" on a template
5. If in the app: confirmation dialog ("This will replace your current screens. Continue?")
6. All screens in the template set are created in the user's current project
7. User is taken to the editor with the new screens visible
8. Frame slots are empty -- user drops in screenshots

### Flow 2: Try in Sandbox

1. User clicks "Try in Sandbox" on a template card
2. A temporary/ephemeral project is created with the template screens
3. User can explore the screens, see how they look, maybe drop in a test image
4. Two options:
   - "Use This Template" -- applies to their real project
   - Close/navigate away -- sandbox is discarded
5. Sandbox projects are not persisted to the project list

### Flow 3: Quick Apply from App

1. User is in the editor, clicks "+" in ScreensPanel
2. Dropdown shows "Blank Screen" and "From Template Set"
3. Clicking "From Template Set" opens a modal with the gallery grid (simplified -- no hero, just filters + grid)
4. Clicking a template applies it (same as Flow 1, step 5+)

## Template Categories/Tags

Tags are flexible strings, but we seed with a curated set:

### Style Tags
- `minimal` -- clean, white/light backgrounds, simple typography
- `bold` -- vibrant colors, large text, dynamic layouts
- `dark` -- dark backgrounds, light text, moody
- `gradient` -- colorful gradient backgrounds
- `editorial` -- text-heavy, magazine-style
- `playful` -- fun colors, rounded elements, casual fonts
- `corporate` -- professional, muted colors, structured layouts
- `premium` -- luxury aesthetic, serif fonts, gold/dark accents

### Layout Tags
- `single-frame` -- one device per screen
- `multi-frame` -- 2-3 devices per screen
- `text-heavy` -- large text areas dominating the layout
- `showcase` -- fan/triple compositions showing multiple views

### Use Case Tags
- `app-store` -- designed for Apple App Store dimensions
- `play-store` -- designed for Google Play Store
- `both` -- works for either store

## Starter Template Sets

### "Inner Glow"
- **Tags**: `dark`, `premium`, `single-frame`
- **Style**: Dark backgrounds with subtle inner glow effect on frames, clean sans-serif text
- **Screens**: 5 screens, each with a single centered phone frame, white headline text, short subtitle
- **Colors**: Background `#0a0a0a`, text white, frame glow effect in accent color

### "Bold Gradient"
- **Tags**: `bold`, `gradient`, `single-frame`
- **Style**: Vibrant gradient backgrounds (different gradient per screen but same family), large bold headlines
- **Screens**: 5 screens with gradients cycling through purple/blue/pink, centered phone frames
- **Colors**: Gradients from `#667eea`/`#764ba2` family, white text

### "Clean Minimal"
- **Tags**: `minimal`, `single-frame`, `app-store`
- **Style**: White/light gray backgrounds, thin sans-serif text, lots of whitespace
- **Screens**: 5 screens, each with centered phone, small headline, small subtitle
- **Colors**: Background white, text `#1a1a1a`, subtle gray accents

### "Feature Tour"
- **Tags**: `showcase`, `multi-frame`, `bold`
- **Style**: Each screen highlights a feature with 2-3 frames at angles
- **Screens**: 5 screens mixing dual and triple compositions, bold headlines per feature
- **Colors**: Consistent brand gradient across all screens

### "Magazine"
- **Tags**: `editorial`, `text-heavy`, `premium`
- **Style**: Large left-aligned headlines with phone offset to the right, magazine-like layout
- **Screens**: 5 screens, each with a big statement headline and smaller phone frame positioned to the side
- **Colors**: Alternating black and white backgrounds, serif font headlines

### "Playful Cards"
- **Tags**: `playful`, `gradient`, `single-frame`
- **Style**: Rounded corners, fun gradient backgrounds, casual font, emoji-friendly text
- **Screens**: 5 screens with soft pastel gradients, centered phone, playful headlines
- **Colors**: Soft pastels, rounded frame corners via DIY options

### "Corporate Pro"
- **Tags**: `corporate`, `minimal`, `both`
- **Style**: Professional look, structured grid, muted blue/gray palette
- **Screens**: 5 screens with clean layouts, some single/some dual frame, business-appropriate text
- **Colors**: `#2c3e50` text, `#ecf0f1` backgrounds, subtle blue accents

### "Dark Showcase"
- **Tags**: `dark`, `showcase`, `multi-frame`
- **Style**: Dark backgrounds with fan/triple compositions showing multiple angles
- **Screens**: 5 screens, mix of fan and triple layouts, dramatic lighting feel
- **Colors**: Dark gradients, white/light text, colored glow effects on frames

## Implementation Notes

### Storage
- Template sets are stored as static JSON files bundled with the app (no backend needed for v1)
- File: `lib/templates/index.ts` exports all template sets
- Each template set is a separate file: `lib/templates/inner-glow.ts`, etc.
- Pre-rendered thumbnails stored in `public/templates/` as PNGs (optional optimization)

### Applying a Template Set
```typescript
function applyTemplateSet(templateSet: TemplateSet): Screen[] {
  return templateSet.screens.map((templateScreen, index) => ({
    id: generateId(),
    name: `Screen ${index + 1}`,
    settings: {
      ...templateScreen.settings,
      selectedScreenIndex: index,
    },
    images: templateScreen.images.map(img => ({
      ...img,
      // No actual image data -- slots are empty
      mediaId: undefined,
      image: undefined,
    })),
    textElements: templateScreen.textElements.map(t => ({
      ...t,
      id: generateId(),
    })),
  }))
}
```

### Routing
- `/templates` -- full gallery page (public, doesn't require auth)
- Gallery can also be opened as a modal within the `/app` editor

### Performance
- Lazy-load template card previews (only render visible cards via intersection observer)
- Use virtual scrolling if template count grows beyond ~50
- Pre-render thumbnail images at build time as a fallback for slow devices

## What This Does NOT Include

- **User-created template sets** (save your project as a template): future feature
- **Template marketplace** (sell/share templates): future feature
- **AI-generated templates**: future feature
- **Template customization before applying** (change colors in the gallery): just apply and edit in the app
- **Partial application** (apply only 3 of 5 screens): apply the full set, then delete unwanted screens
