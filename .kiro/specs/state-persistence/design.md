# Design Document

## Overview

This feature implements comprehensive state persistence for AppFrames using IndexedDB with the idb library. The system automatically saves and restores the complete application state including projects, screens, canvas settings, UI preferences, and user selections. The design prioritizes performance through debounced writes, efficient indexing, and asynchronous operations that don't block the UI.

The persistence layer extends the existing Dexie-based database to include project state while maintaining the current OPFS + IndexedDB architecture for media files. All state updates are debounced to prevent excessive writes during rapid user interactions like dragging sliders or panning images.

### Multi-Project Architecture

Users can create and manage multiple projects (e.g., "My Fitness App", "My Game App"). Each project is completely independent with its own:
- Screens organized by canvas size
- Canvas settings and preferences
- Selection state

**Free vs Pro Tiers:**
- **Free users**: Limited to 1 project
- **Pro users**: Unlimited projects

This spec focuses on the persistence layer and multi-project data structure. The pro/billing enforcement will be handled in a separate "Pro Features" spec.

### Canvas Size Organization

Within each project, screens are organized by canvas size. Each canvas size (e.g., 'iphone-6.5', 'ipad-12.9') maintains its own independent array of screens. This design choice addresses several user needs:

1. **Store Requirements** - Different app stores require different screenshot dimensions
2. **Aspect Ratio Optimization** - Screenshots optimized for iPhone don't work well for iPad
3. **Workflow Efficiency** - Users can work on multiple canvas sizes without losing progress
4. **Context Switching** - Switching canvas sizes shows only relevant screens for that size

When users change the canvas size setting, the application switches to the screen set for that size, preserving the previous size's screens for later access.

## Architecture

### High-Level Architecture

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
│  FramesContext │       │ PersistenceDB   │
│  - State mgmt  │       │ - idb wrapper   │
│  - Triggers    │       │ - CRUD ops      │
│    saves       │       │ - Migrations    │
└────────────────┘       └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │   IndexedDB     │
                         │  - workspace    │
                         │  - uiState      │
                         │  - mediaFiles   │
                         └─────────────────┘
