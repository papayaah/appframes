# Landing Page (Marketing + Interactive Demo)

## Overview

The landing page is the entry point for AppFrames. It should:

- Explain what AppFrames does (clear value prop)
- Provide an **interactive demo** (drag an image into a device frame)
- Convert users into the full app (CTA to open `/app`)
- Stay fast, responsive, and accessible

## Glossary

- **Landing page**: first page a visitor sees
- **Interactive demo**: lightweight “try it now” canvas experience
- **Device frame**: iPhone/iPad/Android mock frame around a screenshot
- **Composition**: layout style (single/dual/stack/etc.)

## Requirements

### R1: Clear product explanation + CTA

**User Story:** As a first-time visitor, I want to quickly understand what AppFrames does.

**Acceptance Criteria:**

1. The page SHALL include a hero headline describing the product.
2. The hero SHALL include a short subtitle about App Store / Google Play screenshots.
3. The page SHALL include a primary CTA to open the main app (`/app`).
4. The page SHALL show at least three key features with icons and descriptions.

### R2: Interactive demo (drag-drop image into device frame)

**User Story:** As a potential user, I want to try the core workflow without committing.

**Acceptance Criteria:**

1. The demo section SHALL show a default device frame.
2. Dropping an image file onto the demo SHALL display it inside the frame.
3. The image SHALL be scaled/positioned appropriately within the frame boundaries.
4. When empty, the demo SHALL show instructions (“Drag an image…”).
5. When an image is added, the demo SHALL provide clear visual feedback.

### R3: Demo customization (frame + background)

**Acceptance Criteria:**

1. When an image exists, the demo SHALL offer a curated device-frame selector (3–4 options).
2. Changing the device frame SHALL update the display immediately while preserving the image.
3. The demo SHALL offer background color control that updates immediately.

### R4: Smooth path to full app

**Acceptance Criteria:**

1. The demo section SHALL include a prominent “Open App” CTA to `/app`.
2. The page SHALL include copy indicating more features exist in the full app.
3. If feasible, navigating to `/app` SHOULD preserve the demo image.

### R5: Mobile responsiveness

**Acceptance Criteria:**

1. Layout SHALL be responsive and work well on mobile.
2. Hero content SHOULD stack vertically on small screens.
3. Demo canvas SHOULD size to fit viewport width (no horizontal scroll).
4. Touch targets SHALL be at least 44×44 px.
5. Feature cards SHOULD become a single column on mobile.

### R6: Accessibility

**Acceptance Criteria:**

1. All interactive elements SHALL have accessible names/labels (ARIA where needed).
2. Keyboard navigation SHALL show visible focus indicators.
3. Images SHALL include descriptive `alt` text.
4. Demo upload MUST have a keyboard-accessible file input alternative (not just drag/drop).
5. Color contrast SHALL meet WCAG AA.

### R7: Example outputs

**Acceptance Criteria:**

1. The page SHOULD show example screenshots with multiple device frames.
2. Examples SHOULD include at least two different composition styles.

### R8: Performance

**Acceptance Criteria:**

1. The landing page SHOULD be statically generated where possible.
2. Images SHOULD be optimized (next/image, responsive sizes, modern formats).
3. Demo JS SHOULD be minimal and code-split from the main app where feasible.
4. Above-the-fold content SHOULD render quickly.
5. Network requests SHOULD be minimized.

## Proposed Design

### Routing

- Landing page at `/`
- Main app at `/app`

### Page structure

- **Hero section**: headline, subtitle, primary CTA to `/app`, secondary “See demo” anchor
- **Demo section**: demo canvas + controls + CTA
- **Features section**: feature cards + example images
- **Final CTA section**: repeat CTA to `/app`

### Demo implementation details

- State (local only):
  - `imageUrl: string | null` (blob URL)
  - `deviceFrame: string` (subset of popular frames)
  - `backgroundColor: string`
- Use `URL.createObjectURL(file)` and clean up on change/unmount
- Reuse `components/AppFrames/DeviceFrame` for visual consistency
- Include file input fallback for accessibility/mobile

## Implementation plan (tasks)

- [ ] **Routing**
  - Make `/` the landing page and move the app to `/app`
  - Update internal navigation links accordingly
- [ ] **Landing components**
  - Hero + Features + Demo + CTA sections using Mantine
- [ ] **Interactive demo**
  - Drag/drop + file input
  - Frame selector (curated)
  - Background color control
- [ ] **Examples**
  - Add example screenshots/compositions
- [ ] **Accessibility + responsive behavior**
  - Focus states, labels, contrast, touch sizes, mobile layout
- [ ] **Performance**
  - Static generation, image optimization, code splitting

