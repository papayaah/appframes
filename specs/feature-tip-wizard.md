# Feature Tip Wizard

## Problem

Users don't discover keyboard-based interactions (e.g., Space + drag to pan an image inside a frame). There's no onboarding or contextual hint system to teach them these features at the right moment.

## Goal

Create a reusable **FeatureTip** component that shows a small, non-intrusive popup with:
- A Lottie animation illustrating the interaction
- A short text description
- A dismiss button ("Got it")

Tips appear once per feature, at the right moment (e.g., first time an image is placed in a frame), and are remembered via localStorage so they don't show again.

## Non-goals (v1)

- Multi-step wizard / tour (just single tips for now)
- Tip sequencing or priority system
- Server-side persistence of dismissed tips (localStorage is fine)
- Custom positioning logic beyond anchor-relative placement

## UI Framework

The app uses **Mantine** (`@mantine/core`) throughout. The FeatureTip component will use Mantine primitives (`Box`, `Text`, `Button`, `Transition`) for consistency with the rest of the codebase — no plain HTML/CSS for layout or styling.

## Architecture

### Core component: `FeatureTip`

A small floating card that anchors near a target element or position, built with Mantine components.

```
components/
  AppFrames/
    FeatureTip/
      FeatureTip.tsx        # The reusable tip popup component
      useFeatureTip.ts      # Hook for show/dismiss logic + localStorage
      index.ts              # Barrel export
```

### `useFeatureTip` hook

Manages visibility state. Dismissed state is persisted via the existing **Zustand `useAppStore`** (`stores/useAppStore.ts`), which already uses `persist` middleware with localStorage under the `appframes-storage` key. This follows the same pattern as `welcomeModalDismissed`.

```ts
interface UseFeatureTipOptions {
  /** Unique key for this tip, matches a key in the store's dismissedTips set */
  tipKey: string;
  /** Condition that must be true for the tip to show (e.g., "image was just placed") */
  enabled?: boolean;
  /** Delay in ms before showing the tip after enabled becomes true (default: 500) */
  delay?: number;
}

interface UseFeatureTipReturn {
  /** Whether the tip should currently be visible */
  visible: boolean;
  /** Call to permanently dismiss the tip */
  dismiss: () => void;
}
```

#### Store changes (`stores/useAppStore.ts`)

Add to the `AppState` interface:

```ts
// Feature tips
dismissedTips: string[];
dismissTip: (tipKey: string) => void;
isTipDismissed: (tipKey: string) => boolean;
```

The hook reads `isTipDismissed(tipKey)` from the store to check if already dismissed, and calls `dismissTip(tipKey)` on "Got it". When `enabled` becomes `true` and the tip hasn't been dismissed, start a timer. After `delay` ms, set `visible = true`.

#### Reset tips

Add `resetTips: () => void` to the store (sets `dismissedTips` back to `[]`).

A **"Reset feature tips"** button goes in the existing **Settings tab** in `SidebarTabs.tsx` (the `case 'settings':` panel, which currently only has Download format options). It shows the count of dismissed tips and resets them all:

```
Tips
[Reset feature tips (2 dismissed)]
```

Only shown when `dismissedTips.length > 0`.

### `FeatureTip` component

```ts
interface FeatureTipProps {
  /** Whether to show the tip */
  visible: boolean;
  /** Called when user dismisses the tip */
  onDismiss: () => void;
  /** Base name for the Lottie animation pair (without suffix) */
  animationBase: string;
  /** Title text (short, bold) */
  title: string;
  /** Description text (1-2 lines explaining the interaction) */
  description: string;
  /** Position relative to the anchor - where the tip appears */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Anchor element ref to position near (optional - if omitted, renders inline) */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Pause duration in ms between loop cycles (default: 1500) */
  loopPause?: number;
}
```

### Visual design

```
+-------------------------------+
|  [Lottie animation]           |
|  (64x64, reveal → loop)      |
|                               |
|  **Pan your image**           |
|  Hold Space + drag to         |
|  reposition the image         |
|  inside the frame.            |
|                               |
|           [Got it]            |
+-------------------------------+
```

- **Size**: ~240px wide, compact height
- **Container**: Mantine `Box` with `Paper`-like styling (white bg, shadow, rounded corners)
- **Text**: Mantine `Text` for title (`fw={600} size="sm"`) and description (`size="xs" c="dimmed"`)
- **Dismiss button**: Mantine `Button` (`variant="light" size="xs"`) — "Got it"
- **Background**: white with subtle shadow (`0 4px 20px rgba(0,0,0,0.12)`)
- **Border radius**: 12px
- **Dismiss**: click "Got it" button, or click outside the tip
- **Entrance/Exit**: Mantine `Transition` component (`transition="slide-up"`, `duration={200}`)

