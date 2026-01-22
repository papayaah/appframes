/**
 * ProjectSyncService - Background sync for projects (IndexedDB → Postgres)
 *
 * Handles:
 * - Push: Local changes → Server (with optimistic concurrency)
 * - Pull: Server changes → Local (on login, on demand)
 * - Claim: Local projects → User account on first sign-in
 * - Conflict resolution: Client-wins for v1 (auto-retry with server revision)
 * - Media resolution: Converts mediaId references to base64 for cross-device sync
 */

import { persistenceDB, type Project } from './PersistenceDB';
import { initDB, getFileFromOpfs } from '@reactkits.dev/react-media-library';
import type { Screen, ScreenImage } from '@/components/AppFrames/types';

export interface ServerProject {
  id: string;
  name: string;
  data: unknown;
  revision: number;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ServerProjectListItem {
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface ProjectSyncConfig {
  apiBaseUrl?: string;
  autoSync?: boolean;
  syncIntervalMs?: number;
  onSyncStatusChange?: (status: SyncStatus) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: Required<Omit<ProjectSyncConfig, 'onSyncStatusChange' | 'onError'>> = {
  apiBaseUrl: '/api',
  autoSync: true,
  syncIntervalMs: 30000, // 30 seconds
};

/**
 * Convert a File/Blob to base64 data URL
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resolve a mediaId to base64 image data
 */
async function resolveMediaIdToBase64(mediaId: number): Promise<string | undefined> {
  try {
    const db = await initDB();
    const asset = await db.get('assets', mediaId);
    if (!asset) return undefined;

    const file = await getFileFromOpfs(asset.handleName);
    if (!file) return undefined;

    return await fileToBase64(file);
  } catch (error) {
    console.error(`Failed to resolve mediaId ${mediaId}:`, error);
    return undefined;
  }
}

/**
 * Resolve all mediaId references in a ScreenImage to base64
 * Returns a new ScreenImage with image data instead of mediaId
 */
async function resolveScreenImage(img: ScreenImage): Promise<ScreenImage> {
  if (img.mediaId && !img.image) {
    const base64 = await resolveMediaIdToBase64(img.mediaId);
    if (base64) {
      // Return new image with base64 data, remove mediaId
      const { mediaId: _, ...rest } = img;
      return { ...rest, image: base64 };
    }
  }
  return img;
}

/**
 * Resolve all mediaId references in a Screen to base64
 * Returns a deep copy with all images embedded
 */
async function resolveScreenMedia(screen: Screen): Promise<Screen> {
  // Resolve images array
  const resolvedImages = await Promise.all(
    screen.images.map(img => resolveScreenImage(img))
  );

  // Resolve canvas background if present
  let resolvedSettings = { ...screen.settings };
  if (screen.settings.canvasBackgroundMediaId) {
    const bgBase64 = await resolveMediaIdToBase64(screen.settings.canvasBackgroundMediaId);
    if (bgBase64) {
      // Store background as embedded data, keep the mediaId for local reference
      resolvedSettings = {
        ...resolvedSettings,
        canvasBackgroundImage: bgBase64,
      } as typeof resolvedSettings;
    }
  }

  return {
    ...screen,
    images: resolvedImages,
    settings: resolvedSettings,
  };
}

/**
 * Resolve all mediaId references in project data for sync
 * Converts local OPFS references to embedded base64 for cross-device compatibility
 */
async function resolveProjectMedia(
  screensByCanvasSize: Record<string, Screen[]>
): Promise<Record<string, Screen[]>> {
  const resolved: Record<string, Screen[]> = {};

  for (const [canvasSize, screens] of Object.entries(screensByCanvasSize)) {
    resolved[canvasSize] = await Promise.all(
      screens.map(screen => resolveScreenMedia(screen))
    );
  }

  return resolved;
}

/**
 * ProjectSyncService manages background sync between IndexedDB and Postgres
 */
export class ProjectSyncService {
  private config: Required<Omit<ProjectSyncConfig, 'onSyncStatusChange' | 'onError'>> & Pick<ProjectSyncConfig, 'onSyncStatusChange' | 'onError'>;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private status: SyncStatus = 'idle';

  // Debounce timer for coalescing rapid enqueue calls
  private enqueueDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ENQUEUE_DEBOUNCE_MS = 5000; // 5 seconds - wait for user to stop editing

  constructor(config: ProjectSyncConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start auto-sync (called when user signs in)
   */
  startAutoSync(): void {
    if (this.syncIntervalId) return;

    if (this.config.autoSync) {
      // Initial sync
      this.syncAll();

      // Periodic sync
      this.syncIntervalId = setInterval(() => {
        this.processQueue();
      }, this.config.syncIntervalMs);

      // Sync on online event
      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline);
      }
    }
  }

  /**
   * Stop auto-sync (called when user signs out)
   */
  stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // Cancel any pending debounced sync
    if (this.enqueueDebounceTimer) {
      clearTimeout(this.enqueueDebounceTimer);
      this.enqueueDebounceTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
    }

    this.setStatus('idle');
  }

  private handleOnline = (): void => {
    this.syncAll();
  };

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.config.onSyncStatusChange?.(status);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Full sync: pull server projects, push local changes
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      this.setStatus('syncing');

      // 1. Pull server project list
      await this.pullServerProjects();

      // 2. Process sync queue (push local changes)
      await this.processQueue();

      this.setStatus('synced');
    } catch (error) {
      console.error('Sync failed:', error);
      this.setStatus('error');
      this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Enqueue a project for sync (called after local save)
   * Uses trailing debounce to coalesce rapid saves (e.g., during drag operations)
   */
  async enqueueProject(projectId: string): Promise<void> {
    await persistenceDB.enqueueSyncProject(projectId);

    // Cancel any existing debounce timer
    if (this.enqueueDebounceTimer) {
      clearTimeout(this.enqueueDebounceTimer);
      this.enqueueDebounceTimer = null;
    }

    // Only process queue after user stops editing (trailing debounce)
    // This prevents expensive media resolution during rapid edits
    if (this.config.autoSync && !this.isSyncing) {
      this.enqueueDebounceTimer = setTimeout(() => {
        this.enqueueDebounceTimer = null;
        this.processQueue();
      }, this.ENQUEUE_DEBOUNCE_MS);
    }
  }

  /**
   * Process the sync queue (push pending changes to server)
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing) return;

    const state = await persistenceDB.getSyncState();
    const queue = state?.syncQueue ?? [];

    if (queue.length === 0) return;

    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      for (const entry of queue) {
        await this.pushProject(entry.projectId);
      }
      this.setStatus('synced');
    } catch (error) {
      console.error('Queue processing failed:', error);
      this.setStatus('error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push a single project to the server
   */
  async pushProject(projectId: string): Promise<void> {
    const project = await persistenceDB.loadProject(projectId);
    if (!project) {
      // Project deleted locally, remove from queue
      await persistenceDB.dequeueSyncProject(projectId);
      return;
    }

    const baseRevision = await persistenceDB.getSyncedRevision(projectId);

    // Resolve all mediaId references to base64 for cross-device sync
    // This embeds images in the project data so they work on any device
    const resolvedScreens = await resolveProjectMedia(
      project.screensByCanvasSize as Record<string, Screen[]>
    );

    // Prepare project data for server (with embedded images)
    const projectData = {
      screensByCanvasSize: resolvedScreens,
      currentCanvasSize: project.currentCanvasSize,
      selectedScreenIndices: project.selectedScreenIndices,
      primarySelectedIndex: project.primarySelectedIndex,
      selectedFrameIndex: project.selectedFrameIndex,
      zoom: project.zoom,
    };

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          data: projectData,
          baseRevision,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await persistenceDB.updateSyncedRevision(projectId, result.revision);
        await persistenceDB.dequeueSyncProject(projectId);
        await persistenceDB.clearSyncError(projectId);
      } else if (response.status === 409) {
        // Conflict: server has newer version
        // v1 policy: client-wins - retry with server's revision
        const { server } = await response.json();
        await this.handleConflict(projectId, project, server);
      } else if (response.status === 401) {
        // Not authenticated - stop sync
        this.setStatus('offline');
        return;
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        await persistenceDB.setSyncError(projectId, error.error || 'Sync failed');
      }
    } catch (error) {
      console.error(`Failed to push project ${projectId}:`, error);
      await persistenceDB.setSyncError(projectId, error instanceof Error ? error.message : 'Network error');
    }
  }

  /**
   * Handle conflict (v1: client-wins - retry with server revision)
   */
  private async handleConflict(
    projectId: string,
    localProject: Project,
    serverProject: ServerProject
  ): Promise<void> {
    // v1 policy: Client-wins last-write-wins
    // Retry the push with the server's current revision

    // Resolve all mediaId references to base64 for cross-device sync
    const resolvedScreens = await resolveProjectMedia(
      localProject.screensByCanvasSize as Record<string, Screen[]>
    );

    const projectData = {
      screensByCanvasSize: resolvedScreens,
      currentCanvasSize: localProject.currentCanvasSize,
      selectedScreenIndices: localProject.selectedScreenIndices,
      primarySelectedIndex: localProject.primarySelectedIndex,
      selectedFrameIndex: localProject.selectedFrameIndex,
      zoom: localProject.zoom,
    };

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: localProject.name,
          data: projectData,
          baseRevision: serverProject.revision, // Use server's revision
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await persistenceDB.updateSyncedRevision(projectId, result.revision);
        await persistenceDB.dequeueSyncProject(projectId);
        await persistenceDB.clearSyncError(projectId);
      } else {
        const error = await response.json().catch(() => ({ error: 'Conflict resolution failed' }));
        await persistenceDB.setSyncError(projectId, error.error);
      }
    } catch (error) {
      console.error(`Failed to resolve conflict for ${projectId}:`, error);
      await persistenceDB.setSyncError(projectId, 'Conflict resolution failed');
    }
  }

  /**
   * Pull server projects and merge with local
   */
  async pullServerProjects(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/projects`);

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated
          return;
        }
        throw new Error('Failed to fetch projects');
      }

      const serverProjects: ServerProjectListItem[] = await response.json();
      const localProjects = await persistenceDB.getAllProjects();
      const state = await persistenceDB.getSyncState();
      const queue = state?.syncQueue ?? [];

      // Process each server project
      for (const serverItem of serverProjects) {
        const localProject = localProjects.find(p => p.id === serverItem.id);
        const lastSyncedRevision = state?.lastSyncedRevisionByProjectId?.[serverItem.id] ?? 0;
        const hasPendingSync = queue.some(q => q.projectId === serverItem.id);

        // Skip if local has pending unsynced changes
        if (hasPendingSync) {
          continue;
        }

        // Server has newer version - pull full project
        if (serverItem.revision > lastSyncedRevision) {
          await this.pullProject(serverItem.id);
        }

        // Handle server deletions
        if (serverItem.deletedAt && localProject) {
          // Server deleted, local exists, no pending changes - delete locally
          await persistenceDB.deleteProject(serverItem.id);
        }
      }

      // Projects that exist only locally (not on server) stay local
      // They'll be pushed on next sync if user is signed in
    } catch (error) {
      console.error('Failed to pull server projects:', error);
      throw error;
    }
  }

  /**
   * Pull a single project from server and update local
   */
  async pullProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/projects/${projectId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Project doesn't exist on server
          return;
        }
        throw new Error('Failed to fetch project');
      }

      const serverProject: ServerProject = await response.json();

      // Convert server data to local format
      const data = serverProject.data as {
        screensByCanvasSize?: Record<string, unknown[]>;
        currentCanvasSize?: string;
        selectedScreenIndices?: number[];
        primarySelectedIndex?: number;
        selectedFrameIndex?: number | null;
        zoom?: number;
      };

      const localProject: Project = {
        id: serverProject.id,
        name: serverProject.name,
        screensByCanvasSize: (data.screensByCanvasSize ?? {}) as Project['screensByCanvasSize'],
        currentCanvasSize: data.currentCanvasSize ?? 'iphone-6.5',
        selectedScreenIndices: data.selectedScreenIndices ?? [],
        primarySelectedIndex: data.primarySelectedIndex ?? 0,
        selectedFrameIndex: data.selectedFrameIndex ?? null,
        zoom: data.zoom ?? 100,
        createdAt: new Date(),
        updatedAt: new Date(serverProject.updatedAt),
        lastAccessedAt: new Date(),
      };

      await persistenceDB.saveProject(localProject);
      await persistenceDB.updateSyncedRevision(projectId, serverProject.revision);
    } catch (error) {
      console.error(`Failed to pull project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Claim local projects on first sign-in
   * Pushes all local projects that don't exist on server
   */
  async claimLocalProjects(): Promise<void> {
    try {
      this.setStatus('syncing');

      // Get server project list
      const response = await fetch(`${this.config.apiBaseUrl}/projects`);
      if (!response.ok) {
        if (response.status === 401) {
          this.setStatus('offline');
          return;
        }
        throw new Error('Failed to fetch projects');
      }

      const serverProjects: ServerProjectListItem[] = await response.json();
      const serverProjectIds = new Set(serverProjects.map(p => p.id));

      // Get all local projects
      const localProjects = await persistenceDB.getAllProjects();

      // Enqueue local projects that don't exist on server
      for (const localProject of localProjects) {
        if (!serverProjectIds.has(localProject.id)) {
          await persistenceDB.enqueueSyncProject(localProject.id);
        }
      }

      // Process the queue
      await this.processQueue();

      this.setStatus('synced');
    } catch (error) {
      console.error('Failed to claim local projects:', error);
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Delete a project (local + server)
   */
  async deleteProject(projectId: string): Promise<void> {
    // Delete locally first
    await persistenceDB.deleteProject(projectId);
    await persistenceDB.dequeueSyncProject(projectId);

    // Try to delete on server
    try {
      const baseRevision = await persistenceDB.getSyncedRevision(projectId);
      await fetch(`${this.config.apiBaseUrl}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseRevision }),
      });
    } catch (error) {
      // Server delete failed - not critical since we deleted locally
      console.error('Failed to delete project on server:', error);
    }
  }
}

// Singleton instance
let syncServiceInstance: ProjectSyncService | null = null;

/**
 * Get the singleton ProjectSyncService instance
 */
export function getProjectSyncService(config?: ProjectSyncConfig): ProjectSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new ProjectSyncService(config);
  }
  return syncServiceInstance;
}

/**
 * Reset the singleton (for testing or reconfiguration)
 */
export function resetProjectSyncService(): void {
  if (syncServiceInstance) {
    syncServiceInstance.stopAutoSync();
    syncServiceInstance = null;
  }
}