```

### Component Responsibilities

**FramesContext.tsx**
- Manages current project state (screensByCanvasSize, settings, selections)
- Maintains current canvas size and provides screens for that size
- Triggers persistence on state changes
- Loads project from IndexedDB on mount
- Provides hooks for components to access state
- Handles canvas size switching and screen set transitions
- Handles project switching

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
- Handles project management UI (create, switch, delete, rename)
- Manages error states and user notifications
- Observes canvas size changes and triggers screen set switching

## Components and Interfaces

### Data Models

#### Project

```typescript
interface Project {
  id: string;                          // Unique project identifier (UUID)
  name: string;                        // User-defined project name
  screensByCanvasSize: Record<string, Screen[]>; // Screens organized by canvas size key
  currentCanvasSize: string;           // Currently active canvas size
  selectedScreenIndices: number[];     // Currently selected screens (for current canvas size)
  primarySelectedIndex: number;        // Primary selection (for current canvas size)
  selectedFrameIndex: number | null;   // Selected frame within screen
  zoom: number;                        // Canvas zoom level (10-400)
  createdAt: Date;                     // Project creation time
  updatedAt: Date;                     // Last modification time
  lastAccessedAt: Date;                // Last time project was opened
}
```

**Project Organization:**
- Each project is completely independent
- Projects have user-defined names (e.g., "My Fitness App", "My Game App")
- Free users limited to 1 project, Pro users unlimited
- Within each project, screens are organized by canvas size

**Canvas Size Organization:**
- Screens are organized by canvas size (e.g., 'iphone-6.5', 'ipad-12.9')
- Each canvas size maintains its own independent array of screens
- When users switch canvas sizes, they see only screens for that size
- Selection state (selectedScreenIndices, primarySelectedIndex) applies to current canvas size only
- This allows users to maintain separate screenshot sets for different store requirements

#### AppState

```typescript
interface AppState {
  id: string;                          // Always 'current' for single app state
  currentProjectId: string | null;     // ID of currently open project
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

**projects** (Primary Key: id)
- Stores: Project
- Indexes: updatedAt, lastAccessedAt, name
- Multiple records, one per project
- Free users: max 1 project
- Pro users: unlimited projects

**appState** (Primary Key: id)
- Stores: AppState
- Indexes: none needed
- Single record with id='current'
- Tracks currently open project

**mediaFiles** (Primary Key: ++id)
- Stores: MediaFile (existing)
- Indexes: name, createdAt
- Multiple records for uploaded media
- Shared across all projects

#### Database Version History

**Version 1** (Existing)
- mediaFiles object store

**Version 2** (New)
- Add projects object store
- Add appState object store
- Migration: Create default project from any existing data

### New Components

#### PersistenceDB.ts

**Purpose:** Provides database operations using idb library

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppFramesDBSchema extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'updatedAt': Date; 'lastAccessedAt': Date; 'name': string };
  };
  appState: {
    key: string;
    value: AppState;
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
        
        // Version 2: projects and appState
        if (oldVersion < 2) {
          const projectsStore = db.createObjectStore('projects', {
            keyPath: 'id',
          });
          projectsStore.createIndex('updatedAt', 'updatedAt');
          projectsStore.createIndex('lastAccessedAt', 'lastAccessedAt');
          projectsStore.createIndex('name', 'name');
          
          db.createObjectStore('appState', {
            keyPath: 'id',
          });
        }
      },
    });
  }
  
  // Project operations
  async createProject(name: string): Promise<Project> {
    if (!this.db) await this.init();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      screensByCanvasSize: {},
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    await this.db!.put('projects', project);
    return project;
  }
  
  async saveProject(project: Project): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('projects', {
      ...project,
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    });
  }
  
  async loadProject(id: string): Promise<Project | null> {
    if (!this.db) await this.init();
    return await this.db!.get('projects', id) || null;
  }
  
  async getAllProjects(): Promise<Project[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('projects');
  }
  
  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('projects', id);
  }
  
  async renameProject(id: string, newName: string): Promise<void> {
    if (!this.db) await this.init();
    const project = await this.loadProject(id);
    if (project) {
      project.name = newName;
      await this.saveProject(project);
    }
  }
  
  // App State operations
  async saveAppState(state: AppState): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('appState', {
      ...state,
      id: 'current',
      updatedAt: new Date(),
    });
  }
  
  async loadAppState(): Promise<AppState | null> {
    if (!this.db) await this.init();
    return await this.db!.get('appState', 'current') || null;
  }
}

