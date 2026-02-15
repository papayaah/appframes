# Onboarding Tutorial Spec

## Problem

New users land on a blank canvas with no guidance on how to use the app. The current WelcomeModal is a static feature list with a placeholder video. The existing FeatureTip system only teaches frame interactions after the user has already figured out how to add images. There's a gap between "app loaded" and "user knows what to do."

## Goal

Guide first-time users through the core workflow step-by-step using the existing FeatureTip infrastructure. Each step triggers only after the user completes the previous action, creating a learn-by-doing experience.

## Approach

Replace the WelcomeModal with a lightweight guided tour that uses **sequential FeatureTips** anchored to real UI elements. Each step waits for the user to perform the action before advancing. No modals blocking the workspace.

---

## Tutorial Steps

| # | Tip Key | Anchor Element | Trigger Condition | Title | Description | Animation |
|---|---------|---------------|-------------------|-------|-------------|-----------|
| 1 | `onboarding-add-image` | The empty frame drop zone (or the "Add Image" area on the first screen) | App loads with a pristine project & no images | **Drop in a screenshot** | Drag an image onto the frame, or click to browse your files | New Lottie: file dropping onto a frame |
| 2 | `onboarding-frame-select` | The device frame | User added their first image | **Select your frame** | Click on the frame to select it and reveal editing controls | Reuse: `mouse-left-drag.json` (first page only) or new click animation |
| 3 | `onboarding-sidebar` | The sidebar panel (Layout/Style tabs) | Frame is selected for the first time | **Customize your screen** | Use the sidebar to change device frames, adjust backgrounds, and add text | New Lottie: sidebar interaction |
| 4 | `onboarding-add-screen` | The "+" add screen button | User has 1 screen with an image | **Add more screens** | Click + to add another screen for your next screenshot | New Lottie: clicking add button |
| 5 | `onboarding-export` | The download/export button | User has 2+ screens | **Export your work** | Download your screens as images or copy to clipboard | New Lottie: download arrow |

## Existing Tips Integration

The current `frame-basics` (move/rotate) and `image-pan` (space+drag) tips continue to work independently. They fire based on frame selection as they do today, separate from the onboarding flow. If a user dismisses onboarding early, these contextual tips still teach frame interactions when relevant.

---

## Implementation Details

### Sequencing via `useAppStore.dismissedTips`

Each step's `enabled` condition checks that the previous step's `tipKey` is in `dismissedTips`. This is the same pattern already used for `frame-basics` -> `image-pan` cascading:

```
Step 1: enabled = pristineProject && noImages
Step 2: enabled = hasImage && dismissedTips.includes('onboarding-add-image')
Step 3: enabled = frameSelected && dismissedTips.includes('onboarding-frame-select')
Step 4: enabled = screenCount === 1 && hasImage && dismissedTips.includes('onboarding-sidebar')
Step 5: enabled = screenCount >= 2 && dismissedTips.includes('onboarding-add-screen')
```

### Auto-advance on action completion

Some steps should auto-dismiss when the user completes the action (not just when they click "Got it"):

- Step 1: Auto-dismiss when first image is added to a frame
- Step 2: Auto-dismiss when user clicks a frame (selects it)
- Step 4: Auto-dismiss when user adds a second screen

For these, add a `useEffect` in the hosting component that calls `dismissTip(tipKey)` when the condition is met.

### Where tips render

- Steps 1-2: Inside the canvas/screen area component (where frames live)
- Step 3: Inside the sidebar or the main layout component
- Step 4: Near the screen list / add button area
- Step 5: Near the export button in the header or toolbar

### Store changes

Add to `useAppStore`:

```ts
onboardingComplete: boolean;
completeOnboarding: () => void;
```

Set `onboardingComplete = true` when step 5 is dismissed (or when user skips). Once complete, onboarding tips never re-trigger (but can be reset with existing "Reset feature tips" button).

### Skip/dismiss all

Add a small "Skip tutorial" link to each onboarding tip. Clicking it dismisses all onboarding tip keys at once and sets `onboardingComplete = true`.

---

## WelcomeModal Changes

Remove the current WelcomeModal entirely (or reduce it to a single "Welcome to AppFrames" toast). The guided tour replaces it — users learn by doing instead of reading a feature list.

---

## Animations Needed

5 new Lottie animations for `/public/animations/`:

1. `onboarding-drop-image.json` — file icon dropping into a frame
2. `onboarding-click-frame.json` — cursor clicking on a frame (could reuse existing)
3. `onboarding-sidebar.json` — sidebar tabs being clicked
4. `onboarding-add-screen.json` — clicking a + button
5. `onboarding-export.json` — download/export action

Each follows the existing marker convention: `reveal` segment + `loop` segment.

---

## FeatureTip Component Changes

- Add optional `onSkipAll?: () => void` prop — renders a "Skip tutorial" text button in the footer
- No other changes needed; the existing multi-page, positioned, Lottie-animated component handles everything

---

## Edge Cases

- **Returning user with data**: Onboarding only triggers on pristine projects. If a user already has images/screens, skip the whole flow
- **Signed-in user syncs projects**: If projects sync down on first load, `pristine = false`, so onboarding won't fire — correct behavior
- **User imports a project**: Imported projects are not pristine, onboarding won't trigger
- **User refreshes mid-tutorial**: `dismissedTips` persists in localStorage, so they resume where they left off
- **Multiple projects**: Onboarding is global (not per-project). Once complete, it doesn't repeat for new projects

---

## Existing System Reference

### FeatureTip component
- **File**: `components/AppFrames/FeatureTip/FeatureTip.tsx`
- 280px wide, white card with shadow, Lottie animation area (280x160), title, description, pagination dots, nav buttons
- Supports multi-page tips via `tips: TipItem[]` array
- Positioned via `anchorRef` + `position` prop (top/bottom/left/right)
- Entrance: `slide-up` transition, 200ms

### useFeatureTip hook
- **File**: `components/AppFrames/FeatureTip/useFeatureTip.ts`
- Takes `tipKey`, `enabled`, `delay` (default 500ms)
- Returns `{ visible, dismiss }`
- Reads/writes `dismissedTips` from `useAppStore`

### useAppStore persistence
- **File**: `stores/useAppStore.ts`
- `dismissedTips: string[]` persisted in localStorage (`appframes-storage`)
- `dismissTip(key)`, `isTipDismissed(key)`, `resetTips()`

### Current tip keys
- `frame-basics` — frame move/rotate (DeviceFrame.tsx)
- `image-pan` — space+drag to pan image (DeviceFrame.tsx)

### Animation convention
- Lottie JSON files in `/public/animations/`
- Markers: `reveal` (plays once on appear), `hover`/`loop` (repeats with pauses)
- State machine: reveal -> pause (1500ms) -> loop -> pause -> loop...

### Reset UI
- Settings tab shows "Reset feature tips (N dismissed)" button when tips have been dismissed
