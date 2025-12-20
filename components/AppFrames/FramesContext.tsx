'use client';

import React, { createContext, useContext, useState, useRef, ReactNode, useCallback, useEffect } from 'react';
import { Screen, ScreenImage, CanvasSettings, DEFAULT_TEXT_STYLE, TextElement, TextStyle } from './types';
import { persistenceDB, Project } from '@/lib/PersistenceDB';
import { usePersistence } from '@/hooks/usePersistence';

// Canvas dimensions helper (App Store requirements)
export const getCanvasDimensions = (canvasSize: string, _orientation: string) => {
  const dimensions: Record<string, { width: number; height: number }> = {
    // Apple App Store - iPhone (Portrait only)
    'iphone-6.9': { width: 1320, height: 2868 },
    'iphone-6.9-1290x2796': { width: 1290, height: 2796 },
    'iphone-6.9-1260x2736': { width: 1260, height: 2736 },
    'iphone-6.5': { width: 1284, height: 2778 },
    'iphone-6.3': { width: 1206, height: 2622 },
    'iphone-6.3-1179x2556': { width: 1179, height: 2556 },
    // Apple App Store - iPhone 6.1" display (additional accepted sizes)
    'iphone-6.1-1170x2532': { width: 1170, height: 2532 },
    'iphone-6.1-1125x2436': { width: 1125, height: 2436 },
    'iphone-6.1-1080x2340': { width: 1080, height: 2340 },
    'iphone-5.5': { width: 1242, height: 2208 },
    'iphone-4.7': { width: 750, height: 1334 },
    'iphone-4.0': { width: 640, height: 1136 },
    'iphone-4.0-640x1096': { width: 640, height: 1096 },
    'iphone-3.5': { width: 640, height: 960 },
    'iphone-3.5-640x920': { width: 640, height: 920 },
    // Apple App Store - iPad (Portrait only)
    'ipad-13': { width: 2064, height: 2752 },
    'ipad-11': { width: 1668, height: 2388 },
    'ipad-12.9-gen2': { width: 2048, height: 2732 },
    'ipad-10.5': { width: 1668, height: 2224 },
    'ipad-9.7': { width: 1536, height: 2048 },
    // Apple Watch
    'watch-ultra-3': { width: 422, height: 514 },
    'watch-ultra-3-alt': { width: 410, height: 502 },
    'watch-s11': { width: 416, height: 496 },
    'watch-s9': { width: 396, height: 484 },
    'watch-s6': { width: 368, height: 448 },
    'watch-s3': { width: 312, height: 390 },
    // Google Play Store (Portrait only for phones and tablets)
    'google-phone': { width: 1080, height: 1920 },
    'google-tablet-7': { width: 1536, height: 2048 },
    'google-tablet-10': { width: 2048, height: 2732 },
    'google-chromebook': { width: 1920, height: 1080 },
    'google-xr': { width: 1920, height: 1080 },
  };

  const dim = dimensions[canvasSize] || { width: 1284, height: 2778 };

  // Don't apply orientation transform since dimensions already include orientation
  return dim;
};

