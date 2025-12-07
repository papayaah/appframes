# Design Document

## Overview

This feature implements comprehensive state persistence for AppFrames using IndexedDB with the idb library for local storage, with optional cloud storage for premium users. The system automatically saves and restores the complete application state including screens, canvas settings, UI preferences, and user selections. The design prioritizes performance through debounced writes, efficient indexing, and asynchronous operations that don't block the UI.

The persistence layer extends the existing Dexie-based database to include workspace state while maintaining the current OPFS + IndexedDB architecture for media files. All state updates are debounced to prevent excessive writes during rapid user interactions like dragging sliders or panning images.

Premium users have their data synced to cloud storage: Neon database for workspace data, Vercel Storage for media files, and Vercel Edge Config for app preferences. The architecture uses a StorageAdapter pattern to abstract local vs cloud storage, allowing seamless switching based on subscription status.

## Architecture

### High-Level Architecture

**Local Storage (Free Users):**
```
┌─────────────────────────────────────────────────────────┐
│                    AppFrames (Root)                      │
│  - Manages screens array                                 │
│  - Coordinates state persistence                         │
│  - Handles debounced saves                               │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│  FramesContext │       │ StorageManager │
│  - State mgmt  │       │ - Adapter sel   │
│  - Triggers    │       │ - Fallback      │
│    saves       │       └────────┬────────┘
└────────────────┘                │
                         ┌────────▼────────┐
                         │LocalStorageAdap │
                         │  - PersistenceDB│
                         │  - OPFSManager  │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │   IndexedDB     │
                         │  - workspace    │
                         │  - uiState      │
                         │  - mediaFiles   │
                         │   OPFS (files)  │
                         └─────────────────┘
```

**Cloud Storage (Premium Users):**
```
┌─────────────────────────────────────────────────────────┐
│                    AppFrames (Root)                      │
│  - Manages screens array                                 │
│  - Coordinates state persistence                         │
│  - Handles debounced saves                               │
│  - Manages subscription status                           │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│  FramesContext │       │ StorageManager │
│  - State mgmt  │       │ - Adapter sel   │
│  - Triggers    │       │ - Hybrid mode   │
│    saves       │       └────────┬────────┘
└────────────────┘                │
                         ┌────────▼────────┐
                         │HybridStorageAdap│
                         │  - Cloud + Local│
                         └────┬────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────▼────────┐                          ┌───────▼────────┐
│CloudStorageAdap│                          │LocalStorageAdap│
│  - Neon DB     │                          │  - IndexedDB    │
│  - Vercel Stor │                          │  - OPFS         │
│  - Edge Config │                          └─────────────────┘
└───────┬────────┘
        │
   ┌────┴────┐
   │         │
┌──▼──┐  ┌──▼──────────────┐
│Neon │  │ Vercel Storage  │
│DB   │  │ Edge Config      │
└─────┘  └──────────────────┘
```

### Component Responsibilities

**FramesContext.tsx**
- Manages application state (screens, settings, selections)
- Triggers persistence on state changes
- Loads initial state from IndexedDB on mount
- Provides hooks for components to access state

**PersistenceDB.ts** (New)
- Wraps idb library for database operations
- Defines database schema and object stores
- Provides async methods for CRUD operations
- Handles database migrations and upgrades
- Implements error handling and fallbacks

**usePersistence.ts** (New)
- Custom hook for debounced state persistence
- Manages save queue and batching
- Handles flush on unmount/navigation
- Provides status indicators (saving, saved, error)

**AppFrames.tsx**
- Initializes persistence on mount
- Coordinates between FramesContext and PersistenceDB
- Handles workspace clear/reset operations
- Manages error states and user notifications
- Checks subscription status for storage adapter selection

**StorageManager.ts** (New - Premium)
- Selects appropriate storage adapter based on subscription status
- Provides LocalStorageAdapter for free users
- Provides HybridStorageAdapter for premium users
- Handles fallback from cloud to local on errors

**StorageAdapter Interface** (New - Premium)
- Abstract interface for storage operations
- Implemented by LocalStorageAdapter and CloudStorageAdapter
- Provides consistent API regardless of storage backend

**LocalStorageAdapter** (New - Premium)
- Implements StorageAdapter using IndexedDB + OPFS
- Used for free users and offline mode
- Maintains existing local storage behavior

