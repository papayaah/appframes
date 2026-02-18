
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { FramesContextType } from './context/types';
import { CanvasSettings, Screen } from './types'; // Import from local types

// Re-export helpers from utils
export {
  getCanvasDimensions,
  isFixedOrientationCanvas,
  getCanvasSizeLabel,
  getCompositionFrameCount,
  getDefaultScreenSettings
} from './context/utils';

// Hooks
import { useProjectState } from './context/hooks/useProjectState';
import { useScreenState } from './context/hooks/useScreenState';
import { useCanvasState } from './context/hooks/useCanvasState';
import { useFrameOperations } from './context/hooks/useFrameOperations';
import { useTextOperations } from './context/hooks/useTextOperations';
import { useSidebarState } from './context/hooks/useSidebarState';
import { useProjectExport } from './context/hooks/useProjectExport';

// Global hooks
import { usePersistence } from '@/hooks/usePersistence';
import { useProjectSync } from '@/hooks/useProjectSync';
import { Project, persistenceDB } from '@/lib/PersistenceDB';
import { getCompositionFrameCount, getDefaultDIYOptions, getDefaultScreenSettings } from './context/utils';

const FramesContext = createContext<FramesContextType | undefined>(undefined);
export const FramesContextInternal = FramesContext;

export function useFrames() {
  const context = useContext(FramesContext);
  if (!context) {
    throw new Error('useFrames must be used within a FramesProvider');
  }
  return context;
}