export const persistenceDB = new PersistenceDB();
```

**Key Methods:**
- `init()` - Opens database with version 2, runs migrations
- `createProject(name)` - Creates new project with default state
- `saveProject(project)` - Saves complete project state
- `loadProject(id)` - Loads project by ID or returns null
- `getAllProjects()` - Returns array of all projects
- `deleteProject(id)` - Deletes project permanently
- `renameProject(id, newName)` - Updates project name
- `saveAppState(state)` - Saves app-level state (current project, UI prefs)
- `loadAppState()` - Loads app state or returns null

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
    const appState = await persistenceDB.loadAppState();
    
    // Load current project if one exists
    if (appState?.currentProjectId) {
      const project = await persistenceDB.loadProject(appState.currentProjectId);
      if (project) {
        loadProjectIntoState(project);
      } else {
        // Project was deleted, create new default project
        await createNewProject('My Project');
      }
    } else {
      // No current project, check if any projects exist
      const projects = await persistenceDB.getAllProjects();
      if (projects.length > 0) {
        // Load most recently accessed project
        const recent = projects.sort((a, b) => 
          b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime()
        )[0];
        loadProjectIntoState(recent);
        await persistenceDB.saveAppState({
          ...appState,
          currentProjectId: recent.id,
        });
      } else {
        // No projects exist, create default project
        await createNewProject('My Project');
      }
    }
    
    // Load UI preferences
    if (appState) {
      setSidebarTab(appState.sidebarTab);
      setSidebarPanelOpen(appState.sidebarPanelOpen);
      setNavWidth(appState.navWidth);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    // Continue with default state
  }
}

// Load project data into React state
function loadProjectIntoState(project: Project): void {
  setCurrentProjectId(project.id);
  setCurrentProjectName(project.name);
  setScreensByCanvasSize(project.screensByCanvasSize);
  setCurrentCanvasSize(project.currentCanvasSize);
  setSelectedScreenIndices(project.selectedScreenIndices);
  setPrimarySelectedIndex(project.primarySelectedIndex);
  setSelectedFrameIndex(project.selectedFrameIndex);
  setZoom(project.zoom);
}

// Save project state (debounced)
function saveProjectState(): void {
  if (!currentProjectId) return;
  
  debouncedSave(async () => {
    await persistenceDB.saveProject({
      id: currentProjectId,
      name: currentProjectName,
      screensByCanvasSize,
      currentCanvasSize,
      selectedScreenIndices,
      primarySelectedIndex,
      selectedFrameIndex,
      zoom,
      createdAt: projectCreatedAt,
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    });
  });
}

// Switch canvas size
function switchCanvasSize(newCanvasSize: string): void {
  // Save current selection state before switching
  saveWorkspaceState();
  
  // Switch to new canvas size
  setCurrentCanvasSize(newCanvasSize);
  
  // Initialize screens array for new canvas size if it doesn't exist
  if (!screensByCanvasSize[newCanvasSize]) {
    setScreensByCanvasSize(prev => ({
      ...prev,
      [newCanvasSize]: []
    }));
  }
  
  // Reset selection for new canvas size
  const screensForSize = screensByCanvasSize[newCanvasSize] || [];
  if (screensForSize.length > 0) {
    setSelectedScreenIndices([0]);
    setPrimarySelectedIndex(0);
  } else {
    setSelectedScreenIndices([]);
    setPrimarySelectedIndex(0);
  }
  setSelectedFrameIndex(null);
}

// Get screens for current canvas size
function getCurrentScreens(): Screen[] {
  return screensByCanvasSize[currentCanvasSize] || [];
}

// Create new project
async function createNewProject(name: string): Promise<void> {
  const project = await persistenceDB.createProject(name);
  loadProjectIntoState(project);
  
  // Update app state to track current project
  await persistenceDB.saveAppState({
    id: 'current',
    currentProjectId: project.id,
    sidebarTab,
    sidebarPanelOpen,
    navWidth,
    updatedAt: new Date(),
  });
}

// Switch to different project
async function switchProject(projectId: string): Promise<void> {
  // Save current project before switching
  if (currentProjectId) {
    await saveProjectState();
  }
  
  // Load new project
  const project = await persistenceDB.loadProject(projectId);
  if (project) {
    loadProjectIntoState(project);
    
    // Update app state
    await persistenceDB.saveAppState({
      id: 'current',
      currentProjectId: projectId,
      sidebarTab,
      sidebarPanelOpen,
      navWidth,
      updatedAt: new Date(),
    });
  }
}

// Delete project
async function deleteProject(projectId: string): Promise<void> {
  await persistenceDB.deleteProject(projectId);
  
  // If deleting current project, switch to another or create new
  if (projectId === currentProjectId) {
    const projects = await persistenceDB.getAllProjects();
    if (projects.length > 0) {
      await switchProject(projects[0].id);
    } else {
      await createNewProject('My Project');
    }
  }
}

// Rename current project
async function renameProject(newName: string): Promise<void> {
  if (!currentProjectId) return;
  
  setCurrentProjectName(newName);
  await persistenceDB.renameProject(currentProjectId, newName);
}
```