**CloudStorageAdapter** (New - Premium)
- Implements StorageAdapter using Neon + Vercel Storage + Edge Config
- Used for premium users
- Handles authentication and API calls

**HybridStorageAdapter** (New - Premium)
- Combines cloud and local storage for premium users
- Saves to both cloud and local for offline support
- Loads from cloud first, falls back to local

## Components and Interfaces

### Data Models

#### WorkspaceState

```typescript
interface WorkspaceState {
  id: string;                          // Always 'current' for single workspace
  screens: Screen[];                   // Array of all screens
  selectedScreenIndices: number[];     // Currently selected screens
  primarySelectedIndex: number;        // Primary selection
  selectedFrameIndex: number | null;   // Selected frame within screen
  zoom: number;                        // Canvas zoom level (10-400)
  createdAt: Date;                     // Workspace creation time
  updatedAt: Date;                     // Last modification time
}
```

#### UIState

```typescript
interface UIState {
  id: string;                          // Always 'current' for single UI state
  sidebarTab: string;                  // Selected tab: 'layout' | 'device' | 'media' | 'text'
  sidebarPanelOpen: boolean;           // Panel expanded/collapsed
  navWidth: number;                    // Sidebar width in pixels
  updatedAt: Date;                     // Last modification time
}
```

#### Screen (Extended)

```typescript
interface Screen {
  id: string;                          // Unique screen identifier
  name: string;                        // Screen name
  images: ScreenImage[];               // Array of images for multi-device
  settings: CanvasSettings;            // Canvas configuration
  partialElements?: PartialElementData[]; // Cross-canvas elements
  createdAt: Date;                     // Screen creation time
  updatedAt: Date;                     // Last modification time
}
```

#### ScreenImage

```typescript
interface ScreenImage {
  mediaId?: number;                    // Reference to media library
  image?: string;                      // Legacy base64 (deprecated)
  panX?: number;                       // Horizontal pan (0-100)
  panY?: number;                       // Vertical pan (0-100)
  frameX?: number;                     // Frame X offset
  frameY?: number;                     // Frame Y offset
}
```

#### CanvasSettings

```typescript
interface CanvasSettings {
  canvasSize: string;                  // Export dimensions
  deviceFrame: string;                 // Device frame type
  composition: string;                 // Layout type
  compositionScale: number;            // 50-100
  captionVertical: number;             // 0-100
  captionHorizontal: number;           // 0-100
  selectedScreenIndex: number;         // Deprecated (use workspace level)
  screenScale: number;                 // 0-100
  screenPanX: number;                  // 0-100 (deprecated, use per-image)
  screenPanY: number;                  // 0-100 (deprecated, use per-image)
  orientation: string;                 // portrait/landscape
  backgroundColor: string;             // Hex color
  captionText: string;                 // Caption content
  showCaption: boolean;                // Toggle caption
}
```

### Database Schema

#### Object Stores

**workspace** (Primary Key: id)
- Stores: WorkspaceState
- Indexes: updatedAt
- Single record with id='current'

**uiState** (Primary Key: id)
- Stores: UIState
- Indexes: none needed
- Single record with id='current'

**mediaFiles** (Primary Key: ++id)
- Stores: MediaFile (existing)
- Indexes: name, createdAt
- Multiple records for uploaded media

#### Database Version History

**Version 1** (Existing)
- mediaFiles object store

**Version 2** (New)
- Add workspace object store
- Add uiState object store
- Migration: Initialize with empty state

### Cloud Storage Schema (Premium Users)

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

#### Cloud Storage Data Models

**WorkspaceState (Cloud):**
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

**MediaFile (Cloud):**
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

**AppPreferences (Cloud):**
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

### StorageAdapter Interface (Premium)

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

### API Routes (Premium)

**app/api/workspace/route.ts**
- GET: Load workspace from Neon database
- PUT: Save workspace to Neon database
- DELETE: Clear workspace from Neon database
- Requires authentication

**app/api/media/upload/route.ts**
- POST: Upload file to Vercel Storage, save metadata to Neon
- Returns MediaFile object

**app/api/media/[id]/route.ts**
- GET: Download file from Vercel Storage
- DELETE: Delete file from Vercel Storage and Neon

**app/api/media/route.ts**
- GET: List user's media files from Neon

**app/api/preferences/route.ts**
- GET: Read preferences from Edge Config
- PUT: Write preferences to Edge Config

