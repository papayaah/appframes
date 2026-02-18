
import React from 'react';
import { Screen, CanvasSettings, TextElement, TextStyle, BackgroundEffects, FrameEffects, SharedBackground } from '../types';
import { DIYOptions } from '../diy-frames/types';
import { Project } from '@/lib/PersistenceDB';
import { PatchHistoryEntry } from '@/hooks/usePatchHistory';
import { UseProjectSyncResult } from '@/hooks/useProjectSync';

export interface FramesContextType {
    screens: Screen[];
    setScreens: React.Dispatch<React.SetStateAction<Screen[]>>;
    zoom: number;
    setZoom: (zoom: number) => void;
    selectedScreenIndices: number[];
    setSelectedScreenIndices: React.Dispatch<React.SetStateAction<number[]>>;
    selectedFrameIndex: number;
    setSelectedFrameIndex: (index: number) => void;
    frameSelectionVisible: boolean;
    setFrameSelectionVisible: (visible: boolean) => void;
    primarySelectedIndex: number;
    settings: CanvasSettings;
    handleScreenSelect: (index: number, toggle: boolean, shift?: boolean) => void;
    addScreen: (imageOrMediaId?: string | number) => void;
    addFrameSlot: () => void;
    updateSelectedScreenSettings: (updates: Partial<Omit<CanvasSettings, 'selectedScreenIndex'>>) => void;
    setSettings: (newSettings: CanvasSettings | ((prev: CanvasSettings) => CanvasSettings)) => void;
    removeScreen: (id: string) => void;
    duplicateScreen: (screenIndex: number) => void;
    replaceScreen: (index: number, imageOrMediaId: string | number, imageSlotIndex?: number) => void;
    // Media Cache
    mediaCache: Record<number, string>;
    setCachedMedia: (mediaId: number, url: string) => void;
    // Project state
    currentProjectId: string | null;
    currentProjectName: string;
    screensByCanvasSize: Record<string, Screen[]>;
    currentCanvasSize: string;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    historyEntries: PatchHistoryEntry[];
    historyPosition: number;
    goToHistory: (position: number) => void;
    // Sidebar state
    sidebarTab: string;
    setSidebarTab: (tab: string) => void;
    sidebarPanelOpen: boolean;
    setSidebarPanelOpen: (open: boolean) => void;
    navWidth: number;
    setNavWidth: (width: number) => void;
    downloadFormat: 'png' | 'jpg';
    setDownloadFormat: (format: 'png' | 'jpg') => void;
    downloadJpegQuality: number;
    setDownloadJpegQuality: (quality: number) => void;
    // Canvas size switching
    switchCanvasSize: (newSize: string) => void;
    copyScreensToCanvasSize: (targetCanvasSize: string) => void;
    getCurrentScreens: () => Screen[];
    reorderScreens: (fromIndex: number, toIndex: number) => void;
    removeAllScreens: () => void;
    // Project management
    createNewProject: (name: string) => Promise<void>;
    switchProject: (projectId: string) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    renameProject: (newName: string) => Promise<void>;
    getAllProjects: () => Promise<Project[]>;
    // Export/Import
    exportProject: () => Promise<void>;
    importProject: (file: File) => Promise<void>;
    // Sync status (for signed-in users)
    syncStatus: UseProjectSyncResult['syncStatus'];
    isSignedIn: boolean;
    syncAll: () => Promise<void>;
    // Initial loading state
    isInitializing: boolean;
    // Text elements
    addTextElement: (screenId: string) => void;
    updateTextElement: (screenId: string, textId: string, updates: Omit<Partial<TextElement>, 'style'> & { style?: Partial<TextStyle> }) => void;
    deleteTextElement: (screenId: string, textId: string) => void;
    reorderTextElements: (screenId: string, fromIndex: number, toIndex: number) => void;
    selectTextElement: (textId: string | null) => void;
    selectTextElementOnScreen: (screenIndex: number, textId: string | null) => void;
    duplicateTextElement: (screenId: string, textId: string) => void;
    pasteTextElement: (targetScreenId: string, source: TextElement) => void;
    // Frame/background convenience (for meaningful history labels)
    applyBackgroundEffectsToAll: (effects: BackgroundEffects) => void;
    setCanvasBackgroundMedia: (screenIndex: number, mediaId: number | undefined) => void;
    clearFrameSlot: (screenIndex: number, frameIndex: number) => void;
    setFrameDIYOptions: (screenIndex: number, frameIndex: number, options: DIYOptions, templateId?: string) => void;
    setFramePan: (screenIndex: number, frameIndex: number, panX: number, panY: number, persistent?: boolean) => void;
    setBackgroundPan: (screenIndex: number, panX: number, panY: number, persistent?: boolean) => void;
    setBackgroundRotation: (screenIndex: number, rotation: number, persistent?: boolean) => void;
    setBackgroundScale: (screenIndex: number, scale: number, persistent?: boolean) => void;

    setFramePosition: (screenIndex: number, frameIndex: number, frameX: number, frameY: number, persistent?: boolean) => void;
    setFrameScale: (screenIndex: number, frameIndex: number, frameScale: number, persistent?: boolean) => void;
    setFrameRotate: (screenIndex: number, frameIndex: number, rotateZ: number, persistent?: boolean) => void;
    setFrameTilt: (screenIndex: number, frameIndex: number, tiltX: number, tiltY: number) => void;
    setFrameColor: (screenIndex: number, frameIndex: number, frameColor: string | undefined) => void;
    setFrameEffects: (screenIndex: number, frameIndex: number, frameEffects: FrameEffects) => void;
    setImageRotation: (screenIndex: number, frameIndex: number, imageRotation: number) => void;
    // Shared backgrounds
    sharedBackgrounds: Record<string, SharedBackground>;
    currentSharedBackground: SharedBackground | undefined;
    setSharedBackground: (canvasSize: string, sharedBg: SharedBackground | undefined) => void;
    toggleScreenInSharedBackground: (screenId: string) => void;
}

export type UndoableDoc = {
    name: string;
    screensByCanvasSize: Record<string, Screen[]>;
    sharedBackgrounds?: Record<string, SharedBackground>;
};
