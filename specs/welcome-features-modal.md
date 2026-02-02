# Welcome Features Modal

## Overview

A modal that displays on app load to showcase features and provide a video demo. Users can dismiss it and optionally choose to never see it again.

**Status**: ❌ Not started

## Goals

- Introduce new users to the app's key features
- Provide a video demo placeholder for future content
- Allow users to permanently dismiss the modal
- Create a welcoming first-time user experience

## Non-goals

- Forced onboarding flow (users can skip immediately)
- Complex multi-step tutorial wizard
- Analytics/tracking of modal interactions

## User Stories

**US1**: As a new user, I want to see an overview of app features when I first open the app, so that I understand what I can do.

**US2**: As a returning user, I want to skip the welcome modal permanently, so that I can get straight to work.

**US3**: As any user, I want to be able to access the features overview again later if I need it.

## Acceptance Criteria

### AC1: Modal Display on Load
- [ ] Modal opens automatically when app loads
- [ ] Modal only shows if user hasn't checked "Don't show again"
- [ ] Modal is centered and responsive
- [ ] Modal can be closed by clicking X, clicking outside, or pressing Escape

### AC2: Features Content
- [ ] Display a title/heading (e.g., "Welcome to AppFrames")
- [ ] Show a list of key features with icons or visual indicators
- [ ] Embed YouTube video demo (aspect ratio 16:9)
- [ ] Video autoplays muted with no player controls
- [ ] Video loops continuously
- [ ] Use sample YouTube video initially (can be swapped later)

### AC3: Don't Show Again
- [ ] Checkbox at bottom: "Don't show this again"
- [ ] Preference persists in IndexedDB (appState table)
- [ ] Preference survives browser refresh and app restarts

### AC4: Re-access Features
- [ ] Add menu item or button to re-open the modal (e.g., in help menu or settings)
- [ ] When opened manually, hide the "Don't show again" checkbox (or show reset option)

## Data Model

```typescript
// Addition to appState in PersistenceDB
interface AppState {
  // ... existing fields
  hideWelcomeModal?: boolean;  // Default: false (show modal)
}

// Feature item for display
interface FeatureItem {
  icon: string;        // Mantine icon name or emoji
  title: string;
  description: string;
}
```

## Features to Highlight

1. **Device Frames** - Add realistic device frames to your screenshots
2. **DIY Customization** - Build custom frames with bezel, cutout, and style options
3. **Multiple Screens** - Organize screens by canvas size
4. **Export Options** - Export as PNG, JPG, or copy to clipboard
5. **Rotation & Scale** - Transform frames with rotation and scaling controls
6. **Offline-First** - Your work saves automatically, even offline

## UI Components

### Modal Structure
```
┌─────────────────────────────────────────┐
│  Welcome to AppFrames              [X]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │    YOUTUBE EMBED                │    │
│  │    (16:9 aspect ratio)          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ✨ Key Features                        │
│                                         │
│  📱 Device Frames                       │
│     Add realistic frames to screenshots │
│                                         │
│  🎨 DIY Customization                   │
│     Build custom frames your way        │
│                                         │
│  📐 Rotation & Scale                    │
│     Transform frames with precision     │
│                                         │
│  💾 Auto-Save                           │
│     Your work saves automatically       │
│                                         │
├─────────────────────────────────────────┤
│  ☐ Don't show this again    [Get Started]│
└─────────────────────────────────────────┘
```

### Component Location
- `/components/WelcomeModal/WelcomeModal.tsx` - Main modal component
- `/components/WelcomeModal/FeaturesList.tsx` - Features list component (optional)

### Mantine Components Used
- `Modal` - Container
- `Stack`, `Group` - Layout
- `Title`, `Text` - Typography
- `Checkbox` - Don't show again toggle
- `Button` - Get Started / Close action
- `AspectRatio` - YouTube embed wrapper (16:9)
- `ThemeIcon` or icons - Feature icons

### YouTube Embed
```typescript
// Sample YouTube video for initial implementation
const DEMO_VIDEO_ID = 'dQw4w9WgXcQ'; // Replace with actual demo video later

// Embed URL with autoplay (muted) and no controls
const embedUrl = `https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${DEMO_VIDEO_ID}`;
```

**YouTube Parameters:**
- `autoplay=1` - Start playing automatically
- `mute=1` - Muted audio (required for autoplay in browsers)
- `controls=0` - Hide player controls
- `loop=1&playlist={ID}` - Loop the video continuously

```tsx
<AspectRatio ratio={16 / 9}>
  <iframe
    src={embedUrl}
    title="AppFrames Demo"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    style={{ border: 0, borderRadius: 8 }}
  />
</AspectRatio>
```

## Implementation Tasks

### Phase 1: Core Modal
- [ ] Create `WelcomeModal.tsx` component
- [ ] Add YouTube embed with 16:9 aspect ratio (sample video)
- [ ] Create features list with icons and descriptions
- [ ] Style modal with Mantine components
- [ ] Add "Get Started" button to close modal

### Phase 2: Persistence
- [ ] Add `hideWelcomeModal` field to appState in IndexedDB
- [ ] Create hook or utility to read/write preference
- [ ] Implement "Don't show again" checkbox
- [ ] Load preference on app start and conditionally show modal

### Phase 3: Integration
- [ ] Import and render modal in main app layout
- [ ] Add trigger to re-open modal from help/settings menu
- [ ] Test persistence across browser sessions

### Phase 4: Polish
- [ ] Add subtle entrance animation
- [ ] Ensure responsive design for mobile
- [ ] Test keyboard navigation and accessibility

## Implementation Notes

- Follow the pattern used in `ExportModal.tsx` for modal structure
- Store preference in IndexedDB using existing `PersistenceDB` class
- Consider using `usePersistence` hook pattern for reading/writing state
- Keep feature content easily updatable (define as array of objects)
- YouTube video ID should be a constant that's easy to swap out later
- Use `youtube-nocookie.com` domain for privacy-enhanced embed mode (optional)

## Future Enhancements

- Replace sample video with actual AppFrames demo video
- Add "What's New" section for feature updates
- Support for multiple languages
- A/B test different feature orderings
