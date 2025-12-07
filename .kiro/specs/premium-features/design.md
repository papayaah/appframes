# Design Document

## Overview

This feature implements cloud storage for premium users, enabling cross-device access, backup, and synchronization. The architecture mirrors the existing local storage setup (IndexedDB + OPFS) while adding cloud persistence via Neon database (workspace data), Vercel Storage (media files), and Vercel Edge Config (app preferences). The design maintains compatibility with free users who continue using local storage only.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AppFrames (Root)                      │
│  - Manages subscription status                          │
│  - Coordinates storage adapter selection                 │
│  - Handles authentication                               │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│ StorageAdapter │       │  AuthProvider   │
│  Interface     │       │  - User session │
│  - Local       │       │  - Premium flag │
│  - Cloud       │       └─────────────────┘
└───────┬────────┘
        │
   ┌────┴────┐
   │         │
┌──▼──┐  ┌──▼──────────────┐
│Local│  │ Cloud           │
│     │  │                 │
│Index│  │ Neon DB         │
│edDB │  │ (workspace)     │
│     │  │                 │
│OPFS │  │ Vercel Storage  │
│     │  │ (media files)   │
│     │  │                 │
│     │  │ Edge Config     │
│     │  │ (preferences)   │
└─────┘  └─────────────────┘
```

### Storage Adapter Pattern

The system uses a storage adapter pattern to abstract local vs cloud storage:

```typescript
interface StorageAdapter {
  // Workspace operations
  saveWorkspace(state: WorkspaceState): Promise<void>;
  loadWorkspace(): Promise<WorkspaceState | null>;
  clearWorkspace(): Promise<void>;
  
  // Media operations
  saveMediaFile(file: File): Promise<MediaFile>;
  getMediaFile(mediaId: number): Promise<File | null>;
  deleteMediaFile(mediaId: number): Promise<void>;
  listMediaFiles(): Promise<MediaFile[]>;
  
  // Preferences operations
  savePreferences(prefs: AppPreferences): Promise<void>;
  loadPreferences(): Promise<AppPreferences | null>;
  
  // Sync operations
  sync(): Promise<SyncResult>;
  getSyncStatus(): SyncStatus;
}
```

### Component Responsibilities

**StorageAdapter Interface**
- Defines contract for storage operations
- Abstracts local vs cloud implementation
- Provides consistent API for state management

**LocalStorageAdapter**
- Implements StorageAdapter using IndexedDB + OPFS
- Used for free users and offline mode
- Maintains existing local storage behavior

**CloudStorageAdapter**
- Implements StorageAdapter using Neon + Vercel Storage + Edge Config
- Used for premium users
- Handles authentication and API calls

**StorageManager**
- Selects appropriate adapter based on subscription status
- Handles fallback from cloud to local on errors
- Manages sync operations and conflict resolution

**AuthProvider**
- Manages user authentication state
- Tracks premium subscription status
- Provides user ID for data association

## Components and Interfaces

### Data Models

#### WorkspaceState (Cloud)

```typescript
interface WorkspaceState {
  id: string;                          // UUID for cloud storage
  userId: string;                      // User ID from auth
  screens: Screen[];                   // Array of all screens
  selectedScreenIndices: number[];     // Currently selected screens
  primarySelectedIndex: number;        // Primary selection
  selectedFrameIndex: number | null;   // Selected frame within screen
  zoom: number;                        // Canvas zoom level (10-400)
  createdAt: Date;                     // Workspace creation time
  updatedAt: Date;                     // Last modification time
  syncedAt: Date;                      // Last successful sync time
  version: number;                     // Version for conflict resolution
}
```

#### MediaFile (Cloud)

```typescript
interface MediaFile {
  id: number;                          // Media ID (same as local)
  userId: string;                      // User ID from auth
  name: string;                        // Original filename
  storageUrl: string;                  // Vercel Storage URL
  thumbnail: string;                   // Base64 thumbnail (cached)
  width: number;                       // Image width
  height: number;                      // Image height
  size: number;                        // File size in bytes
  createdAt: Date;                     // Upload time
  updatedAt: Date;                     // Last modification time
}
```

#### AppPreferences (Cloud)

```typescript
interface AppPreferences {
  userId: string;                      // User ID from auth
  sidebarTab: string;                  // Selected tab: 'layout' | 'device' | 'media' | 'text'
  sidebarPanelOpen: boolean;           // Panel expanded/collapsed
  navWidth: number;                    // Sidebar width in pixels
  theme: string;                       // Theme preference
  zoomDefault: number;                  // Default zoom level
  updatedAt: Date;                     // Last modification time
}
```

### Database Schema

#### Neon Database Schema

**workspaces table:**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,  -- WorkspaceState JSON
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_updated_at (updated_at)
);
```