export function FramesProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [mediaCache, setMediaCache] = useState<Record<number, string>>({});

  const projectState = useProjectState();
  const { doc, currentProjectId, commitDoc, resetDocWithHistory, projectCreatedAt, projectPristine, hasCompletedFirstContentSave, loadProject, initializeDefaultProject, setCurrentProjectId } = projectState;

  const resetSelection = useCallback(() => {
    if (screenStateRef.current) {
      screenStateRef.current.setSelectedScreenIndices([0]);
      screenStateRef.current.setSelectedFrameIndex(0);
      screenStateRef.current.setFrameSelectionVisible(false);
    }
  }, []);

  const canvasState = useCanvasState(doc, commitDoc, resetSelection);
  const { currentCanvasSize, setCurrentCanvasSize, zoom, setZoom } = canvasState;

  const screenState = useScreenState(doc, commitDoc, projectState.mutateDoc, currentCanvasSize);
  const screenStateRef = useRef(screenState);
  useEffect(() => { screenStateRef.current = screenState; });

  const frameOps = useFrameOperations(commitDoc, projectState.mutateDoc, currentCanvasSize, screenState.primarySelectedIndex);
  const textOps = useTextOperations(doc, commitDoc, projectState.mutateDoc, currentCanvasSize, screenState.primarySelectedIndex);
  const sidebarState = useSidebarState();
  const exportOps = useProjectExport();

  const setCachedMedia = useCallback((mediaId: number, url: string) => {
    setMediaCache(prev => ({ ...prev, [mediaId]: url }));
  }, []);

  const { syncStatus, isSignedIn, syncAll } = useProjectSync({
    onProjectsPulled: useCallback((pulledIds: string[]) => {
      window.dispatchEvent(new CustomEvent('appframes:projects-pulled', { detail: pulledIds }));
    }, []),
  });

  const { debouncedSave } = usePersistence({
    debounceMs: 500,
    maxRetries: 1,
    retryDelayMs: 1000,
    onStatusChange: setSaveStatus,
    onError: (error) => {
      console.error('Persistence error:', error);
      if (error.message === 'QUOTA_EXCEEDED') {
        notifications.show({
          title: 'Storage Quota Exceeded',
          message: 'Your browser storage is full.',
          color: 'red',
        });
      }
    },
  });

  const updateSelectedScreenSettings = useCallback((updates: Partial<Omit<CanvasSettings, 'selectedScreenIndex'>>) => {
    if (updates.canvasSize && updates.canvasSize !== currentCanvasSize) {
      const { canvasSize, ...rest } = updates;
      canvasState.switchCanvasSize(canvasSize!, rest);
      return;
    }

    commitDoc('Edit settings', (draft) => {
      const list = draft.screensByCanvasSize[currentCanvasSize] || [];
      const screen = list[screenState.primarySelectedIndex];
      if (!screen) return;

      const prevComposition = screen.settings.composition;
      screen.settings = { ...screen.settings, ...updates };

      if (updates.composition && updates.composition !== prevComposition) {
        const newFrameCount = getCompositionFrameCount(updates.composition);
        const imgs = [...(screen.images || [])].map((img) => ({
          ...img,
          frameX: 0,
          frameY: 0,
        }));
        while (imgs.length < newFrameCount) imgs.push({ diyOptions: getDefaultDIYOptions('phone'), frameX: 0, frameY: 0 });
        screen.images = imgs.slice(0, newFrameCount);
      }
    });
  }, [currentCanvasSize, screenState.primarySelectedIndex, commitDoc, canvasState]);

  useEffect(() => {
    if (!currentProjectId || isInitializing) return;

    const projectData: Project = {
      id: currentProjectId,
      name: doc.name,
      screensByCanvasSize: doc.screensByCanvasSize,
      currentCanvasSize,
      selectedScreenIndices: screenState.selectedScreenIndices,
      selectedFrameIndex: screenState.selectedFrameIndex,
      zoom,
      createdAt: projectCreatedAt.current,
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
      pristine: projectPristine.current,
      sharedBackgrounds: doc.sharedBackgrounds,
      primarySelectedIndex: screenState.primarySelectedIndex,
    };

    debouncedSave(async () => {
      await persistenceDB.saveProject(projectData);
    });
  }, [
    doc,
    currentProjectId,
    currentCanvasSize,
    screenState.selectedScreenIndices,
    screenState.selectedFrameIndex,
    zoom,
    debouncedSave,
    isInitializing,
    screenState.primarySelectedIndex
  ]);

  const loadProjectIntoState = useCallback((project: Project) => {
    resetDocWithHistory({
      name: project.name,
      screensByCanvasSize: project.screensByCanvasSize,
      sharedBackgrounds: project.sharedBackgrounds
    });
    setCurrentProjectId(project.id);
    projectCreatedAt.current = project.createdAt;
    projectPristine.current = project.pristine;
    hasCompletedFirstContentSave.current = false;

    setCurrentCanvasSize(project.currentCanvasSize);
    setZoom(project.zoom);
    screenState.setSelectedScreenIndices(project.selectedScreenIndices || [0]);
    screenState.setSelectedFrameIndex(project.selectedFrameIndex ?? 0);
    screenState.setFrameSelectionVisible(false);
  }, [resetDocWithHistory, setCurrentCanvasSize, setZoom, setCurrentProjectId]);

  useEffect(() => {
    const init = async () => {
      try {
        const appState = await persistenceDB.loadAppState();
        if (appState?.sidebarTab) sidebarState.setSidebarTab(appState.sidebarTab);
        if (appState?.sidebarPanelOpen !== undefined) sidebarState.setSidebarPanelOpen(appState.sidebarPanelOpen);
        if (appState?.navWidth) sidebarState.setNavWidth(appState.navWidth);
        if (appState?.downloadFormat) sidebarState.setDownloadFormat(appState.downloadFormat);
        if (appState?.downloadJpegQuality) sidebarState.setDownloadJpegQuality(appState.downloadJpegQuality);

        let project: Project | null = null;
        if (appState?.currentProjectId) {
          project = await loadProject(appState.currentProjectId);
        }

        if (!project) {
          const all = await persistenceDB.getAllProjects();
          if (all.length > 0) {
            const recent = all.sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())[0];
            project = await loadProject(recent.id);
          } else {
            project = await initializeDefaultProject();
          }
        }

        if (project) {
          loadProjectIntoState(project);
        }
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const primaryScreen = screenState.screens[screenState.primarySelectedIndex];
  const derivedSettings: CanvasSettings = primaryScreen
    ? { ...primaryScreen.settings, selectedScreenIndex: screenState.primarySelectedIndex, canvasSize: currentCanvasSize }
    : { ...getDefaultScreenSettings(), selectedScreenIndex: 0, canvasSize: currentCanvasSize };

  return (
    <FramesContext.Provider value={{
      ...projectState,
      currentProjectName: doc.name,
      screensByCanvasSize: doc.screensByCanvasSize,
      getCurrentScreens: () => doc.screensByCanvasSize[currentCanvasSize] || [],
      setScreens: (action) => {
        commitDoc('Edit screens', (draft) => {
          const list = draft.screensByCanvasSize[currentCanvasSize] || [];
          // Handle functional update or value
          const next = typeof action === 'function' ? action(list) : action;
          draft.screensByCanvasSize[currentCanvasSize] = next;
        });
      },

      createNewProject: async (name) => {
        await projectState.createNewProject(name);
        setZoom(100);
        screenState.setSelectedScreenIndices([0]);
        setCurrentCanvasSize('iphone-6.9');
      },
      switchProject: async (id) => {
        const p = await loadProject(id);
        if (p) loadProjectIntoState(p);
      },
      ...canvasState,
      ...screenState,
      ...frameOps,
      ...textOps,
      ...sidebarState,
      updateSelectedScreenSettings,
      setSettings: (newSettings) => {
        const currentFullSettings = derivedSettings;
        const settingsToApply = typeof newSettings === 'function' ? newSettings(currentFullSettings) : newSettings;
        updateSelectedScreenSettings(settingsToApply);
      },
      settings: derivedSettings,
      primarySelectedIndex: screenState.primarySelectedIndex,
      mediaCache,
      setCachedMedia,
      syncStatus,
      isSignedIn,
      syncAll,
      isInitializing,
      saveStatus,
      exportProject: async () => {
        const p: Project = {
          id: currentProjectId!,
          name: doc.name,
          screensByCanvasSize: doc.screensByCanvasSize,
          currentCanvasSize,
          selectedScreenIndices: screenState.selectedScreenIndices,
          selectedFrameIndex: screenState.selectedFrameIndex,
          zoom,
          createdAt: projectCreatedAt.current,
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
          pristine: projectPristine.current,
          sharedBackgrounds: doc.sharedBackgrounds,
          primarySelectedIndex: screenState.primarySelectedIndex
        };
        await exportOps.exportProject(p);
      },
      importProject: async (file) => {
        const p = await exportOps.importProject(file);
        if (p) {
          await persistenceDB.saveProject(p);
          loadProjectIntoState(p);
        }
      },
      sharedBackgrounds: doc.sharedBackgrounds || {},
      currentSharedBackground: doc.sharedBackgrounds?.[currentCanvasSize],
    }}>
      {children}
    </FramesContext.Provider>
  );
}