**State Change Triggers:**
- useEffect watching screensByCanvasSize → saveProjectState()
- useEffect watching currentCanvasSize → saveProjectState()
- useEffect watching selectedScreenIndices → saveProjectState()
- useEffect watching zoom → saveProjectState()
- useEffect watching sidebarTab → saveAppState()
- Canvas size change in settings → switchCanvasSize()
- User creates new project → createNewProject()
- User switches project → switchProject()
- User deletes project → deleteProject()
- User renames project → renameProject()

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
   - Loads appState from IndexedDB
   - Gets currentProjectId from appState
   ↓
4. Load current project
   - If currentProjectId exists, load that project
   - If no currentProjectId, load most recent project
   - If no projects exist, create default project
   ↓
5. State is restored
   - Project loaded into React state
   - screensByCanvasSize populated with all canvas size groups
   - currentCanvasSize set to last used canvas size
   - Screens for current canvas size displayed
   - Selections restored for current canvas size
   - UI preferences applied
   ↓
6. App renders with restored project
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
6. PersistenceDB.saveProject()
   - Writes current project to IndexedDB
   - Updates timestamp and lastAccessedAt
   ↓
7. Save completes (async, non-blocking)
```

### Project Switch Flow

```
1. User selects different project from dropdown
   ↓
2. FramesContext.switchProject(newProjectId) called
   - Saves current project state
   ↓
3. Load new project from IndexedDB
   - PersistenceDB.loadProject(newProjectId)
   ↓
4. Load project data into React state
   - screensByCanvasSize
   - currentCanvasSize
   - selections, zoom, etc.
   ↓
5. Update appState with new currentProjectId
   ↓
6. UI updates to show new project's screens
```

### Canvas Size Switch Flow

```
1. User changes canvas size in settings
   ↓
2. FramesContext.switchCanvasSize() called
   - Saves current workspace state
   - Updates currentCanvasSize
   ↓
3. Check if screens exist for new canvas size
   ↓
4a. If screens exist:
   - Load screens for new canvas size
   - Restore selection to first screen
   ↓
4b. If no screens exist:
   - Initialize empty array for canvas size
   - Clear selection state
   ↓
5. Canvas displays screens for new size
   ↓
6. ScreensPanel shows screens for new size
```

### Project Delete Flow

```
1. User clicks "Delete Project"
   ↓
2. Confirmation dialog shown
   ↓
3. User confirms
   ↓
4. FramesContext.deleteProject(projectId)
   - Calls PersistenceDB.deleteProject(projectId)
   ↓
5. If deleting current project:
   - Load another project if available
   - Or create new default project
   ↓
6. Media library preserved (shared across projects)
   ↓
7. UI updates with new current project
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
- Create project → add screens → reload page → verify project and screens restored
- Create multiple projects → reload page → verify all projects exist
- Switch projects → reload page → verify last opened project is current
- Create screens for canvas size A → reload page → verify screens restored for canvas size A
- Switch to canvas size B → add screens → reload page → verify screens for both sizes restored
- Change canvas size → verify correct screen set displayed
- Change settings → reload page → verify settings restored
- Select screens → reload page → verify selection restored
- Change sidebar tab → reload page → verify tab restored

**Project Management:**
- Create new project → verify project appears in project list
- Switch projects → verify correct project screens displayed
- Delete project → verify project removed from list
- Delete current project → verify switches to another project or creates new one
- Rename project → verify name updated in project list
- Delete project → verify media library preserved

**Canvas Size Switching:**
- Add screens to canvas size A → switch to canvas size B → verify empty state
- Add screens to canvas size B → switch back to A → verify original screens restored
- Switch canvas sizes rapidly → verify no data loss or corruption

**Project Isolation:**
- Create project A with screens → create project B with different screens → switch between → verify screens isolated
- Add media to project A → switch to project B → verify media library shared

**Error Scenarios:**
- Simulate quota exceeded → verify user notification
- Simulate database unavailable → verify fallback to memory
- Simulate corrupted data → verify graceful degradation

### Property-Based Testing

Property-based tests will be defined after completing the prework analysis in the next section.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Screen persistence by canvas size
*For any* screen added to a specific canvas size in a project, after saving and reloading, the screen should be present in the restored project under the same canvas size with the same configuration
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