// Helper function to convert canvas size ID to readable label
export const getCanvasSizeLabel = (canvasSize: string): string => {
  const labels: Record<string, string> = {
    // Apple App Store - iPhone
    'iphone-6.9': 'iPhone 6.9" (1320×2868)',
    'iphone-6.9-1290x2796': 'iPhone 6.9" (1290×2796)',
    'iphone-6.9-1260x2736': 'iPhone 6.9" (1260×2736)',
    'iphone-6.5': 'iPhone 6.5" (1284×2778)',
    'iphone-6.3': 'iPhone 6.3" (1206×2622)',
    'iphone-6.3-1179x2556': 'iPhone 6.3" (1179×2556)',
    'iphone-6.1-1170x2532': 'iPhone 6.1" (1170×2532)',
    'iphone-6.1-1125x2436': 'iPhone 6.1" (1125×2436)',
    'iphone-6.1-1080x2340': 'iPhone 6.1" (1080×2340)',
    'iphone-5.5': 'iPhone 5.5" (1242×2208)',
    'iphone-4.7': 'iPhone 4.7" (750×1334)',
    'iphone-4.0': 'iPhone 4.0" (640×1136)',
    'iphone-4.0-640x1096': 'iPhone 4.0" (640×1096)',
    'iphone-3.5': 'iPhone 3.5" (640×960)',
    'iphone-3.5-640x920': 'iPhone 3.5" (640×920)',
    // Apple App Store - iPad
    'ipad-13': 'iPad 13"',
    'ipad-11': 'iPad 11"',
    'ipad-12.9-gen2': 'iPad 12.9"',
    'ipad-10.5': 'iPad 10.5"',
    'ipad-9.7': 'iPad 9.7"',
    // Apple Watch
    'watch-ultra-3': 'Watch Ultra 3',
    'watch-ultra-3-alt': 'Watch Ultra 3',
    'watch-s11': 'Watch S11',
    'watch-s9': 'Watch S9',
    'watch-s6': 'Watch S6',
    'watch-s3': 'Watch S3',
    // Google Play Store
    'google-phone': 'Phone',
    'google-tablet-7': '7" Tablet',
    'google-tablet-10': '10" Tablet',
    'google-chromebook': 'Chromebook',
    'google-xr': 'Android XR',
  };

  return labels[canvasSize] || canvasSize;
};

