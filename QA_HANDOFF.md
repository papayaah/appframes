# QA Handoff: AppFrames Export & UX Improvements

## 1. Export Service (High Priority)
*   **Large Device Support**: Redesigned the export container to prevent "clipping" on large devices (like iPad 13 Pro). Verify that full-length exports are no longer cut off at the bottom.
*   **Background Transformations**: Backgrounds now support **Pan, Zoom, and Rotation** during export. Verify the exported image matches the exactly what is shown in the editor.
*   **Shared Backgrounds**: Implemented pre-resolution of dimensions. Shared backgrounds across multiple screens should now render instantly and accurately in the final ZIP.
*   **Wait Logic**: Increased timeout to 10s for high-res assets. Verify that complex designs with multiple images actually wait to fully "paint" before the snapshot is taken.

## 2. Media & UI Refinements
*   **Drag & Drop Intelligence**: The "Drop to import project" overlay no longer triggers when dragging **images**. It only appears for `.appframes` or `.zip` project files. Verify that dragging images onto screens/frames feels uninterrupted.
*   **Onboarding**: Replaced YouTube embed with a local high-quality mp4 (`appframes_demo.mp4`). Verify autoplay, looping, and performance.
*   **Self-Hosted Fonts**: Glacial Indifference, Jimmy Script, and EB Garamond are now served locally via WOFF2/TTF. Verify they load instantly and work offline (if cached).

## 3. Infrastructure
*   **Linux Build Fix**: Updated Rollup binaries for production. Deployment should now be stable across Mac and Linux (Docker) environments.

## Key Test Cases
1.  **Export iPad 13 Pro**: Does it cut off? Is the background rotated/panned correctly?
2.  **Multi-Image Drag**: Does it trigger the "Project Import" overlay? (It shouldn't).
3.  **Onboarding Modal**: Does the video play smoothly without external YouTube dependencies?
4.  **Font Selection**: Set a text element to "Jimmy Script" and export. Does it look correct in the final file?
