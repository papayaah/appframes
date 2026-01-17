# Device Frame Rotation, Tilt, and Per-Frame Resize

## Overview

This spec adds per-frame transforms to AppFrames so device frames can be:

- **Tilted in 3D** (rotateX / rotateY)
- **Rotated in 2D** (rotateZ)
- **Resized per frame** (scale), via drag handles

All transforms must:

- Update the preview **in real time**
- **Persist per screen + per frame** (so switching screens doesn’t lose work)
- Render identically in **export** (html-to-image capture)

This replaces any **composition-level** scaling with **per-frame** scaling to keep behavior consistent and predictable.

## Glossary

- **Canvas**: main workspace where compositions render
- **Device frame**: mock device wrapper containing a screenshot image
- **Tilt**: 3D perspective rotation along X/Y axes
- **Rotation**: 2D rotation along Z axis
- **Frame scale**: per-frame size multiplier (percent)
- **Transform**: combined translate/scale/rotate applied to a frame wrapper

## Requirements

### R1: 3D tilt (X/Y)

**User Story:** As an app marketer, I want to tilt device frames in 3D, so I can create dynamic compositions with depth.

**Acceptance Criteria:**

1. WHEN a user changes tiltX THEN the frame SHALL apply `rotateX(tiltXdeg)`.
2. WHEN a user changes tiltY THEN the frame SHALL apply `rotateY(tiltYdeg)`.
3. WHEN tiltX/tiltY are zero THEN the frame SHALL appear “flat”.
4. WHEN exporting THEN the tilted appearance SHALL match the editor preview.
5. Tilt ranges SHALL be clamped to \([-60°, 60°]\).

### R2: 2D rotation (Z)

**User Story:** As an app marketer, I want to rotate frames, so I can create angled layouts.

**Acceptance Criteria:**

1. WHEN a user changes rotateZ THEN the frame SHALL apply `rotateZ(rotateZdeg)`.
2. Rotation SHALL be around the frame center.
3. Combined transforms SHALL apply in a consistent order (see Design).
4. Rotation range SHALL be clamped to \([-180°, 180°]\).

### R3: Per-frame resize (scale)

**User Story:** As a user, I want to resize individual frames, so I can emphasize certain devices.

**Acceptance Criteria:**

1. WHEN hovering/selecting a frame THEN resize handles SHALL appear.
2. WHEN dragging a corner handle THEN resize SHALL be proportional.
3. WHEN dragging an edge handle THEN resize MAY bias one axis (implementation-dependent) but MUST feel intuitive.
4. Scale range SHALL be clamped to \([20%, 200%]\).
5. WHEN releasing the handle THEN the final scale SHALL be persisted.

### R4: Persistence per screen + per frame

**User Story:** As a user, I want transforms to persist, so I don’t lose work.

**Acceptance Criteria:**

1. Transforms SHALL be stored on each `ScreenImage` (per frame slot).
2. Different screens SHALL maintain independent transform values.
3. New screens/frames SHALL default to tilt=0, rotate=0, scale=100%.

### R5: Remove composition-level scale

**User Story:** As a user, I want scaling to be per-frame only, so I’m not confused by global vs per-frame size.

**Acceptance Criteria:**

1. `compositionScale` SHALL be removed/ignored.
2. Rendering SHALL use only per-frame `frameScale`.
3. Existing saved data that includes `compositionScale` SHALL not break loads (ignore it).

## Proposed Design

### Data model

Extend `ScreenImage` with:

- `tiltX?: number` (\([-60, 60]\), default 0)
- `tiltY?: number` (\([-60, 60]\), default 0)
- `rotateZ?: number` (\([-180, 180]\), default 0)
- `frameScale?: number` (\([20, 200]\), default 100)

Remove/ignore `compositionScale` from `CanvasSettings`.

### Where transforms are applied

Apply transforms on the **frame wrapper** (the `DraggableFrame` wrapper in `components/AppFrames/CompositionRenderer.tsx`), not inside `DeviceFrame`, so:

- panning stays scoped to the image inside the device
- transforms affect the whole device mock + its content consistently

### Transform order (consistent + predictable)

Order matters. Use a stable sequence:

1. Base composition transform (if any, e.g. fan layout)
2. Translate for frame positioning (`frameX`, `frameY`)
3. Scale (`frameScale / 100`) **before** rotations
4. RotateX, rotateY, rotateZ

Also enable 3D rendering:

- wrapper: `transformStyle: 'preserve-3d'`
- composition container: `perspective: '2000px'` (or similar)

### Interaction performance (“preview in rAF, commit on end”)

Resize/rotate interactions must feel smooth even with a large React tree:

- **mousemove**: update refs + schedule rAF; apply `style.transform` directly to the wrapper DOM for preview
- **mouseup**: commit the final `tiltX/tiltY/rotateZ/frameScale` to React state once

(This matches the existing canvas interaction approach documented in `agents.md`.)

## Implementation plan (tasks)

- [ ] **Add tilt controls**
  - Sliders (or similar) for `tiltX` / `tiltY`
  - Reset button (tiltX/tiltY back to 0)
  - Clamp values
- [ ] **Optional: edge resize handles**
  - Add top/right/bottom/left handles (in addition to corners)
  - Keep interactions smooth (preview in rAF, commit on end)
  - Clamp `frameScale` to 20–200

