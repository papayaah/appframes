# OPFS-First Media Storage Implementation

## Overview

This implementation follows the **offline-first architecture** specified in `specs/offline-first-persistence.md`, with one key difference: **local filesystem storage** instead of S3/R2.

## Architecture Alignment with Spec

### ✅ OPFS-First (Authoritative for UX)

**Spec requirement (line 98-99):**
> "Local: Keep OPFS/IndexedDB for fast offline access (authoritative for UX)"

**Implementation:**
- Files are **first saved to OPFS/IndexedDB** via `importFileToLibrary()` (existing)
- Media assets are immediately available for use in the canvas
- No network required for local editing

### ✅ Background Sync

**Spec requirement (line 169-173):**
> "MediaSyncService handles: Upload, Download, Background sync, Conflict resolution"

**Implementation:**
- Created `packages/media-library/src/services/sync.ts` with `MediaSyncService`
- Background sync uploads from OPFS to server (non-blocking)
- Sync status tracked: `'pending' | 'syncing' | 'synced' | 'error'`

### ✅ Media Asset Data Model

**Spec requirement (lines 103-134):**
- `cloudId?: string` - ✅ Added
- `cloudUrl?: string` - ✅ Added (stores server path instead of S3 URL)
- `syncStatus?: 'pending' | 'syncing' | 'synced' | 'error'` - ✅ Added
- `handleName: string` - ✅ Already exists (OPFS filename)
- `userId?: string` - ✅ Added

**Implementation:**
- Updated `MediaAsset` interface in `packages/media-library/src/types.ts`
- All cloud sync fields are optional (backward compatible)

### ✅ Server-Side Schema

**Spec requirement (lines 137-160):**
- Uses `url` field for S3/R2 URL

**Implementation difference:**
- Uses `path` field instead (local filesystem path)
- Same structure, just different storage backend
- Example: `path = "user-id-123/1234567890-image.jpg"` instead of S3 URL

### ✅ API Endpoints

**Spec requirement (lines 188-192):**
- `POST /api/media/assets` - ✅ Implemented
- `GET /api/media/assets` - ✅ Implemented
- `GET /api/media/assets/:id` - ✅ Implemented (returns file, not just metadata)
- `DELETE /api/media/assets/:id` - ✅ Implemented

**Additional endpoints:**
- `GET /api/media/assets/:id/thumbnail` - Thumbnail endpoint

## Flow Comparison

### Spec Flow (S3/R2):
1. User uploads → OPFS/IndexedDB (immediate)
2. Background sync → S3/R2 + Postgres metadata
3. Download from S3 when needed

### Our Flow (Local Filesystem):
1. User uploads → OPFS/IndexedDB (immediate) ✅ **Same**
2. Background sync → Local filesystem + Postgres metadata ✅ **Same pattern**
3. Download from local filesystem when needed ✅ **Same pattern**

## Key Differences from Spec

1. **Storage Backend**: Local filesystem instead of S3/R2
   - Same API structure
   - Same sync pattern
   - Just different storage location

2. **URL vs Path**: 
   - Spec uses `url` (S3 URL)
   - We use `path` (relative filesystem path)
   - Both serve the same purpose (identify file location)

## Usage Example

```typescript
// 1. Upload to OPFS first (offline-first)
const id = await importFileToLibrary(file);
// File is immediately available in canvas

// 2. Background sync to server (non-blocking)
const syncService = new MediaSyncService({
  apiBaseUrl: '/api',
  getUserId: async () => session?.user?.id || null,
  autoSync: true,
});

// Asset will be synced automatically in background
// Or manually:
const syncedAsset = await syncService.uploadAsset(asset);
```

## Migration Path

If you later want to migrate to S3:
1. Change `path` column to `url` in database
2. Update `lib/media-storage.ts` to use S3 SDK instead of filesystem
3. Update `MediaSyncService` to use S3 URLs
4. No changes needed to OPFS-first flow

## Summary

✅ **OPFS-first**: Files saved to OPFS/IndexedDB immediately  
✅ **Background sync**: Non-blocking sync to server  
✅ **Data model**: Matches spec (with local filesystem instead of S3)  
✅ **API endpoints**: All required endpoints implemented  
✅ **Offline-first UX**: Works without network, syncs in background  

The implementation is **fully aligned** with the spec's architecture, just using local filesystem storage instead of S3/R2.
