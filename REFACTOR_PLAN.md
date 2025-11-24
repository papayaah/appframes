# AppFrames Refactor Plan

## Overview
Major refactor to add Media Library with IndexedDB + OPFS storage and rename app from ScreensStudio to AppFrames.

## Completed ✅
1. ✅ Installed Dexie for IndexedDB
2. ✅ Created `lib/db.ts` - Database schema
3. ✅ Created `lib/opfs.ts` - OPFS file management
4. ✅ Created `components/AppFrames/MediaLibrary.tsx` - Media library component

## TODO

### 1. Rename App (ScreensStudio → AppFrames)
- [ ] Rename folder: `components/ScreensStudio` → `components/AppFrames`
- [ ] Update all imports
- [ ] Update app name in Header
- [ ] Update metadata in layout.tsx
- [ ] Update README and documentation

### 2. Add Media Library to UI
- [ ] Add Media tab to sidebar
- [ ] Integrate MediaLibrary component
- [ ] Handle media selection
- [ ] Handle drag & drop from media library

### 3. Fix Canvas Behavior
- [ ] Show device frame on blank canvas
- [ ] Add instructions inside empty frame
- [ ] Enable drag & drop on blank canvas
- [ ] Create first screen automatically on drop

### 4. Add Image Panning
- [ ] Make images draggable inside device frames
- [ ] Add mouse drag handlers
- [ ] Update pan X/Y based on drag
- [ ] Show drag cursor on hover

### 5. Media Integration
- [ ] Load media file from OPFS when selected
- [ ] Apply media to selected slot
- [ ] Support drag & drop from media library
- [ ] Add "Use" button functionality

### 6. Update Data Flow
- [ ] Screens now reference media IDs instead of base64
- [ ] Load actual images from OPFS for display
- [ ] Handle media deletion (check if in use)

## Implementation Order

1. **Phase 1**: Rename app (low risk)
2. **Phase 2**: Add media library UI (new feature)
3. **Phase 3**: Integrate media with screens (data flow)
4. **Phase 4**: Fix canvas behaviors (UX improvements)
5. **Phase 5**: Add image panning (enhancement)

## Notes

- OPFS is only available in secure contexts (HTTPS or localhost)
- IndexedDB stores metadata, OPFS stores actual files
- Thumbnails stored as base64 in IndexedDB for quick display
- Full images loaded from OPFS only when needed
