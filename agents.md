# agents.md

This is a brand new app. No need for backward compatibility. 

- **Project**: Brand new Next.js (App Router) + TypeScript app.
- **UI**: Mantine components.
- **Persistence**:
  - **Projects/state**: browser **IndexedDB** (see `lib/PersistenceDB.ts` and `hooks/usePersistence.ts`).
  - **Media assets**: handled by the local shared package in `packages/media-library` (`@reactkits.dev/react-media-library`) which uses IndexedDB + OPFS.
- **Dev constraints**: Do **not** start/run the dev server from the agent.
- **Testing**: No tests needed for changes right now.
- **Conventions**: Prefer editing existing files; keep canvas size presets centralized in `components/AppFrames/FramesContext.tsx`.

## Shared packages in `packages/*` (keep the app thin)

We intentionally keep this app small by pushing reusable/opinionated functionality into **local shared packages** under `packages/*` (which can also be published to npm).

- **Default rule**: if a feature is reusable (or should be opinionated with strong defaults), implement it in `packages/*` and keep `appframes/` as a light integration layer.
- **Prefer “defaults-first” packages**: packages can expose ready-to-use presets (e.g. Mantine presets) so the app doesn’t re-implement UI logic.
- **App code should mostly wire things together**: data flow, minimal adapters, and app-specific behavior only.
- **Drag-and-drop contracts should be package-driven**: prefer having packages define payload formats and helper utilities; the app should only consume them.

## Canvas interaction technique: “preview in rAF, commit on end”

We want interactions (dragging frames, scaling, rotating) to feel **buttery smooth** even when the surrounding React tree is large. The key technique is:

- **Preview phase (per-mousemove)**: update the DOM directly (no React state writes) using `requestAnimationFrame` (rAF).
- **Commit phase (on mouseup)**: write the final value(s) to React state once (e.g., `setScreens(...)`) so persistence + thumbnails update.

### Why it’s smoother than “setState on every mousemove”

Calling `setScreens(...)` on every mousemove forces React to re-render the canvas composition repeatedly. Even small re-renders can become janky under load (layout + paint + React work).

Instead, we:

- store the latest pointer deltas in a ref (`pending...Ref`)
- schedule **at most one** rAF callback at a time
- in the rAF callback, apply the CSS transform directly to the element (`el.style.transform = ...`)

This is the same pattern used for image panning and frame dragging in `components/AppFrames/DeviceFrame.tsx`:

- `pendingPanRef` + `schedulePanVisual()` for panning
- `pendingFrame...Ref` + `scheduleFrameDragVisual()` for frame dragging

### Smooth scale/rotate (device wrapper)

Scale/rotate is applied by the wrapper in `components/AppFrames/CompositionRenderer.tsx` (the `DraggableFrame` wrapper). During resize/rotate gestures:

- **mousemove** calls a “preview” callback that only updates refs and schedules rAF
- rAF updates the wrapper DOM transform string (no React setState)
- **mouseup** calls a “commit” callback that writes `frameScale` / `rotateZ` to the screen’s `images[frameIndex]`

This gives real-time visual feedback without triggering expensive React work mid-gesture.

### Making drag direction correct when the frame is rotated

Without compensation, a drag preview applied to a child element **inside a rotated parent** will appear to move in a “twisted” direction (e.g., dragging up moves diagonally) because the translation happens in the rotated coordinate space.

Fix: compute the **visual** drag delta in the element’s local space by applying the inverse rotation (and inverse scale) to the pointer delta:

1) compute screen-space delta (normalized by viewport zoom)
2) divide by wrapper scale (so 1px mouse move ≈ 1px visual move)
3) apply inverse rotation:

```
local = R(-θ) * screenDelta
```

We then:

- **preview**: apply `translate3d(localX, localY, 0)` to the inner element for buttery visuals
- **commit**: store the original screen-space delta into `frameX/frameY` (the canonical persisted values)

### Summary

- **Preview** (mousemove): refs + rAF + direct DOM style updates
- **Commit** (mouseup): single React state update (and persistence)
- **Rotation-aware dragging**: inverse-transform the preview delta so the cursor “feels right” at any rotateZ

