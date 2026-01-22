/**
 * useProjectSync - Hook for integrating project sync with auth state
 *
 * This hook:
 * - Starts/stops sync service based on auth state
 * - Provides sync status for UI
 * - Handles "claim local projects" on sign-in
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthSession } from '@reactkits.dev/better-auth-connect';
import {
  ProjectSyncService,
  getProjectSyncService,
  type SyncStatus,
} from '@/lib/ProjectSyncService';

export interface UseProjectSyncOptions {
  autoSync?: boolean;
  syncIntervalMs?: number;
}

export interface UseProjectSyncResult {
  syncStatus: SyncStatus;
  isSignedIn: boolean;
  syncProject: (projectId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  claimLocalProjects: () => Promise<void>;
}

export function useProjectSync(options: UseProjectSyncOptions = {}): UseProjectSyncResult {
  const { session, loading } = useAuthSession();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncServiceRef = useRef<ProjectSyncService | null>(null);
  const hasClaimedProjects = useRef(false);

  const isSignedIn = !!session?.user?.id;

  // Initialize sync service
  useEffect(() => {
    if (!syncServiceRef.current) {
      syncServiceRef.current = getProjectSyncService({
        autoSync: options.autoSync ?? true,
        syncIntervalMs: options.syncIntervalMs ?? 30000,
        onSyncStatusChange: setSyncStatus,
        onError: (error) => {
          console.error('Sync error:', error);
        },
      });
    }
  }, [options.autoSync, options.syncIntervalMs]);

  // Start/stop sync based on auth state
  useEffect(() => {
    if (loading) return;

    const syncService = syncServiceRef.current;
    if (!syncService) return;

    if (isSignedIn) {
      // User signed in - start sync
      syncService.startAutoSync();

      // Claim local projects on first sign-in
      if (!hasClaimedProjects.current) {
        hasClaimedProjects.current = true;
        syncService.claimLocalProjects().catch(console.error);
      }
    } else {
      // User signed out - stop sync
      syncService.stopAutoSync();
      hasClaimedProjects.current = false;
      setSyncStatus('idle');
    }

    return () => {
      // Don't stop on unmount if user is still signed in
      // (prevents stopping during HMR or navigation)
    };
  }, [isSignedIn, loading]);

  // Enqueue a project for sync
  const syncProject = useCallback(async (projectId: string) => {
    if (!isSignedIn || !syncServiceRef.current) return;
    await syncServiceRef.current.enqueueProject(projectId);
  }, [isSignedIn]);

  // Trigger full sync
  const syncAll = useCallback(async () => {
    if (!isSignedIn || !syncServiceRef.current) return;
    await syncServiceRef.current.syncAll();
  }, [isSignedIn]);

  // Claim local projects (manual trigger)
  const claimLocalProjects = useCallback(async () => {
    if (!isSignedIn || !syncServiceRef.current) return;
    await syncServiceRef.current.claimLocalProjects();
  }, [isSignedIn]);

  return {
    syncStatus,
    isSignedIn,
    syncProject,
    syncAll,
    claimLocalProjects,
  };
}
