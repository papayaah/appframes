# Media Storage Without Database Table

## How User Identification Works

Even without a database table, the system knows which files belong to which users through:

1. **Better Auth Session**: Provides `session.user.id` from the authenticated session
2. **Filesystem Organization**: Files are stored in folders by user ID:
   ```
   /srv/appframes/media/
     ├── {user-id-1}/  ← All files for user 1
     │   ├── 1234567890-image.jpg
     │   └── 1234567891-video.mp4
     ├── {user-id-2}/  ← All files for user 2
     │   └── 1234567892-document.pdf
   ```

3. **Path-Based Security**: When accessing files, the API verifies the path starts with the current user's ID

## Two Implementation Options

### Option 1: With Database Table (Recommended)

**Pros:**
- Fast queries (no filesystem scanning)
- Rich metadata (file type, size, dimensions, thumbnails)
- Easy listing and searching
- UUID-based file IDs

**Cons:**
- Requires database migration
- More setup

**API Routes:**
- `POST /api/media/assets` - Upload
- `GET /api/media/assets` - List all
- `GET /api/media/assets/[id]` - Download by ID
- `DELETE /api/media/assets/[id]` - Delete by ID

**Setup:**
```bash
npm run db:generate
npm run db:migrate
```

### Option 2: Without Database Table (Simpler)

**Pros:**
- No database needed
- Works immediately
- Simpler setup

**Cons:**
- Slower listing (scans filesystem)
- No metadata storage
- Files identified by path, not ID
- No easy searching/filtering

**API Routes:**
- `POST /api/media/assets-simple` - Upload (returns path)
- `GET /api/media/assets-simple` - List all (scans filesystem)
- `GET /api/media/files/[...path]` - Download by path
- `DELETE /api/media/files/[...path]` - Delete by path

**Usage Example:**
```typescript
// Upload
const formData = new FormData();
formData.append('file', file);
const res = await fetch('/api/media/assets-simple', {
  method: 'POST',
  body: formData,
});
const { path } = await res.json();
// path = "user-id-123/1234567890-image.jpg"

// Download
const fileRes = await fetch(`/api/media/files/${path}`);
const blob = await fileRes.blob();
```

## Security

Both approaches verify ownership:
- **With database**: Queries check `userId = session.user.id`
- **Without database**: Path must start with `{session.user.id}/`

## Recommendation

**Start with Option 2** (no database) if you want to test quickly, then **migrate to Option 1** (with database) when you need:
- Better performance
- Metadata storage
- Easier file management

The filesystem structure is the same in both cases, so migration is just:
1. Run the database migration
2. Scan existing files and populate the `media_assets` table
3. Switch API routes from `-simple` to regular ones