### Property 10: Project deletion completeness
*For any* project, after deleting the project, all screens across all canvas sizes in that project should be deleted
**Validates: Requirements 9.2, 9.3**

### Property 11: Media library preservation across projects
*For any* project deletion operation, the media library should remain unchanged with all uploaded images preserved and accessible to other projects
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

### Property 16: Canvas size isolation
*For any* two different canvas sizes, screens added to one canvas size should not appear when viewing the other canvas size
**Validates: Requirements 1.1, 2.5**

### Property 17: Canvas size switching preserves state
*For any* canvas size with existing screens, switching away and then back to that canvas size should restore the same screens and selection state
**Validates: Requirements 1.4, 4.1**

### Property 18: Project isolation
*For any* two different projects, screens added to one project should not appear when viewing the other project
**Validates: Requirements 1.1**

### Property 19: Project switching preserves state
*For any* project with existing screens, switching away to another project and then back should restore the same screens, canvas size, and selection state
**Validates: Requirements 1.4, 4.1**

### Property 20: Current project persistence
*For any* project that is currently open, after reloading the application, the same project should be opened automatically
**Validates: Requirements 1.4**

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
  // Create projects store
  const projectsStore = db.createObjectStore('projects', {
    keyPath: 'id',
  });
  projectsStore.createIndex('updatedAt', 'updatedAt');
  projectsStore.createIndex('lastAccessedAt', 'lastAccessedAt');
  projectsStore.createIndex('name', 'name');
  
  // Create appState store
  db.createObjectStore('appState', {
    keyPath: 'id',
  });
  
  // Create default project
  const defaultProject: Project = {
    id: crypto.randomUUID(),
    name: 'My Project',
    screensByCanvasSize: {},
    currentCanvasSize: 'iphone-6.5',
    selectedScreenIndices: [],
    primarySelectedIndex: 0,
    selectedFrameIndex: null,
    zoom: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAccessedAt: new Date(),
  };
  
  await projectsStore.put(defaultProject);
  
  // Initialize appState
  const appStateStore = db.objectStore('appState');
  await appStateStore.put({
    id: 'current',
    currentProjectId: defaultProject.id,
    sidebarTab: 'layout',
    sidebarPanelOpen: true,
    navWidth: 360,
    updatedAt: new Date(),
  });
}
```

**Future Migrations:**
- Version 3: Add workspace templates
- Version 4: Add undo/redo history
- Version 5: Add project metadata

### Canvas Size Switching Implementation

**Canvas Size Key Format:**
- Use kebab-case format: 'iphone-6.5', 'ipad-12.9', 'android-phone'
- Keys match the canvasSize setting value
- Consistent naming across the application

**Initialization:**
- On first load, initialize with default canvas size ('iphone-6.5')
- Create empty screen array for default canvas size
- Lazy-create arrays for other canvas sizes as needed

**Switching Logic:**
```typescript
function handleCanvasSizeChange(newSize: string): void {
  // Triggered when settings.canvasSize changes
  const oldSize = currentCanvasSize;
  
  // Save current state before switching
  saveWorkspaceState();
  
  // Switch to new canvas size
  switchCanvasSize(newSize);
  
  // Update settings to reflect new canvas size
  setSettings(prev => ({
    ...prev,
    canvasSize: newSize
  }));
}
```

**Screen Operations:**
- All screen operations (add, remove, update) operate on current canvas size only
- `getCurrentScreens()` helper returns screens for current canvas size
- Selection state applies to current canvas size only

### Performance Optimizations

**Lazy Initialization:**
Database is initialized on first access, not on app load.

**Selective Saves:**
Only save changed portions of state:
- Workspace changes → save workspace only
- UI changes → save uiState only
- Don't save if state hasn't changed

**Canvas Size Lazy Loading:**
- Only create screen arrays when canvas size is first accessed
- Don't pre-populate all possible canvas sizes
- Reduces memory footprint for typical usage

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