**media_files table:**
```sql
CREATE TABLE media_files (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_url TEXT NOT NULL,  -- Vercel Storage URL
  thumbnail TEXT,              -- Base64 thumbnail
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

#### Vercel Edge Config Schema

**Key:** `preferences:{userId}`
**Value:** JSON string of AppPreferences

**Example:**
```json
{
  "userId": "user_123",
  "sidebarTab": "layout",
  "sidebarPanelOpen": true,
  "navWidth": 360,
  "theme": "light",
  "zoomDefault": 100,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### New Components

#### StorageAdapter.ts

**Purpose:** Abstract interface for storage operations

```typescript
export interface StorageAdapter {
  // Workspace
  saveWorkspace(state: WorkspaceState): Promise<void>;
  loadWorkspace(): Promise<WorkspaceState | null>;
  clearWorkspace(): Promise<void>;
  
  // Media
  saveMediaFile(file: File): Promise<MediaFile>;
  getMediaFile(mediaId: number): Promise<File | null>;
  deleteMediaFile(mediaId: number): Promise<void>;
  listMediaFiles(): Promise<MediaFile[]>;
  
  // Preferences
  savePreferences(prefs: AppPreferences): Promise<void>;
  loadPreferences(): Promise<AppPreferences | null>;
  
  // Sync
  sync(): Promise<SyncResult>;
  getSyncStatus(): SyncStatus;
}

export interface SyncResult {
  success: boolean;
  conflicts?: Conflict[];
  syncedAt?: Date;
}

export interface Conflict {
  type: 'workspace' | 'media' | 'preferences';
  localVersion: number;
  cloudVersion: number;
  resolution: 'local' | 'cloud' | 'merge';
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  hasPendingChanges: boolean;
  error: string | null;
}
```

#### LocalStorageAdapter.ts

**Purpose:** Implements StorageAdapter using IndexedDB + OPFS

```typescript
import { StorageAdapter } from './StorageAdapter';
import { persistenceDB } from '../lib/PersistenceDB';
import { OPFSManager } from '../lib/opfs';
import { db } from '../lib/db';

export class LocalStorageAdapter implements StorageAdapter {
  async saveWorkspace(state: WorkspaceState): Promise<void> {
    await persistenceDB.saveWorkspace(state);
  }
  
  async loadWorkspace(): Promise<WorkspaceState | null> {
    return await persistenceDB.loadWorkspace();
  }
  
  async clearWorkspace(): Promise<void> {
    await persistenceDB.clearWorkspace();
  }
  
  async saveMediaFile(file: File): Promise<MediaFile> {
    // Save to OPFS
    const fileName = `${Date.now()}-${file.name}`;
    await OPFSManager.saveFile(fileName, file);
    
    // Create thumbnail
    const thumbnail = await createThumbnail(file);
    
    // Get dimensions
    const img = await createImageBitmap(file);
    
    // Save metadata to IndexedDB
    const id = await db.mediaFiles.add({
      name: file.name,
      fileHandle: fileName,
      thumbnail,
      width: img.width,
      height: img.height,
      size: file.size,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return {
      id: id as number,
      name: file.name,
      fileHandle: fileName,
      thumbnail,
      width: img.width,
      height: img.height,
      size: file.size,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  async getMediaFile(mediaId: number): Promise<File | null> {
    const mediaFile = await db.mediaFiles.get(mediaId);
    if (!mediaFile) return null;
    return await OPFSManager.getFile(mediaFile.fileHandle);
  }
  
  async deleteMediaFile(mediaId: number): Promise<void> {
    const mediaFile = await db.mediaFiles.get(mediaId);
    if (mediaFile) {
      await OPFSManager.deleteFile(mediaFile.fileHandle);
      await db.mediaFiles.delete(mediaId);
    }
  }
  
  async listMediaFiles(): Promise<MediaFile[]> {
    return await db.mediaFiles.toArray();
  }
  
  async savePreferences(prefs: AppPreferences): Promise<void> {
    await persistenceDB.saveUIState({
      id: 'current',
      sidebarTab: prefs.sidebarTab,
      sidebarPanelOpen: prefs.sidebarPanelOpen,
      navWidth: prefs.navWidth,
      updatedAt: new Date(),
    });
  }
  
  async loadPreferences(): Promise<AppPreferences | null> {
    const uiState = await persistenceDB.loadUIState();
    if (!uiState) return null;
    return {
      userId: '', // Not applicable for local storage
      sidebarTab: uiState.sidebarTab,
      sidebarPanelOpen: uiState.sidebarPanelOpen,
      navWidth: uiState.navWidth,
      theme: 'light', // Default
      zoomDefault: 100, // Default
      updatedAt: uiState.updatedAt,
    };
  }
  
  async sync(): Promise<SyncResult> {
    // Local storage doesn't sync
    return { success: true };
  }
  
  getSyncStatus(): SyncStatus {
    return {
      isSyncing: false,
      lastSyncedAt: null,
      hasPendingChanges: false,
      error: null,
    };
  }
}
```

#### CloudStorageAdapter.ts

**Purpose:** Implements StorageAdapter using Neon + Vercel Storage + Edge Config

```typescript
import { StorageAdapter } from './StorageAdapter';
import { getUserId, isPremium } from '../auth';

export class CloudStorageAdapter implements StorageAdapter {
  private apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  async saveWorkspace(state: WorkspaceState): Promise<void> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const response = await fetch(`${this.apiBaseUrl}/workspace`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        ...state,
        userId,
        updatedAt: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save workspace: ${response.statusText}`);
    }
  }
  
  async loadWorkspace(): Promise<WorkspaceState | null> {
    const userId = await getUserId();
    if (!userId) return null;
    
    const response = await fetch(`${this.apiBaseUrl}/workspace`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to load workspace: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async clearWorkspace(): Promise<void> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const response = await fetch(`${this.apiBaseUrl}/workspace`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear workspace: ${response.statusText}`);
    }
  }
  
  async saveMediaFile(file: File): Promise<MediaFile> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    // Upload to Vercel Storage
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch(`${this.apiBaseUrl}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload media: ${uploadResponse.statusText}`);
    }
    
    return await uploadResponse.json();
  }
  
  async getMediaFile(mediaId: number): Promise<File | null> {
    const userId = await getUserId();
    if (!userId) return null;
    
    const response = await fetch(`${this.apiBaseUrl}/media/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to get media: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new File([blob], 'image', { type: blob.type });
  }
  
  async deleteMediaFile(mediaId: number): Promise<void> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const response = await fetch(`${this.apiBaseUrl}/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete media: ${response.statusText}`);
    }
  }
  
  async listMediaFiles(): Promise<MediaFile[]> {
    const userId = await getUserId();
    if (!userId) return [];
    
    const response = await fetch(`${this.apiBaseUrl}/media`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list media: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async savePreferences(prefs: AppPreferences): Promise<void> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const response = await fetch(`${this.apiBaseUrl}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        ...prefs,
        userId,
        updatedAt: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save preferences: ${response.statusText}`);
    }
  }
  
  async loadPreferences(): Promise<AppPreferences | null> {
    const userId = await getUserId();
    if (!userId) return null;
    
    // Use Edge Config for fast access
    const response = await fetch(`${this.apiBaseUrl}/preferences`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to load preferences: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async sync(): Promise<SyncResult> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const response = await fetch(`${this.apiBaseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  getSyncStatus(): SyncStatus {
    // This would be managed by a sync manager component
    return {
      isSyncing: false,
      lastSyncedAt: null,
      hasPendingChanges: false,
      error: null,
    };
  }
}
```

#### StorageManager.ts

**Purpose:** Selects and manages storage adapter based on subscription status

```typescript
import { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { CloudStorageAdapter } from './CloudStorageAdapter';
import { isPremium } from '../auth';

export class StorageManager {
  private localAdapter: LocalStorageAdapter;
  private cloudAdapter: CloudStorageAdapter | null = null;
  
  constructor() {
    this.localAdapter = new LocalStorageAdapter();
  }
  
  async getAdapter(): Promise<StorageAdapter> {
    const premium = await isPremium();
    
    if (premium) {
      if (!this.cloudAdapter) {
        this.cloudAdapter = new CloudStorageAdapter();
      }
      return this.cloudAdapter;
    }
    
    return this.localAdapter;
  }
  
  async getHybridAdapter(): Promise<StorageAdapter> {
    // Premium users use hybrid: cloud primary, local fallback
    const premium = await isPremium();
    
    if (premium) {
      return new HybridStorageAdapter(
        this.cloudAdapter || new CloudStorageAdapter(),
        this.localAdapter
      );
    }
    
    return this.localAdapter;
  }
}
```

#### HybridStorageAdapter.ts

**Purpose:** Combines cloud and local storage for premium users (offline support)

```typescript
import { StorageAdapter } from './StorageAdapter';

export class HybridStorageAdapter implements StorageAdapter {
  constructor(
    private cloud: StorageAdapter,
    private local: StorageAdapter
  ) {}
  
  async saveWorkspace(state: WorkspaceState): Promise<void> {
    // Save to both cloud and local
    try {
      await Promise.all([
        this.cloud.saveWorkspace(state),
        this.local.saveWorkspace(state),
      ]);
    } catch (error) {
      // If cloud fails, still save locally
      await this.local.saveWorkspace(state);
      throw error;
    }
  }
  
  async loadWorkspace(): Promise<WorkspaceState | null> {
    // Try cloud first, fallback to local
    try {
      const cloudState = await this.cloud.loadWorkspace();
      if (cloudState) {
        // Sync to local for offline access
        await this.local.saveWorkspace(cloudState);
        return cloudState;
      }
    } catch (error) {
      console.warn('Cloud load failed, using local:', error);
    }
    
    return await this.local.loadWorkspace();
  }
  
  // Similar pattern for other methods...
}
```

### API Routes

#### app/api/workspace/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const result = await sql`
    SELECT data FROM workspaces 
    WHERE user_id = ${userId} 
    ORDER BY updated_at DESC 
    LIMIT 1
  `;
  
  if (result.length === 0) {
    return NextResponse.json(null, { status: 404 });
  }
  
  return NextResponse.json(result[0].data);
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const workspace = await request.json();
  
  await sql`
    INSERT INTO workspaces (user_id, data, version, updated_at)
    VALUES (${userId}, ${JSON.stringify(workspace)}::jsonb, 1, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = ${JSON.stringify(workspace)}::jsonb,
        version = workspaces.version + 1,
        updated_at = NOW()
  `;
  
  return NextResponse.json({ success: true });
}
```

#### app/api/media/upload/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Upload to Vercel Storage
  const blob = await put(`media/${userId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });
  
  // Create thumbnail
  const thumbnail = await createThumbnail(file);
  
  // Get dimensions
  const img = await createImageBitmap(file);
  
  // Save metadata to Neon
  const mediaFile = {
    userId,
    name: file.name,
    storageUrl: blob.url,
    thumbnail,
    width: img.width,
    height: img.height,
    size: file.size,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Insert into Neon database...
  
  return NextResponse.json(mediaFile);
}
```

#### app/api/preferences/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { get, set } from '@vercel/edge-config';

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const prefs = await get(`preferences:${userId}`);
  if (!prefs) {
    return NextResponse.json(null, { status: 404 });
  }
  
  return NextResponse.json(JSON.parse(prefs));
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const preferences = await request.json();
  
  await set(`preferences:${userId}`, JSON.stringify({
    ...preferences,
    userId,
    updatedAt: new Date().toISOString(),
  }));
  
  return NextResponse.json({ success: true });
}
```

## Data Flow

### Premium User Save Flow

```
1. User modifies workspace
   ↓
2. StorageManager.getAdapter() → CloudStorageAdapter
   ↓
3. CloudStorageAdapter.saveWorkspace()
   - Authenticates user
   - Calls /api/workspace PUT
   ↓
4. API route saves to Neon database
   ↓
5. Also saves to local storage (HybridStorageAdapter)
   ↓
6. Updates sync status
```

### Premium User Load Flow

```
1. App loads
   ↓
2. StorageManager.getAdapter() → CloudStorageAdapter
   ↓
3. CloudStorageAdapter.loadWorkspace()
   - Authenticates user
   - Calls /api/workspace GET
   ↓
4. API route loads from Neon database
   ↓
5. Also caches in local storage
   ↓
6. Restores workspace state
```

### Free User Flow

```
1. User modifies workspace
   ↓
2. StorageManager.getAdapter() → LocalStorageAdapter
   ↓
3. LocalStorageAdapter.saveWorkspace()
   - Saves to IndexedDB only
   ↓
4. No cloud sync
```

## Error Handling

### Cloud Storage Failures

**Network Errors:**
- Catch fetch errors
- Fall back to local storage
- Show "Offline mode" indicator
- Queue changes for sync when online

**Authentication Errors:**
- Catch 401/403 errors
- Prompt user to re-authenticate
- Fall back to local storage temporarily

**Quota Errors:**
- Catch storage quota exceeded
- Show user notification
- Suggest cleanup options
- Prevent new uploads

### Sync Conflicts

**Conflict Resolution:**
- Compare version numbers
- Last-write-wins by default
- Optionally prompt user for resolution
- Store conflict history

## Testing Strategy

### Unit Tests

**StorageAdapter Tests:**
- Test LocalStorageAdapter implementation
- Test CloudStorageAdapter implementation
- Test HybridStorageAdapter fallback logic
- Test StorageManager adapter selection

**API Route Tests:**
- Test workspace CRUD operations
- Test media upload/download
- Test preferences storage
- Test authentication checks

### Integration Tests

**End-to-End Premium Flow:**
- Create workspace → save to cloud → reload → verify restored
- Upload media → verify in Vercel Storage → download → verify
- Change preferences → verify in Edge Config → reload → verify

**Hybrid Storage Tests:**
- Save while offline → verify local save → go online → verify sync
- Cloud save fails → verify local fallback → verify retry

### Property-Based Tests

Property tests will be defined in the tasks.md file.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Premium workspace persistence
*For any* premium user workspace modification, after saving and reloading, the workspace should be restored from cloud storage with the same configuration
**Validates: Requirements 1.1, 1.3**

### Property 2: Premium media file persistence
*For any* premium user media file upload, the file should be stored in Vercel Storage and metadata should be stored in Neon database
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Premium preferences persistence
*For any* premium user preference change, the preference should be stored in Edge Config and restored on reload
**Validates: Requirements 3.1, 3.3**

### Property 4: Free user local-only storage
*For any* free user operation, data should be stored only in local storage (IndexedDB + OPFS) and not in cloud storage
**Validates: Requirements 9.1**

### Property 5: Hybrid storage fallback
*For any* cloud storage operation failure, the system should fall back to local storage without data loss
**Validates: Requirements 1.5, 2.6**

### Property 6: Sync conflict resolution
*For any* sync conflict between local and cloud versions, the system should resolve using last-write-wins or user prompt
**Validates: Requirements 4.3**

### Property 7: Authentication requirement
*For any* cloud storage operation, the system should verify user authentication before proceeding
**Validates: Requirements 5.1, 5.2**

### Property 8: Storage adapter abstraction
*For any* storage operation, the system should use the StorageAdapter interface regardless of local or cloud implementation
**Validates: Requirements 7.1, 11.1**

## Security Considerations

**Authentication:**
- Use secure token-based authentication
- Verify tokens on every API request
- Implement token refresh mechanism
- Store tokens securely (httpOnly cookies)

**Data Isolation:**
- All queries filtered by userId
- No cross-user data access
- Validate user permissions on every operation

**File Upload Security:**
- Validate file types and sizes
- Scan for malware (optional)
- Use signed URLs for file access
- Implement rate limiting

## Performance Considerations

**Caching:**
- Cache workspace data in local storage
- Use Edge Config for fast preference access
- Lazy-load media files
- Use CDN for media file delivery

**Optimization:**
- Batch API requests when possible
- Use pagination for large datasets
- Compress JSON payloads
- Use efficient image formats (WebP)

## Browser Compatibility

**Required APIs:**
- Fetch API (universal support)
- IndexedDB (for local storage fallback)
- File API (for media handling)

**Target Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration Strategy

### Phase 1: Infrastructure Setup
- Set up Neon database
- Configure Vercel Storage
- Set up Edge Config
- Create API routes

### Phase 2: Storage Adapter Implementation
- Implement StorageAdapter interface
- Create LocalStorageAdapter
- Create CloudStorageAdapter
- Create StorageManager

### Phase 3: Authentication Integration
- Implement auth provider
- Add premium subscription check
- Add user ID tracking

### Phase 4: UI Integration
- Add sync status indicator
- Add premium upgrade prompts
- Add storage usage display
- Add error notifications

### Phase 5: Testing and Polish
- Test all storage operations
- Test error scenarios
- Optimize performance
- Add monitoring
