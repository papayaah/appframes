# Specification: SaaS Features Video with Remotion

## Overview
Remotion allows us to create programmatically defined videos using React. Instead of using traditional video editing software (Premiere, ScreenStudio), we can build an "explainer" video using our existing design system and components.

This approach is perfect for an onboarding popup because:
1. **Consistency**: The video uses the exact same colors, fonts, and UI components as the app.
2. **Version Control**: Video changes are tracked in Git.
3. **Programmable**: We can easily create different versions for different user segments.

---

## 🏗 Architecture Recommendation

### 1. Separate Package
Create a new package `/packages/video` dedicated to Remotion. This keeps the rendering dependencies (like ffmpeg, chromium) isolated from the main app.

### 2. Implementation Approach: Pre-rendered vs. Live Player
| Feature | **Option A: Pre-rendered MP4** (Recommended) | **Option B: @remotion/player** |
| :--- | :--- | :--- |
| **Performance** | Instant playback (standard video element). | High CPU usage in browser (renders JS). |
| **Personalization**| Harder (requires cloud rendering). | Easy (render user name dynamically). |
| **Setup** | Simple `npx remotion render`. | Needs player client-side installation. |
| **UX** | Smooth, standard controls. | Can be interactive/clickable. |

**Verdict**: Use **Option A** for the onboarding modal to ensure a smooth, lightweight experience for new users.

---

## 🎬 Video Composition Plan

A "Premium" SaaS explainer usually follows this sequence:

### 1. The Browser Frame
Create a component that mimics a browser window (top bar with dots, URL bar). Everything else happens inside this frame.

### 2. The Zoom & Pan Effect
Since dashboard videos can be dense, we use Remotion's `interpolate` and `useCurrentFrame` to "focus" on specific features:
- **Zoom In**: Focus on a specific button or chart.
- **Pan**: Move across the dashboard as the "cursor" moves.

### 3. Cursor Simulation
Animate an SVG cursor that moves to a button, clicks (scale down/up), and triggers a UI state change in the video.

### 4. Floating Labels (Tooltips)
Overlay text messages explaining the feature currently being shown (e.g., "Customize your frames in 1-click").

---

## 🛠 Project Structure (Draft)

```text
packages/video/
├── src/
│   ├── Root.tsx             # Composition entry point
│   ├── compositions/
│   │   ├── Explainer/
│   │   │   ├── index.tsx    # Main sequence
│   │   │   ├── Browser.tsx  # The wrapper
│   │   │   ├── Cursor.tsx   # Animated cursor
│   │   │   └── Features/    # Individual feature clips
│   ├── assets/              # Screenshots/Icons
│   └── style.css            # Video-specific styles
├── remotion.config.ts
└── package.json
```

---

## 🚀 Implementation Steps

### Step 1: Initialize Remotion
```bash
npx create-remotion@latest packages/video
```

### Step 2: Define the Composition
In `Root.tsx`, define a 1080p, 30fps composition of ~30-60 seconds.

### Step 3: Animate the UI
Instead of recording your screen, **build a "Simplified UI"** for the video. 
- Use screenshots of the app as backgrounds.
- Place real React components (buttons, cards) on top of screenshots for crisp animations.

### Step 4: Render to MP4
```bash
npx remotion render Explainer out/onboarding.mp4
```

### Step 5: Integration into `WelcomeModal`
1. Upload `onboarding.mp4` to a CDN (e.g., Vercel Blob).
2. Update `WelcomeModal.tsx` to accept a `videoUrl` prop.
3. Replace the `<img>` with a `<video autoplay loop muted playsinline />` tag.

---

## ✨ Premium Aesthetics Tips
- **Spring Physics**: Use `spring()` from Remotion for all movements (scaling buttons, moving cursors).
- **Motion Blur**: Enable motion blur in the composition settings for "pro" feel.
- **Gradients**: Use vibrant background gradients (like the ones in our `modern-layout` presets).
- **Shadows**: Use deep, soft shadows on the browser frame to give it depth.

---

## 📝 Example Code Snippet (Spring Animation)
```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
  from: 0,
  to: 1,
  config: { stiffness: 100 },
});

return <div style={{ transform: `scale(${scale})` }}>🚀 Welcome!</div>;
```