**app/api/sync/route.ts**
- POST: Detect and resolve conflicts between local and cloud

### New Components

#### PersistenceDB.ts

**Purpose:** Provides database operations using idb library

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppFramesDBSchema extends DBSchema {
  workspace: {
    key: string;
    value: WorkspaceState;
    indexes: { 'updatedAt': Date };
  };
  uiState: {
    key: string;
    value: UIState;
  };
  mediaFiles: {
    key: number;
    value: MediaFile;
    indexes: { 'name': string; 'createdAt': Date };
  };
}

class PersistenceDB {
  private db: IDBPDatabase<AppFramesDBSchema> | null = null;
  
  async init(): Promise<void> {
    this.db = await openDB<AppFramesDBSchema>('AppFrames', 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Version 1: mediaFiles (already exists)
        if (oldVersion < 1) {
          const mediaStore = db.createObjectStore('mediaFiles', {
            keyPath: 'id',
            autoIncrement: true,
          });
          mediaStore.createIndex('name', 'name');
          mediaStore.createIndex('createdAt', 'createdAt');
        }
        
        // Version 2: workspace and uiState
        if (oldVersion < 2) {
          const workspaceStore = db.createObjectStore('workspace', {
            keyPath: 'id',
          });
          workspaceStore.createIndex('updatedAt', 'updatedAt');
          
          db.createObjectStore('uiState', {
            keyPath: 'id',
          });
        }
      },
    });
  }
  
  // Workspace operations
  async saveWorkspace(state: WorkspaceState): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('workspace', {
      ...state,
      id: 'current',
      updatedAt: new Date(),
    });
  }
  
  async loadWorkspace(): Promise<WorkspaceState | null> {
    if (!this.db) await this.init();
    return await this.db!.get('workspace', 'current') || null;
  }
  
  async clearWorkspace(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('workspace', 'current');
  }
  
  // UI State operations
  async saveUIState(state: UIState): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('uiState', {
      ...state,
      id: 'current',
      updatedAt: new Date(),
    });
  }
  
  async loadUIState(): Promise<UIState | null> {
    if (!this.db) await this.init();
    return await this.db!.get('uiState', 'current') || null;
  }
}

export const persistenceDB = new PersistenceDB();
```

**Key Methods:**
- `init()` - Opens database with version 2, runs migrations
- `saveWorkspace(state)` - Saves complete workspace state
- `loadWorkspace()` - Loads workspace state or returns null
- `clearWorkspace()` - Deletes workspace for fresh start
- `saveUIState(state)` - Saves UI preferences
- `loadUIState()` - Loads UI preferences or returns null

#### usePersistence.ts

**Purpose:** Custom hook for debounced state persistence

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { persistenceDB } from './PersistenceDB';

interface UsePersistenceOptions {
  debounceMs?: number;  // Default: 500ms
  onError?: (error: Error) => void;
}

export function usePersistence(options: UsePersistenceOptions = {}) {
  const { debounceMs = 500, onError } = options;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
  
  // Debounced save function
  const debouncedSave = useCallback((saveFn: () => Promise<void>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Store pending save
    pendingSaveRef.current = saveFn;
    
    // Schedule save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveFn();
        pendingSaveRef.current = null;
      } catch (error) {
        onError?.(error as Error);
      }
    }, debounceMs);
  }, [debounceMs, onError]);
  
  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Execute pending save immediately
      if (pendingSaveRef.current) {
        pendingSaveRef.current().catch(onError);
      }
    };
  }, [onError]);
  
  return { debouncedSave };
}
```

**Features:**
- Debounces rapid state changes
- Flushes pending saves on unmount
- Provides error callback
- Configurable debounce delay

### Modified Components

#### FramesContext.tsx

**New Responsibilities:**
- Load initial state from IndexedDB on mount
- Trigger debounced saves on state changes
- Provide workspace clear/reset methods