### Lottie animation system

Each tip animation is a **pair** of Lottie JSON files following this naming convention:

```
public/animations/
  {base-name}-in-reveal.json    # Intro/reveal animation (plays once)
  {base-name}-loop.json         # Main animation (loops with pauses)
```

Example for `doodle-outline-690-computer-mouse-left-click`:
- `doodle-outline-690-computer-mouse-left-click-in-reveal.json` — the reveal
- `doodle-outline-690-computer-mouse-left-click-loop.json` — the loop

The `animationBase` prop takes the base name (without the `-in-reveal` / `-loop` suffix). The component resolves both files automatically.

#### Playback sequence

1. **Reveal phase**: Play `{base}-in-reveal.json` once (`loop={false}`)
2. **Pause**: Wait `loopPause` ms (default 1500ms) after reveal finishes
3. **Loop phase**: Play `{base}-loop.json` once, then pause `loopPause` ms, then repeat from step 3

This gives the user time to read the text between animation cycles without the animation being distracting.

#### Implementation

Use `lottie-react`'s `onComplete` callback to transition between phases. The component manages a state machine: `reveal → pause → loop → pause → loop → …`

```tsx
type AnimPhase = 'reveal' | 'pause' | 'loop';

// On mount: phase = 'reveal', load reveal JSON
// onComplete of reveal → phase = 'pause', setTimeout(loopPause)
// After pause → phase = 'loop', load loop JSON
// onComplete of loop → phase = 'pause', setTimeout(loopPause)
// After pause → phase = 'loop' (replay)
```

Install `lottie-react` (lightweight React wrapper for lottie-web):
```
npm install lottie-react
```

## First use case: Image pan tip

### Trigger

Show when an image is **first placed** into a frame (via drag-drop, media library select, or Pexels select). The tip should appear near the frame.

### Tip content

- **tipKey**: `"image-pan"`
- **animationBase**: `doodle-outline-690-computer-mouse-left-click`
- **title**: "Reposition your image"
- **description**: "Hold Space + drag to pan the image inside the frame"

This resolves to:
- Reveal: `/animations/doodle-outline-690-computer-mouse-left-click-in-reveal.json`
- Loop: `/animations/doodle-outline-690-computer-mouse-left-click-loop.json`

### Integration point

In `DeviceFrame.tsx` or `CompositionRenderer.tsx`, after an image is first assigned to the frame:

```tsx
const { visible, dismiss } = useFeatureTip({
  tipKey: 'image-pan',
  enabled: !!displayImage,  // show when image exists
  delay: 800,
});

// Near the frame render:
{visible && (
  <FeatureTip
    visible={visible}
    onDismiss={dismiss}
    animationBase="doodle-outline-690-computer-mouse-left-click"
    title="Reposition your image"
    description="Hold Space + drag to pan the image inside the frame"
    position="right"
    anchorRef={frameWrapperRef}
  />
)}
```

## Future tips (examples)

These demonstrate the reusability — same component, different content:

| tipKey | Trigger | Animation | Title | Description |
|--------|---------|-----------|-------|-------------|
| `image-pan` | Image placed in frame | mouse-click lottie | Reposition your image | Hold Space + drag to pan |
| `frame-scale` | Frame first selected | scroll-wheel lottie | Resize your frame | Scroll wheel to scale up/down |
| `frame-rotate` | Frame first selected | rotate lottie | Rotate your frame | Right-click + drag to rotate |
| `canvas-zoom` | First canvas interaction | pinch lottie | Zoom the canvas | Use the zoom slider or Ctrl + scroll |

## File changes summary

| File | Change |
|------|--------|
| `stores/useAppStore.ts` | Add `dismissedTips`, `dismissTip`, `isTipDismissed`, `resetTips` to the persisted store |
| `components/AppFrames/FeatureTip/FeatureTip.tsx` | New - reusable tip popup component |
| `components/AppFrames/FeatureTip/useFeatureTip.ts` | New - hook for visibility + delay logic (reads/writes store) |
| `components/AppFrames/FeatureTip/index.ts` | New - barrel export |
| `components/AppFrames/SidebarTabs.tsx` | Add "Reset feature tips" button to the Settings tab |
| `components/AppFrames/DeviceFrame.tsx` | Import and use FeatureTip for image-pan tip |
| `package.json` | Add `lottie-react` dependency |
| `public/animations/` | Already has the reveal JSON, need to add loop JSON |
