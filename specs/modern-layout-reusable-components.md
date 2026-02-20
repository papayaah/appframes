# Spec: Modern Layout Reusable Components

## Overview
This specification outlines the migration and generalization of high-level UI patterns from the main `appframes` application into the `@anthropic.dev/modern-layout` package. This will allow other applications to reuse these features (Guided Tour, Feature Tips, Onboarding, Skeleton Loaders) with consistent behavior and aesthetics.

## Objectives
- Extract complex UI logic (positioning, spotlighting, animation phases) into the headless package.
- Maintain consistency across different apps using the same "modern-layout" base.
- Provide full Storybook coverage for all new components.
- Support both Mantine-based and CSS-based implementations via the Preset system.

## Proposed Components

### 1. Guided Tour (`src/components/Tour`)
A headless tour system that manages multiple steps, spotlighting elements, and tooltip positioning.
- **`TourStep`**: Defines `targetId`, `title`, `content`, `position`.
- **`TourProvider`**: Tracks `currentStep`, `isActive`, and provides `next()`, `prev()`, `stop()`.
- **`TourSpotlight`**: Renders the overlay with a `clip-path` spotlighting the target element.
- **`TourTooltip`**: Renders the content modal near the target.

### 2. Feature Tips (`src/components/FeatureTip`)
Small, anchored components that explain features, often with animations (e.g., Lottie).
- **`FeatureTip`**: Takes an `anchorRef` and manages visibility.
- **Interaction Phases**: Supports `reveal` -> `pause` -> `loop` logic for animations.
- **Pagination**: Supports multiple pages within a single tip.

### 3. Onboarding & Welcome (`src/components/Onboarding`)
Higher-level patterns for the "first-run" experience.
- **`WelcomeModal`**: A standardized layout for the initial landing within an app.
- **`StepWizard`**: Generic multi-step flow for setup or information gathering.

### 4. Layout Skeletons (`src/components/Skeleton`)
Unified loading states to prevent layout shifts.
- **`LayoutSkeleton`**: (Better naming) A composite skeleton that mimics the overall layout (sidebar, header, content area) during initial boot. 
- **`Skeleton` (Primitive)**: Basic shimmer block for lists/cards.
- **Usage**: Provides a "Ghost" version of the app structure before data is ready.

### 5. Floating UI System (`src/components/Floating`)
Figma/Canva-style floating elements that aren't tied to the fixed grid.
- **`FloatingToolbar`**: A pill-shaped, centered toolbar (top or bottom) for common actions (undo, redo, zoom).
- **`PropertyInspector`**: A specialized `FloatingPanel` designed for property editing, with support for docking/snapping.
- **`Notch`**: Small, minimal UI handles for quick actions, extending the current `NotchHandle`.

### 6. Workspace Navigation (`src/components/Navigation`)
Components for the structural "shell" of the app.
- **`AppHeader`**: A generalized header component with slots for:
    - `Primary`: Logo / App Switcher.
    - `Secondary`: Breadcrumbs / Project Title.
    - `Center`: Tools / Search.
    - `Actions`: User Profile / Export / Share.
- **`AppFooter` / `StatusBar`**: A bottom-aligned bar for status indicators, coordinates, or mini-previews (like the `ScreensPanel`).

## Component Preset Extension
The `LayoutComponentPreset` interface in `types.ts` will be extended to include:
```typescript
export interface LayoutComponentPreset {
    // Existing: Box, IconButton, Tooltip, Drawer, Divider, Badge, ScrollArea, AppShell
    
    // New Additions:
    Modal: React.FC<ModalProps>;
    Skeleton: React.FC<SkeletonProps>;
    Overlay: React.FC<OverlayProps>;
    Input: React.FC<InputProps>; // For generic settings inputs
    Header: React.FC<HeaderProps>;
    Footer: React.FC<FooterProps>;
}
```


## Storybook Integration
Every new component will include a `.stories.tsx` file demonstrating:
- **Headless Usage**: Pure logic with default CSS.
- **Mantine Integration**: Using the Mantine preset for premium aesthetics.
- **Interactivity**: Dynamic step controls for the Tour, visibility toggles for Feature Tips.
- **Responsive Layouts**: How skeletons adapt to mobile vs desktop.

## Implementation Plan
1. **Update Types**: Add new components to `LayoutComponentPreset` and export new component types.
2. **Move Skeleton System**: Migrate from `media-library` and generalize.
3. **Move Feature Tip**: Implement the logic within `modern-layout` and update the app to use it.
4. **Move Onboarding Tour**: Generalize the spotlight logic and step management.
5. **Move Welcome Modal**: Implement a standard component in the layout package.
6. **Storybook Documentation**: Create stories for each as they are implemented.