**New Methods:**
```typescript
// Load state from IndexedDB
async function loadPersistedState(): Promise<void> {
  try {
    const workspace = await persistenceDB.loadWorkspace();
    if (workspace) {
      setScreens(workspace.screens);
      setSelectedScreenIndices(workspace.selectedScreenIndices);
      setPrimarySelectedIndex(workspace.primarySelectedIndex);
      setSelectedFrameIndex(workspace.selectedFrameIndex);
      setZoom(workspace.zoom);
    }
    
    const uiState = await persistenceDB.loadUIState();
    if (uiState) {
      setSidebarTab(uiState.sidebarTab);
      setSidebarPanelOpen(uiState.sidebarPanelOpen);
      setNavWidth(uiState.navWidth);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    // Continue with default state
  }
}

// Save workspace state (debounced)
function saveWorkspaceState(): void {
  debouncedSave(async () => {
    await persistenceDB.saveWorkspace({
      id: 'current',
      screens,
      selectedScreenIndices,
      primarySelectedIndex,
      selectedFrameIndex,
      zoom,
      createdAt: workspaceCreatedAt,
      updatedAt: new Date(),
    });
  });
}

// Clear workspace
async function clearWorkspace(): Promise<void> {
  await persistenceDB.clearWorkspace();
  // Reset to default state
  setScreens([]);
  setSelectedScreenIndices([]);
  setPrimarySelectedIndex(0);
  setSelectedFrameIndex(null);
  setZoom(100);
  // Add one empty screen
  addScreen();
}
```

**State Change Triggers:**
- useEffect watching screens → saveWorkspaceState()
- useEffect watching selectedScreenIndices → saveWorkspaceState()
- useEffect watching zoom → saveWorkspaceState()
- useEffect watching sidebarTab → saveUIState()

#### AppFrames.tsx

**New Responsibilities:**
- Initialize persistence on mount
- Provide UI for workspace clear/reset
- Handle persistence errors with user notifications

**Initialization:**
```typescript
useEffect(() => {
  // Initialize persistence database
  persistenceDB.init().catch(error => {
    console.error('Failed to initialize persistence:', error);
    // Show user notification
    showNotification({
      title: 'Persistence Unavailable',
      message: 'Your work will not be saved across sessions.',
      color: 'yellow',
    });
  });
}, []);
```

## Data Flow

### Initial Load Flow

```
1. App starts
   ↓
2. PersistenceDB.init()
   - Opens IndexedDB
   - Runs migrations if needed
   ↓
3. FramesContext.loadPersistedState()
   - Loads workspace from IndexedDB
   - Loads UI state from IndexedDB
   ↓
4. State is restored
   - Screens array populated
   - Selections restored
   - UI preferences applied
   ↓
5. App renders with restored state
```

### State Update Flow

```
1. User modifies state (e.g., adds screen)
   ↓
2. FramesContext updates React state
   ↓
3. useEffect detects state change
   ↓
4. usePersistence.debouncedSave() called
   - Clears existing timeout
   - Schedules new save after 500ms
   ↓
5. If no more changes in 500ms:
   ↓
6. PersistenceDB.saveWorkspace()
   - Writes to IndexedDB
   - Updates timestamp
   ↓
7. Save completes (async, non-blocking)
```

### Workspace Clear Flow

```
1. User clicks "Clear Workspace"
   ↓
2. Confirmation dialog shown
   ↓
3. User confirms
   ↓
4. FramesContext.clearWorkspace()
   - Calls PersistenceDB.clearWorkspace()
   - Resets React state to defaults
   - Adds one empty screen
   ↓
5. Media library preserved
   ↓
6. UI updates with fresh workspace
```

## Error Handling

### Database Initialization Errors

**IndexedDB Unavailable:**
- Catch error during init()
- Log error to console
- Show user notification: "Persistence unavailable"
- Continue with in-memory state only
- Disable save operations

**Database Corruption:**
- Catch error during init()
- Attempt to delete and recreate database
- If recreation fails, fall back to in-memory
- Notify user of data loss

### Save Operation Errors