// Helper function to determine how many device frames a composition uses
export const getCompositionFrameCount = (composition: string): number => {
  switch (composition) {
    case 'single': return 1;
    case 'dual': return 2;
    case 'stack': return 2;
    case 'triple': return 3;
    case 'fan': return 3;
    default: return 1;
  }
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const clamp01 = (v: number) => Math.max(0, Math.min(100, v));

const normalizeRotation = (deg: number) => {
  const n = ((deg % 360) + 360) % 360;
  return n;
};

const getNextTextName = (existing: TextElement[]) => {
  const used = new Set(existing.map(t => t.name));
  let i = existing.length + 1;
  while (used.has(`Text ${i}`)) i += 1;
  return `Text ${i}`;
};

const getMaxZIndex = (existing: TextElement[]) =>
  existing.reduce((max, t) => Math.max(max, t.zIndex ?? 0), 0);

const createDefaultTextElement = (existing: TextElement[], overrides?: Partial<TextElement>): TextElement => {
  const z = getMaxZIndex(existing) + 1;
  return {
    id: createId('text'),
    content: 'Double-click to edit',
    x: 50,
    y: 50,
    rotation: 0,
    style: { ...DEFAULT_TEXT_STYLE },
    visible: true,
    name: getNextTextName(existing),
    zIndex: z,
    ...overrides,
  };
};

// Helper function to get default settings for a new screen
export const getDefaultScreenSettings = (): Omit<CanvasSettings, 'selectedScreenIndex'> => {
  return {
    canvasSize: 'iphone-6.9',
    composition: 'single',
    compositionScale: 85,
    selectedTextId: undefined,
    screenScale: 100,
    screenPanX: 50,
    screenPanY: 50,
    orientation: 'portrait',
    backgroundColor: '#E5E7EB',
    canvasBackgroundMediaId: undefined,
  };
};

interface FramesContextType {
  screens: Screen[];
  setScreens: React.Dispatch<React.SetStateAction<Screen[]>>;
  zoom: number;
  setZoom: (zoom: number) => void;
  selectedScreenIndices: number[];
  setSelectedScreenIndices: React.Dispatch<React.SetStateAction<number[]>>;
  selectedFrameIndex: number;
  setSelectedFrameIndex: (index: number) => void;
  primarySelectedIndex: number;
  settings: CanvasSettings;
  handleScreenSelect: (index: number, multi: boolean) => void;
  addScreen: (imageOrMediaId?: string | number) => void;
  updateSelectedScreenSettings: (updates: Partial<Omit<CanvasSettings, 'selectedScreenIndex'>>) => void;
  setSettings: (newSettings: CanvasSettings | ((prev: CanvasSettings) => CanvasSettings)) => void;
  removeScreen: (id: string) => void;
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
  // Sidebar state
  sidebarTab: string;
  setSidebarTab: (tab: string) => void;
  sidebarPanelOpen: boolean;
  setSidebarPanelOpen: (open: boolean) => void;
  navWidth: number;
  setNavWidth: (width: number) => void;
  // Canvas size switching
  switchCanvasSize: (newSize: string) => void;
  getCurrentScreens: () => Screen[];
  // Project management
  createNewProject: (name: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (newName: string) => Promise<void>;
  getAllProjects: () => Promise<Project[]>;
  // Text elements
  addTextElement: (screenId: string) => void;
  updateTextElement: (screenId: string, textId: string, updates: Partial<TextElement> & { style?: Partial<TextStyle> }) => void;
  deleteTextElement: (screenId: string, textId: string) => void;
  reorderTextElements: (screenId: string, fromIndex: number, toIndex: number) => void;
  selectTextElement: (textId: string | null) => void;
  duplicateTextElement: (screenId: string, textId: string) => void;
}

const FramesContext = createContext<FramesContextType | undefined>(undefined);

// Internal export to allow hooks (e.g. `useMediaImage`) to function in contexts where the
// FramesProvider isn't mounted (like off-screen export rendering). Prefer `useFrames()`
// for app code.
export const FramesContextInternal = FramesContext;

export function FramesProvider({ children }: { children: ReactNode }) {
  // Use a counter for screen IDs to avoid hydration issues
  const screenIdCounter = useRef(0);
  
  // Flag to prevent infinite loops between syncing effects
  const isSyncing = useRef(false);
  
  // Flag to track if initial state has been loaded
  const hasLoadedInitialState = useRef(false);

  // Project state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('My Project');
  const [screensByCanvasSize, setScreensByCanvasSize] = useState<Record<string, Screen[]>>({});
  const [currentCanvasSize, setCurrentCanvasSize] = useState<string>('iphone-6.5');
  const projectCreatedAt = useRef<Date>(new Date());

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<string>('layout');
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState<boolean>(true);
  const [navWidth, setNavWidth] = useState<number>(300);

  // Initialize with one empty screen with default settings
  const defaultTextElements: TextElement[] = [createDefaultTextElement([])];
  const [screens, setScreens] = useState<Screen[]>([
    {
      id: `screen-0`,
      name: 'Screen 1',
      images: [{ deviceFrame: 'iphone-14-pro' }], // Single composition by default
      settings: getDefaultScreenSettings(),
      textElements: defaultTextElements,
    },
  ]);
  const [zoom, setZoom] = useState<number>(100);
  // Support multi-selection
  const [selectedScreenIndices, setSelectedScreenIndices] = useState<number[]>([0]);
  // Track selected frame index within the composition
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  
  // Media Cache to prevent flashing
  const [mediaCache, setMediaCache] = useState<Record<number, string>>({});
  
  const setCachedMedia = useCallback((mediaId: number, url: string) => {
    setMediaCache(prev => ({ ...prev, [mediaId]: url }));
  }, []);

  // Track save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Initialize persistence hook with error handling
  const { debouncedSave } = usePersistence({
    debounceMs: 500,
    maxRetries: 1,
    retryDelayMs: 1000,
    onStatusChange: (status) => {
      setSaveStatus(status);
    },
    onError: (error) => {
      console.error('Persistence error:', error);
      
      // Handle quota exceeded errors
      if (error.message === 'QUOTA_EXCEEDED') {
        // Show notification with suggestion to clear workspace
        if (typeof window !== 'undefined') {
          import('@mantine/notifications').then(({ notifications }) => {
            notifications.show({
              title: 'Storage Quota Exceeded',
              message: 'Your browser storage is full. Consider deleting old projects or clearing your media library to free up space.',
              color: 'red',
              autoClose: false,
            });
          });
        }
      } else {
        // Show generic error notification
        if (typeof window !== 'undefined') {
          import('@mantine/notifications').then(({ notifications }) => {
            notifications.show({
              title: 'Save Failed',
              message: 'Failed to save your work. Your changes may not be persisted.',
              color: 'red',
              autoClose: 5000,
            });
          });
        }
      }
    },
  });

  // Primary selected screen is the last one in the selection list (most recently selected)
  const primarySelectedIndex = selectedScreenIndices.length > 0
    ? selectedScreenIndices[selectedScreenIndices.length - 1]
    : 0;

  // Get current screen's settings (computed from primary selected screen)
  const currentScreen = screens[primarySelectedIndex];
  const settings: CanvasSettings = currentScreen
    ? { ...currentScreen.settings, selectedScreenIndex: primarySelectedIndex, canvasSize: currentCanvasSize }
    : { ...getDefaultScreenSettings(), selectedScreenIndex: 0, canvasSize: currentCanvasSize };

  const handleScreenSelect = (index: number, multi: boolean) => {
    if (multi) {
      setSelectedScreenIndices(prev => {
        if (prev.includes(index)) {
          // Deselect if already selected, unless it's the only one
          const newIndices = prev.filter(i => i !== index);
          return newIndices.length > 0 ? newIndices : [index];
        } else {
          return [...prev, index];
        }
      });
    } else {
      setSelectedScreenIndices([index]);
    }
    // Reset selected frame index when switching screens
    setSelectedFrameIndex(0);
  };

  const addScreen = (imageOrMediaId?: string | number) => {
    const defaultSettings = getDefaultScreenSettings();
    const frameCount = getCompositionFrameCount(defaultSettings.composition);

    // Initialize images array based on composition type with default device frame
    const images: ScreenImage[] = Array(frameCount).fill(null).map(() => ({
      deviceFrame: 'iphone-14-pro'
    }));

    // If an image was provided, add it to the first slot
    if (imageOrMediaId) {
      if (typeof imageOrMediaId === 'number') {
        images[0] = { mediaId: imageOrMediaId, deviceFrame: 'iphone-14-pro' };
      } else {
        images[0] = { image: imageOrMediaId, deviceFrame: 'iphone-14-pro' };
      }
    }

    screenIdCounter.current += 1;
    const textElements: TextElement[] = [createDefaultTextElement([])];
    const newScreen: Screen = {
      id: `screen-${screenIdCounter.current}`,
      images,
      name: `Screen ${screens.length + 1}`,
      settings: defaultSettings, // Each screen gets its own default settings
      textElements,
    };
    setScreens((prevScreens) => [...prevScreens, newScreen]);
    // Select the newly added screen (exclusive selection)
    setSelectedScreenIndices([screens.length]);
    setSelectedFrameIndex(0);
  };

  // Update settings for the currently selected screen(s)
  // Currently we only update the primary selected screen to avoid complexity,
  // but we could potentially update all selected screens here.
  const updateSelectedScreenSettings = (updates: Partial<Omit<CanvasSettings, 'selectedScreenIndex'>>) => {
    // Check if canvas size is being changed
    if (updates.canvasSize && updates.canvasSize !== currentCanvasSize) {
      // Trigger canvas size switch
      switchCanvasSize(updates.canvasSize);
      return; // Don't update screen settings - the canvas size switch handles everything
    }

    setScreens((prevScreens) => {
      const updated = [...prevScreens];
      // Only update the primary selected screen for now
      if (updated[primarySelectedIndex]) {
        const screen = updated[primarySelectedIndex];
        const newSettings = {
          ...screen.settings,
          ...updates,
        };

        // If composition changed, resize images array to match new composition
        // and reset frame positions to default
        let newImages = [...(screen.images || [])];
        if (updates.composition && updates.composition !== screen.settings.composition) {
          const newFrameCount = getCompositionFrameCount(updates.composition);

          // Reset frame positions and resize array
          newImages = newImages.map(img => ({
            ...img,
            frameX: 0, // Reset frame position
            frameY: 0,
          }));

          if (newFrameCount > newImages.length) {
            // Add empty slots with default device frame
            while (newImages.length < newFrameCount) {
              newImages.push({ deviceFrame: 'iphone-14-pro' });
            }
          } else if (newFrameCount < newImages.length) {
            // Remove extra slots (keep first N)
            newImages = newImages.slice(0, newFrameCount);
          }
        }

        updated[primarySelectedIndex] = {
          ...screen,
          settings: newSettings,
          images: newImages,
        };
      }
      return updated;
    });
  };

  // Set settings (for backward compatibility, updates selected screen)
  const setSettings = (newSettings: CanvasSettings | ((prev: CanvasSettings) => CanvasSettings)) => {
    const settingsToApply = typeof newSettings === 'function'
      ? newSettings(settings)
      : newSettings;

    // Update selected screen index if it changed (via sidebar navigation or something?)
    // This part is tricky with multi-selection. If the sidebar tries to change the index,
    // we assume it means "select this screen exclusively".
    if (settingsToApply.selectedScreenIndex !== primarySelectedIndex) {
      setSelectedScreenIndices([settingsToApply.selectedScreenIndex]);
      setSelectedFrameIndex(0);
    }

    // Update the selected screen's settings (excluding selectedScreenIndex)
    const { selectedScreenIndex: _, ...screenSettings } = settingsToApply;
    updateSelectedScreenSettings(screenSettings);
  };

  const removeScreen = (id: string) => {
    // Find index of screen to remove
    const indexToRemove = screens.findIndex(s => s.id === id);
    if (indexToRemove === -1) return;

    const newScreens = screens.filter((s) => s.id !== id);
    setScreens(newScreens);

    // Adjust selected indices
    setSelectedScreenIndices(prev => {
      // Remove the removed index
      let newIndices = prev.filter(i => i !== indexToRemove);

      // Shift indices greater than the removed index
      newIndices = newIndices.map(i => i > indexToRemove ? i - 1 : i);

      // If no screens left, select 0 (but screens array is empty, so handle that)
      if (newScreens.length === 0) return [0];

      // If selection is empty (because we removed the only selected one), select the last one or 0
      if (newIndices.length === 0) {
        return [Math.max(0, Math.min(indexToRemove, newScreens.length - 1))];
      }

      return newIndices;
    });
  };

  const replaceScreen = (index: number, imageOrMediaId: string | number, imageSlotIndex: number = 0) => {
    setScreens(prevScreens => {
      const updatedScreens = [...prevScreens];
      if (updatedScreens[index]) {
        const screen = updatedScreens[index];
        const newImages = [...(screen.images || [])];

        // Ensure the images array has enough slots
        const frameCount = getCompositionFrameCount(screen.settings.composition);
        while (newImages.length < frameCount) {
          newImages.push({ deviceFrame: 'iphone-14-pro' });
        }

        if (imageSlotIndex < newImages.length) {
          const existingFrame = newImages[imageSlotIndex];
          newImages[imageSlotIndex] = typeof imageOrMediaId === 'number'
            ? { ...existingFrame, mediaId: imageOrMediaId, image: undefined }
            : { ...existingFrame, image: imageOrMediaId, mediaId: undefined };
        }

        updatedScreens[index] = {
          ...screen,
          images: newImages,
        };
      }
      return updatedScreens;
    });
  };

  const addTextElement = useCallback((screenId: string) => {
    setScreens(prev => prev.map(screen => {
      if (screen.id !== screenId) return screen;
      const existing = screen.textElements ?? [];
      const newEl = createDefaultTextElement(existing);
      return {
        ...screen,
        settings: {
          ...screen.settings,
          selectedTextId: newEl.id,
        },
        textElements: [...existing, newEl],
      };
    }));
  }, []);

  const updateTextElement = useCallback((screenId: string, textId: string, updates: Partial<TextElement> & { style?: Partial<TextStyle> }) => {
    setScreens(prev => prev.map(screen => {
      if (screen.id !== screenId) return screen;
      const textElements = (screen.textElements ?? []).map(t => {
        if (t.id !== textId) return t;
        return {
          ...t,
          ...updates,
          x: typeof updates.x === 'number' ? clamp01(updates.x) : t.x,
          y: typeof updates.y === 'number' ? clamp01(updates.y) : t.y,
          rotation: typeof updates.rotation === 'number' ? normalizeRotation(updates.rotation) : t.rotation,
          style: updates.style ? { ...t.style, ...updates.style } : t.style,
        };
      });
      return { ...screen, textElements };
    }));
  }, []);

  const deleteTextElement = useCallback((screenId: string, textId: string) => {
    setScreens(prev => prev.map(screen => {
      if (screen.id !== screenId) return screen;
      const remaining = (screen.textElements ?? []).filter(t => t.id !== textId);
      const nextSelected =
        screen.settings.selectedTextId === textId
          ? (remaining[remaining.length - 1]?.id ?? undefined)
          : screen.settings.selectedTextId;
      return {
        ...screen,
        settings: {
          ...screen.settings,
          selectedTextId: nextSelected,
        },
        textElements: remaining,
      };
    }));
  }, []);

  const reorderTextElements = useCallback((screenId: string, fromIndex: number, toIndex: number) => {
    setScreens(prev => prev.map(screen => {
      if (screen.id !== screenId) return screen;
      const list = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      if (fromIndex < 0 || fromIndex >= list.length) return screen;
      const clampedTo = Math.max(0, Math.min(list.length - 1, toIndex));
      const [moved] = list.splice(fromIndex, 1);
      list.splice(clampedTo, 0, moved);
      const withZ = list.map((t, i) => ({ ...t, zIndex: i + 1 }));
      return { ...screen, textElements: withZ };
    }));
  }, []);

  const selectTextElement = useCallback((textId: string | null) => {
    updateSelectedScreenSettings({ selectedTextId: textId ?? undefined });
  }, [updateSelectedScreenSettings]);

  const duplicateTextElement = useCallback((screenId: string, textId: string) => {
    setScreens(prev => prev.map(screen => {
      if (screen.id !== screenId) return screen;
      const existing = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      const idx = existing.findIndex(t => t.id === textId);
      if (idx === -1) return screen;
      const source = existing[idx];
      const copy: TextElement = {
        ...source,
        id: createId('text'),
        name: `${source.name} Copy`,
        x: clamp01(source.x + 2),
        y: clamp01(source.y + 2),
      };
      existing.splice(idx + 1, 0, copy);
      const withZ = existing.map((t, i) => ({ ...t, zIndex: i + 1 }));
      return {
        ...screen,
        settings: { ...screen.settings, selectedTextId: copy.id },
        textElements: withZ,
      };
    }));
  }, []);

  // Get screens for current canvas size
  const getCurrentScreens = useCallback((): Screen[] => {
    return screensByCanvasSize[currentCanvasSize] || [];
  }, [screensByCanvasSize, currentCanvasSize]);

  // Switch canvas size
  const switchCanvasSize = useCallback((newSize: string) => {
    // Save current workspace state before switching (will be triggered by useEffect)
    
    // Update to new canvas size
    setCurrentCanvasSize(newSize);
    
    // Initialize empty screen array for new canvas size if it doesn't exist
    setScreensByCanvasSize(prev => {
      if (!prev[newSize]) {
        return {
          ...prev,
          [newSize]: []
        };
      }
      return prev;
    });
    
    // Reset selection state for new canvas size
    const screensForNewSize = screensByCanvasSize[newSize] || [];
    if (screensForNewSize.length > 0) {
      setSelectedScreenIndices([0]);
    } else {
      setSelectedScreenIndices([]);
    }
    
    // Reset selected frame index
    setSelectedFrameIndex(0);
  }, [screensByCanvasSize]);

  // Load project data into React state
  const loadProjectIntoState = useCallback((project: Project) => {
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setScreensByCanvasSize(project.screensByCanvasSize);
    setCurrentCanvasSize(project.currentCanvasSize);
    setSelectedScreenIndices(project.selectedScreenIndices);
    setSelectedFrameIndex(project.selectedFrameIndex ?? 0);
    setZoom(project.zoom);
    projectCreatedAt.current = project.createdAt;

    // Update screens to reflect current canvas size
    const screensForCurrentSize = project.screensByCanvasSize[project.currentCanvasSize] || [];
    setScreens(screensForCurrentSize);
    
    // Update screenIdCounter to avoid duplicate IDs
    let maxId = 0;
    Object.values(project.screensByCanvasSize).forEach(screens => {
      screens.forEach(screen => {
        const match = screen.id.match(/screen-(\d+)/);
        if (match) {
          const id = parseInt(match[1], 10);
          if (id > maxId) maxId = id;
        }
      });
    });
    screenIdCounter.current = maxId;
  }, []);

  // Load persisted state on mount
  const loadPersistedState = useCallback(async () => {
    try {
      const appState = await persistenceDB.loadAppState();
      
      // Load current project if one exists
      if (appState?.currentProjectId) {
        const project = await persistenceDB.loadProject(appState.currentProjectId);
        if (project) {
          loadProjectIntoState(project);
        } else {
          // Project was deleted, create new default project
          const newProject = await persistenceDB.createProject('My Project');
          loadProjectIntoState(newProject);
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
            currentProjectId: recent.id,
            sidebarTab,
            sidebarPanelOpen,
            navWidth,
          });
        } else {
          // No projects exist, create default project with current screens
          const newProject = await persistenceDB.createProject('My Project');
          // Save the initial default screen to the new project
          newProject.screensByCanvasSize[currentCanvasSize] = screens;
          await persistenceDB.saveProject(newProject);
          // Don't load the empty project - keep the initial default screen
          // Just set the project ID so saves will work
          setCurrentProjectId(newProject.id);
          setCurrentProjectName(newProject.name);
          projectCreatedAt.current = newProject.createdAt;
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
    } finally {
      // Mark that initial state has been loaded
      hasLoadedInitialState.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProjectIntoState]);

  // Save project state (debounced)
  // Don't use useCallback - we need fresh values on each call
  const saveProjectState = () => {
    if (!currentProjectId || !hasLoadedInitialState.current) {
      return;
    }
    
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
        createdAt: projectCreatedAt.current,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      });
    });
  };

  // Save app state (UI preferences and currentProjectId)
  // Don't use useCallback - we need fresh values on each call
  const saveAppState = () => {
    debouncedSave(async () => {
      await persistenceDB.saveAppState({
        currentProjectId,
        sidebarTab,
        sidebarPanelOpen,
        navWidth,
      });
    });
  };

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  // Save project state when screensByCanvasSize changes
  useEffect(() => {
    saveProjectState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screensByCanvasSize]);

  // Save project state when currentCanvasSize changes
  useEffect(() => {
    saveProjectState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCanvasSize]);

  // Save project state when selectedScreenIndices changes
  useEffect(() => {
    saveProjectState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScreenIndices]);

  // Save project state when zoom changes
  useEffect(() => {
    saveProjectState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // Save app state when sidebarTab changes
  useEffect(() => {
    saveAppState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarTab]);

  // Sync screens with screensByCanvasSize for current canvas size
  // This ensures screens always reflects the current canvas size
  useEffect(() => {
    // Skip syncing until initial state is loaded
    if (!hasLoadedInitialState.current) return;
    if (isSyncing.current) return;
    
    const screensForCurrentSize = screensByCanvasSize[currentCanvasSize] || [];
    // Only update if different to avoid infinite loops
    if (JSON.stringify(screens) !== JSON.stringify(screensForCurrentSize)) {
      isSyncing.current = true;
      setScreens(screensForCurrentSize);
      // Reset flag after state update completes
      setTimeout(() => { isSyncing.current = false; }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screensByCanvasSize, currentCanvasSize]);

  // Update screensByCanvasSize when screens change
  // This ensures changes to screens are reflected in the project state
  useEffect(() => {
    // Skip syncing until initial state is loaded
    if (!hasLoadedInitialState.current || isSyncing.current) {
      return;
    }
    
    setScreensByCanvasSize(prev => {
      const currentScreens = prev[currentCanvasSize] || [];
      // Only update if screens actually changed
      if (JSON.stringify(currentScreens) !== JSON.stringify(screens)) {
        isSyncing.current = true;
        // Reset flag after state update completes
        setTimeout(() => { isSyncing.current = false; }, 0);
        return {
          ...prev,
          [currentCanvasSize]: screens,
        };
      }
      return prev;
    });
  }, [screens, currentCanvasSize]);

  // Project management methods

  /**
   * Create a new project with the given name
   * Saves current project before creating new one
   */
  const createNewProject = useCallback(async (name: string) => {
    try {
      // Save current project before creating new one
      if (currentProjectId) {
        await persistenceDB.saveProject({
          id: currentProjectId,
          name: currentProjectName,
          screensByCanvasSize,
          currentCanvasSize,
          selectedScreenIndices,
          primarySelectedIndex,
          selectedFrameIndex,
          zoom,
          createdAt: projectCreatedAt.current,
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
        });
      }

      // Create new project
      const newProject = await persistenceDB.createProject(name);
      
      // Load new project into state
      loadProjectIntoState(newProject);
      
      // Update app state to track current project
      await persistenceDB.saveAppState({
        currentProjectId: newProject.id,
        sidebarTab,
        sidebarPanelOpen,
        navWidth,
      });
    } catch (error) {
      console.error('Failed to create new project:', error);
      throw error;
    }
  }, [currentProjectId, currentProjectName, screensByCanvasSize, currentCanvasSize, 
      selectedScreenIndices, primarySelectedIndex, selectedFrameIndex, zoom, 
      sidebarTab, sidebarPanelOpen, navWidth, loadProjectIntoState]);

  /**
   * Switch to a different project
   * Saves current project before loading new one
   */
  const switchProject = useCallback(async (projectId: string) => {
    try {
      // Save current project before switching
      if (currentProjectId) {
        await persistenceDB.saveProject({
          id: currentProjectId,
          name: currentProjectName,
          screensByCanvasSize,
          currentCanvasSize,
          selectedScreenIndices,
          primarySelectedIndex,
          selectedFrameIndex,
          zoom,
          createdAt: projectCreatedAt.current,
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
        });
      }
      
      // Load new project
      const project = await persistenceDB.loadProject(projectId);
      if (project) {
        loadProjectIntoState(project);
        
        // Update app state
        await persistenceDB.saveAppState({
          currentProjectId: projectId,
          sidebarTab,
          sidebarPanelOpen,
          navWidth,
        });
      } else {
        console.error('Project not found:', projectId);
      }
    } catch (error) {
      console.error('Failed to switch project:', error);
      throw error;
    }
  }, [currentProjectId, currentProjectName, screensByCanvasSize, currentCanvasSize,
      selectedScreenIndices, primarySelectedIndex, selectedFrameIndex, zoom,
      sidebarTab, sidebarPanelOpen, navWidth, loadProjectIntoState]);

  /**
   * Delete a project by ID
   * If deleting current project, switches to another project or creates new one
   * Media library is preserved across all operations
   */
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      // Delete the project from database
      await persistenceDB.deleteProject(projectId);
      
      // If deleting current project, switch to another or create new
      if (projectId === currentProjectId) {
        const projects = await persistenceDB.getAllProjects();
        if (projects.length > 0) {
          // Switch to the most recently accessed project
          const recent = projects.sort((a, b) => 
            b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime()
          )[0];
          await switchProject(recent.id);
        } else {
          // No projects left, create a new default project
          await createNewProject('My Project');
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [currentProjectId, switchProject, createNewProject]);

  /**
   * Rename the current project
   */
  const renameProject = useCallback(async (newName: string) => {
    try {
      if (!currentProjectId) {
        console.error('No current project to rename');
        return;
      }
      
      // Update local state
      setCurrentProjectName(newName);
      
      // Update in database
      await persistenceDB.renameProject(currentProjectId, newName);
    } catch (error) {
      console.error('Failed to rename project:', error);
      throw error;
    }
  }, [currentProjectId]);

  /**
   * Get all projects from database
   */
  const getAllProjects = useCallback(async (): Promise<Project[]> => {
    try {
      return await persistenceDB.getAllProjects();
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }, []);

  return (
    <FramesContext.Provider
      value={{
        screens,
        setScreens,
        zoom,
        setZoom,
        selectedScreenIndices,
        setSelectedScreenIndices,
        selectedFrameIndex,
        setSelectedFrameIndex,
        primarySelectedIndex,
        settings,
        handleScreenSelect,
        addScreen,
        updateSelectedScreenSettings,
        setSettings,
        removeScreen,
        replaceScreen,
        mediaCache,
        setCachedMedia,
        currentProjectId,
        currentProjectName,
        screensByCanvasSize,
        currentCanvasSize,
        saveStatus,
        sidebarTab,
        setSidebarTab,
        sidebarPanelOpen,
        setSidebarPanelOpen,
        navWidth,
        setNavWidth,
        switchCanvasSize,
        getCurrentScreens,
        createNewProject,
        switchProject,
        deleteProject,
        renameProject,
        getAllProjects,
        addTextElement,
        updateTextElement,
        deleteTextElement,
        reorderTextElements,
        selectTextElement,
        duplicateTextElement,
      }}
    >
      {children}
    </FramesContext.Provider>
  );
}

export function useFrames() {
  const context = useContext(FramesContext);
  if (context === undefined) {
    throw new Error('useFrames must be used within a FramesProvider');
  }
  return context;
}
