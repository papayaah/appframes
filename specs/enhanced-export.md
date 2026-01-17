# Enhanced Export (Preview-first, Batch Export, ZIP)

## Overview

Enhanced Export extends the **Store Preview** experience so users can review and export screenshots **from the preview interface** with:

- Format selection: **PNG** or **JPG**
- JPG quality control
- Export filtering by **canvas size**
- Single-screen export (direct file) and multi-screen export (**ZIP**)
- Progress + cancellation
- Optional watermarking for free users

The export output must match the preview rendering (same CompositionRenderer settings and appearance).

## Glossary

- **Store Preview Renderer**: view that displays screens grouped by canvas size
- **Export modal**: dialog for choosing export options
- **Batch export**: exporting multiple screens and/or multiple canvas sizes
- **ZIP archive**: a single download containing many images in folders
- **Watermark**: overlay text added for free users

## Requirements

### R1: Export entrypoint in preview

**User Story:** As a user, I want to export from the preview interface so I can download after reviewing.

**Acceptance Criteria:**

1. The preview UI SHALL show a prominent **Export** button.
2. Clicking Export SHALL open an **export options modal**.
3. Confirming export SHALL process using selected options.
4. Completion SHALL download the exported file(s).

### R2: PNG/JPG formats + JPG quality

**Acceptance Criteria:**

1. The modal SHALL allow choosing **PNG** or **JPG**.
2. PNG export SHALL be lossless.
3. JPG export SHALL use a **quality** value (0–100).
4. Quality control SHALL be shown only when JPG is selected.

### R3: Canvas size filtering

**Acceptance Criteria:**

1. The modal SHALL list canvas sizes that have screens.
2. Each entry SHALL show label/dimensions/screen count.
3. Default selection SHALL be “all sizes selected”.
4. Toggling a size SHALL include/exclude its screens from export.

### R4: Export preview summary

**Acceptance Criteria:**

1. The modal SHALL show total number of screens that will be exported.
2. When no sizes are selected, Export SHALL be disabled with a helpful message.
3. Summary values SHALL update as options change.

### R5: Single-screen export (no ZIP)

**Acceptance Criteria:**

1. If exactly one screen is exported, download SHALL be a single image file.
2. Filename SHOULD include the screen name + correct extension.
3. The modal SHOULD close on success.

### R6: Multi-screen export (ZIP)

**Acceptance Criteria:**

1. If more than one screen is exported, output SHALL be a ZIP.
2. ZIP SHALL contain folders per canvas size.
3. Filenames SHOULD be ordered and padded (e.g. `01-screen-name.png`).
4. ZIP filename SHOULD include a timestamp.

### R7: Progress + cancellation

**Acceptance Criteria:**

1. Export SHALL show progress (“X of Y”) and current screen name.
2. Export SHALL offer **Cancel** while running.
3. Cancel SHALL stop further processing and SHALL not download partial results.

### R8: Preview/export parity

**Acceptance Criteria:**

1. Export rendering SHALL use the same composition rendering as preview.
2. Export SHALL apply all relevant screen settings (frame, composition, background, text).
3. Export dimensions SHALL exactly match the chosen canvas size.
4. Export SHOULD use 2× pixel ratio for quality.

### R9: Quick export actions

**Acceptance Criteria:**

1. Preview SHALL offer **Quick Export All** (no modal): all screens, PNG, ZIP.
2. Each canvas-size group SHOULD offer **Quick Export** for that group.

### R10: Watermarking (free vs pro)

**Acceptance Criteria:**

1. Free exports SHALL include a watermark “Made with AppFrames” (bottom-right, ~40% opacity).
2. Pro exports SHALL not include a watermark.
3. Free users SHALL see a notice in the export modal about watermarking + an upgrade CTA.

### R11: Remove export from editor header (centralize in preview)

**Acceptance Criteria:**

1. The main editor header SHALL not show an Export button.
2. The editor SHALL keep “Download current screen(s)” behavior.
3. The editor SHOULD guide users to Preview for full export.

## Proposed Design

### Architecture

- `StorePreviewRenderer` owns export UI state (open/close modal, quick export actions)
- `ExportModal` collects options, shows summary, runs export with progress
- `ExportService` performs the actual rendering + encoding + ZIP creation

### Export rendering approach

- Render a screen off-screen using `CompositionRenderer` configured for the target canvas size
- Use `html-to-image` to produce PNG/JPG (2× pixel ratio)
- If watermarking is enabled, inject watermark DOM into the off-screen container before capture
- For multi-screen: add files into `JSZip` under `/<canvasSize>/`

### File naming

- Single screen: `<sanitized-screen-name>.<ext>`
- ZIP: `/<canvasSize>/<NN>-<sanitized-screen-name>.<ext>`
- ZIP filename includes timestamp (e.g. `appframes-export-YYYYMMDD-HHmmss.zip`)

## Implementation plan (tasks)

- [ ] **ExportService**
  - Export one screen → blob (PNG/JPG)
  - Export many screens → ZIP (by canvas size folders)
  - Progress callbacks + cancellation token
  - Watermark injection (free users)
  - Filename helpers + `downloadBlob`
- [ ] **Export modal UI (preview)**
  - Format selector + JPG quality control
  - Canvas size multi-select with default “all selected”
  - Summary: total screens, validation when none selected
  - Progress view + Cancel during export
- [ ] **Quick export actions**
  - Quick Export All (PNG ZIP) from preview
  - Quick Export per canvas size group
- [ ] **Move export out of editor header**
  - Remove header export UI
  - Keep download current behavior
  - Add guidance to Preview for full export