**Write Failure:**
- Catch error in debouncedSave()
- Log error to console
- Retry once after 1 second
- If retry fails, show user notification
- Continue operation (don't crash app)

**Quota Exceeded:**
- Catch QuotaExceededError
- Show user notification: "Storage full"
- Suggest clearing old screens or media
- Provide "Clear Workspace" button
- Continue with current state

### Load Operation Errors

**Read Failure:**
- Catch error in loadPersistedState()
- Log error to console
- Use default empty state
- Show user notification: "Could not restore previous session"
- Continue with fresh state

**Data Corruption:**
- Catch error during state restoration
- Validate loaded data structure
- If invalid, use default state
- Log corruption details
- Notify user of data loss

## Testing Strategy

### Unit Testing

**PersistenceDB Operations:**
- Test database initialization
- Test workspace save and load
- Test UI state save and load
- Test workspace clear
- Test error handling for each operation

**usePersistence Hook:**
- Test debounce behavior
- Test flush on unmount
- Test error callback invocation
- Test multiple rapid saves

**State Restoration:**
- Test loading empty database
- Test loading with existing data
- Test handling invalid data
- Test default value fallbacks

### Integration Testing

**End-to-End Persistence:**
- Create screens → reload page → verify screens restored
- Change settings → reload page → verify settings restored
- Select screens → reload page → verify selection restored
- Change sidebar tab → reload page → verify tab restored

**Workspace Management:**
- Clear workspace → verify all screens deleted
- Clear workspace → verify media library preserved
- Clear workspace → verify one empty screen created

**Error Scenarios:**
- Simulate quota exceeded → verify user notification
- Simulate database unavailable → verify fallback to memory
- Simulate corrupted data → verify graceful degradation

### Property-Based Testing

Property-based tests will be defined after completing the prework analysis in the next section.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Screen persistence
*For any* screen added to the workspace, after saving and reloading, the screen should be present in the restored workspace with the same configuration
**Validates: Requirements 1.1, 1.4**

### Property 2: Screen modification persistence
*For any* screen setting modification, after saving and reloading, the modified setting should be restored with the same value
**Validates: Requirements 1.2, 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Screen deletion persistence
*For any* screen removed from the workspace, after saving and reloading, the screen should not be present in the restored workspace
**Validates: Requirements 1.3**

### Property 4: Selection persistence
*For any* screen selection state, after saving and reloading, the same screens should be selected
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Zoom persistence
*For any* zoom level between 10-400%, after saving and reloading, the zoom level should be restored to the same value
**Validates: Requirements 5.1, 5.2, 5.4**

### Property 6: Sidebar state persistence
*For any* sidebar tab selection and panel state, after saving and reloading, the sidebar should restore to the same tab and open/closed state
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 7: Frame-specific settings persistence
*For any* frame-specific pan, scale, or position values, after saving and reloading, the frame settings should be restored with the same values
**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 8: Debounce batching
*For any* sequence of rapid state changes within the debounce window, only one database write should occur after the final change
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 9: Flush on unmount
*For any* pending save operation when the component unmounts, the save should complete before unmount finishes
**Validates: Requirements 8.5**

### Property 10: Workspace clear completeness
*For any* workspace state, after clearing the workspace, all screens should be deleted and settings should be reset to defaults
**Validates: Requirements 9.2, 9.3**

### Property 11: Media library preservation
*For any* workspace clear operation, the media library should remain unchanged with all uploaded images preserved
**Validates: Requirements 9.4**

### Property 12: Error resilience
*For any* database operation failure, the application should continue functioning with in-memory state without crashing
**Validates: Requirements 10.1, 10.2, 10.3**

### Property 13: Default value fallback
*For any* missing or invalid persisted value, the system should use the documented default value
**Validates: Requirements 1.5, 3.5, 4.4, 5.3**

### Property 14: Quota handling
*For any* quota exceeded error, the system should notify the user and continue operation without data loss
**Validates: Requirements 10.4**

### Property 15: Database migration safety
*For any* database version upgrade, existing data should be preserved and migrated to the new schema without loss
**Validates: Requirements 7.3, 7.4**

## Implementation Details

### idb Library Usage

**Installation:**
```bash
npm install idb
```

**Type Safety:**
The idb library provides full TypeScript support through the DBSchema interface, ensuring type-safe database operations.

**Advantages over Dexie:**
- Lighter weight (3KB vs 50KB)
- Closer to native IndexedDB API
- Better tree-shaking
- Simpler Promise-based API
- No class-based abstractions

**Migration from Dexie:**
The existing Dexie database will be migrated to idb:
1. Keep Dexie for media files (already working)
2. Use idb for new workspace/uiState stores
3. Both can coexist in same database
4. Future: migrate media files to idb

### Debounce Implementation

**Strategy:**
Use a simple timeout-based debounce with immediate flush on unmount.

**Debounce Delay:**
- Default: 500ms
- Configurable per use case
- Slider interactions: 500ms
- Text input: 1000ms
- Selection changes: 300ms

**Batching:**
Multiple state changes within the debounce window are automatically batched into a single write.

### Database Schema Evolution

**Version 2 Migration:**
```typescript
if (oldVersion < 2) {
  // Create workspace store
  const workspaceStore = db.createObjectStore('workspace', {
    keyPath: 'id',
  });
  workspaceStore.createIndex('updatedAt', 'updatedAt');
  
  // Create uiState store
  db.createObjectStore('uiState', {
    keyPath: 'id',
  });
  
  // Initialize with empty state
  const tx = transaction.objectStore('workspace');
  await tx.put({
    id: 'current',
    screens: [],
    selectedScreenIndices: [],
    primarySelectedIndex: 0,
    selectedFrameIndex: null,
    zoom: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
```

**Future Migrations:**
- Version 3: Add workspace templates
- Version 4: Add undo/redo history
- Version 5: Add project metadata

### Performance Optimizations

**Lazy Initialization:**
Database is initialized on first access, not on app load.

**Selective Saves:**
Only save changed portions of state:
- Workspace changes → save workspace only
- UI changes → save uiState only
- Don't save if state hasn't changed

**Index Usage:**
Use updatedAt index for efficient queries:
- Find recent workspaces
- Sort by modification time
- Clean up old data

**Transaction Batching:**
Group multiple operations in single transaction when possible.

### Error Recovery Strategies

**Automatic Retry:**
- Retry failed saves once after 1 second
- Don't retry more than once to avoid loops
- Log retry attempts for debugging

**Graceful Degradation:**
- If IndexedDB unavailable, use memory only
- Disable save UI indicators
- Show warning banner
- Continue full functionality

**Data Validation:**
- Validate loaded data structure
- Check for required fields
- Verify data types
- Sanitize invalid values

**User Notifications:**
- Use Mantine notifications for errors
- Provide actionable suggestions
- Don't block user workflow
- Log details to console

## Dependencies

### New Dependencies

**idb** (^8.0.0)
- Lightweight IndexedDB wrapper
- Promise-based API
- Full TypeScript support
- 3KB gzipped

### Existing Dependencies

- React 19.2.0 - Hooks and effects
- TypeScript 5.9.3 - Type safety
- Mantine 8.3.9 - Notifications UI
- Dexie 4.2.1 - Media files (existing)

## Browser Compatibility

**IndexedDB Support:**
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

**idb Library Support:**
- All modern browsers
- Same as IndexedDB support
- No polyfills needed

**Target Browsers:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## Migration Strategy

### Phase 1: Add idb and New Stores
- Install idb library
- Create PersistenceDB.ts
- Define schema version 2
- Test database creation

### Phase 2: Implement Persistence Hook
- Create usePersistence.ts
- Implement debounce logic
- Add flush on unmount
- Test hook behavior

### Phase 3: Integrate with FramesContext
- Add load on mount
- Add save on state changes
- Test state restoration
- Handle errors gracefully

### Phase 4: Add UI Features
- Add clear workspace button
- Add persistence status indicator
- Add error notifications
- Test user workflows

### Phase 5: Optimize and Polish
- Tune debounce delays
- Add selective saves
- Optimize index usage
- Performance testing

## Security Considerations

**Data Privacy:**
- All data stored locally in browser
- No server transmission
- User controls data deletion
- Clear workspace feature available

**XSS Prevention:**
- Sanitize loaded data
- Validate data structure
- Use React's built-in XSS protection
- Don't execute loaded code

**Quota Management:**
- Monitor storage usage
- Warn before quota exceeded
- Provide cleanup options
- Don't silently fail

## Accessibility

**Keyboard Support:**
- Clear workspace accessible via keyboard
- Notifications dismissible via keyboard
- Focus management during operations

**Screen Reader Support:**
- Announce save status changes
- Announce errors with context
- Provide text alternatives for icons

**Visual Indicators:**
- Show save status (saving, saved, error)
- Use color + icon for status
- Ensure sufficient contrast

## Future Enhancements

**Multiple Workspaces:**
- Support multiple named workspaces
- Switch between workspaces
- Import/export workspaces

**Undo/Redo:**
- Store operation history
- Implement undo/redo stack
- Persist history to IndexedDB

**Auto-Save Indicator:**
- Show "Saving..." indicator
- Show "All changes saved" confirmation
- Show last saved timestamp

**Cloud Sync:**
- Optional cloud backup
- Sync across devices
- Conflict resolution

**Workspace Templates:**
- Save workspace as template
- Load from template
- Share templates

