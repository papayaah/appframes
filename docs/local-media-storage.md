# Local Media Storage Implementation

## Overview

This document describes the local file storage implementation for media assets, replacing the planned S3/R2 cloud storage approach. Files are stored directly on the server's filesystem, organized by user ID.

## Why Local Storage?

- **200GB available space** - sufficient for many users
- **No S3 costs** - saves on cloud storage fees
- **Faster access** - no network latency
- **Simpler implementation** - no S3 SDK or credentials needed
- **Full control** - easier backups and management

## Architecture

### Database Schema

Media assets are stored in the `media_assets` table:

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' | 'video' | 'audio' | 'document' | 'other'
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL, -- bytes
  width INTEGER, -- pixels (for images/videos)
  height INTEGER, -- pixels (for images/videos)
  path TEXT NOT NULL, -- Relative path from MEDIA_STORAGE_PATH
  thumbnail_path TEXT, -- Optional thumbnail path
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### File Storage Structure

Files are organized by user ID:

```
/srv/appframes/media/
  ├── {user-id-1}/
  │   ├── 1234567890-image.jpg
  │   ├── thumb-1234567890-image.jpg
  │   └── 1234567891-video.mp4
  ├── {user-id-2}/
  │   └── ...
```

### API Endpoints

- `POST /api/media/assets` - Upload a new media file
- `GET /api/media/assets` - List all media assets for current user
- `GET /api/media/assets/[id]` - Download a media file
- `GET /api/media/assets/[id]/thumbnail` - Get thumbnail (if available)
- `DELETE /api/media/assets/[id]` - Delete a media file

## Setup

### 1. Database Migration

Run the migration to create the `media_assets` table:

```bash
npm run db:generate
npm run db:migrate
```

### 2. Environment Variables

Add to your `.env` file (or server's `/srv/{app_name}/.env`):

```env
MEDIA_STORAGE_PATH=/srv/appframes/media
```

The default is `/srv/appframes/media` if not set.

### 3. Docker Volume

The `docker-compose.yml` has been updated to include a `media_storage` volume that persists files across container restarts.

### 4. Server Directory

Ensure the media directory exists and has proper permissions:

```bash
sudo mkdir -p /srv/appframes/media
sudo chown -R $(whoami):$(whoami) /srv/appframes/media
# Or if running in Docker, ensure the volume is writable
```

## Usage

### Upload a File

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/media/assets', {
  method: 'POST',
  body: formData,
});

const asset = await response.json();
// { id, fileName, fileType, mimeType, size, width, height, path, ... }
```

### List Assets

```typescript
const response = await fetch('/api/media/assets');
const assets = await response.json();
```

### Download a File

```typescript
const response = await fetch(`/api/media/assets/${assetId}`);
const blob = await response.blob();
const url = URL.createObjectURL(blob);
```

### Get Thumbnail

```typescript
const response = await fetch(`/api/media/assets/${assetId}/thumbnail`);
const thumbnailBlob = await response.blob();
```

### Delete a File

```typescript
await fetch(`/api/media/assets/${assetId}`, {
  method: 'DELETE',
});
```

## Security

- All endpoints require authentication (Better Auth session)
- Users can only access their own media files
- File paths are validated to prevent directory traversal
- File size limits enforced (100MB default, configurable)

## Backup Strategy

Since files are stored locally, ensure they're included in your backup strategy:

```bash
# Example backup script
tar -czf media-backup-$(date +%Y%m%d).tar.gz /srv/appframes/media
# Upload to backup storage...
```

## Future Enhancements

1. **Thumbnail Generation**: Add server-side thumbnail generation using `sharp` library
2. **Image Dimensions**: Extract width/height for images during upload
3. **File Validation**: Add virus scanning or file type validation
4. **Storage Quotas**: Implement per-user storage limits
5. **CDN Integration**: Optionally serve files through a CDN for better performance
6. **Migration to S3**: If you outgrow 200GB, you can migrate to S3 later with minimal code changes

## Migration from S3 (if needed later)

If you need to migrate to S3 in the future:

1. Keep the same database schema (just change `path` to `url`)
2. Replace `lib/media-storage.ts` functions with S3 SDK calls
3. Update API routes to use S3 URLs instead of local paths
4. Run a migration script to upload existing files to S3

## Cost Comparison

**Local Storage (Current)**:
- Server disk space: ~$0.10/GB/month (if using cloud VPS)
- Total for 200GB: ~$20/month

**S3 Storage**:
- Standard storage: ~$0.023/GB/month
- Data transfer out: ~$0.09/GB
- Total for 200GB: ~$4.60/month + transfer costs

**Verdict**: Local storage is more cost-effective if you have the disk space available and don't need S3's scalability features.
