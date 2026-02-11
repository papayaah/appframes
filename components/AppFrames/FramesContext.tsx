'use client';

import React, { createContext, useContext, useState, useRef, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Screen, ScreenImage, CanvasSettings, DEFAULT_TEXT_STYLE, TextElement, TextStyle, clampFrameTransform, SharedBackground } from './types';
import { reorderScreenIds, insertScreenIdInOrder, createDefaultSharedBackground } from './sharedBackgroundUtils';
import type { DIYOptions } from './diy-frames/types';
import { getDefaultDIYOptions } from './diy-frames/types';
import { persistenceDB, Project } from '@/lib/PersistenceDB';
import { usePersistence } from '@/hooks/usePersistence';
import { usePatchHistory, type PatchHistoryEntry } from '@/hooks/usePatchHistory';
import { useProjectSync, type UseProjectSyncResult } from '@/hooks/useProjectSync';
import { WelcomeModal } from '@/components/WelcomeModal/WelcomeModal';

// Canvas dimensions helper (App Store requirements)
export const getCanvasDimensions = (canvasSize: string, orientation: string) => {
  const dimensions: Record<
    string,
    { width: number; height: number } | { portrait: { width: number; height: number }; landscape: { width: number; height: number } }
  > = {
    // Apple App Store - iPhone (base portrait dimensions; landscape is computed by swapping)
    'iphone-6.9': { width: 1320, height: 2868 },
    'iphone-6.9-1290x2796': { width: 1290, height: 2796 },
    'iphone-6.9-1260x2736': { width: 1260, height: 2736 },
    'iphone-6.5': { width: 1284, height: 2778 },
    'iphone-6.5-1242x2688': { width: 1242, height: 2688 },
    'iphone-6.3': { width: 1206, height: 2622 },
    'iphone-6.3-1179x2556': { width: 1179, height: 2556 },
    // Apple App Store - iPhone 6.1" display (additional accepted sizes)
    'iphone-6.1-1170x2532': { width: 1170, height: 2532 },
    'iphone-6.1-1125x2436': { width: 1125, height: 2436 },
    'iphone-6.1-1080x2340': { width: 1080, height: 2340 },
    'iphone-5.5': { width: 1242, height: 2208 },
    'iphone-4.7': { width: 750, height: 1334 },
    'iphone-4.0': { width: 640, height: 1136 },
    // iPhone 4.0" "without status bar" is NOT a simple swap in landscape (Apple accepts 1136×600).
    'iphone-4.0-640x1096': {
      portrait: { width: 640, height: 1096 },
      landscape: { width: 1136, height: 600 },
    },
    'iphone-3.5': { width: 640, height: 960 },
    // iPhone 3.5" "without status bar" is NOT a simple swap in landscape (Apple accepts 960×600).
    'iphone-3.5-640x920': {
      portrait: { width: 640, height: 920 },
      landscape: { width: 960, height: 600 },
    },
    // Apple App Store - iPad (base portrait dimensions; landscape is computed by swapping)
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
    // Google Play Store (base portrait dimensions; landscape is computed by swapping)
    'google-phone': { width: 1080, height: 1920 },
    'google-tablet-7': { width: 1536, height: 2048 },
    'google-tablet-10': { width: 2048, height: 2732 },
    'google-chromebook': { width: 1920, height: 1080 },
    'google-xr': { width: 1920, height: 1080 },
    'google-feature-graphic': { portrait: { width: 1024, height: 500 }, landscape: { width: 1024, height: 500 } },
  };

  const entry = dimensions[canvasSize] || { width: 1284, height: 2778 };
  const dim =
    'portrait' in entry
      ? (orientation === 'landscape' ? entry.landscape : entry.portrait)
      : entry;

  // If the entry had explicit portrait/landscape dims, we're done.
  if ('portrait' in entry) return dim;

  // Otherwise, compute landscape by swapping base portrait dimensions.
  if (orientation === 'landscape') return { width: dim.height, height: dim.width };
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
    'iphone-6.5-1242x2688': 'iPhone 6.5" (1242×2688)',
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
    y: 20, // On top of canvas (was 50 = center)
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
    selectedTextId: undefined,
    screenScale: 0,
    screenPanX: 50,
    screenPanY: 50,
    orientation: 'portrait',
    // Default to transparent so users can export/download with alpha without extra steps.
    backgroundColor: 'transparent',
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
  frameSelectionVisible: boolean;
  setFrameSelectionVisible: (visible: boolean) => void;
  primarySelectedIndex: number;
  settings: CanvasSettings;
  handleScreenSelect: (index: number, multi: boolean) => void;
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
  getCurrentScreens: () => Screen[];
  reorderScreens: (fromIndex: number, toIndex: number) => void;
  // Project management
  createNewProject: (name: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (newName: string) => Promise<void>;
  getAllProjects: () => Promise<Project[]>;
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
  // Frame/background convenience (for meaningful history labels)
  setCanvasBackgroundMedia: (screenIndex: number, mediaId: number | undefined) => void;
  clearFrameSlot: (screenIndex: number, frameIndex: number) => void;
  setFrameDIYOptions: (screenIndex: number, frameIndex: number, options: DIYOptions, templateId?: string) => void;
  setFramePan: (screenIndex: number, frameIndex: number, panX: number, panY: number) => void;
  addFramePositionDelta: (screenIndex: number, frameIndex: number, dx: number, dy: number) => void;
  setFramePosition: (screenIndex: number, frameIndex: number, frameX: number, frameY: number) => void;
  setFrameScale: (screenIndex: number, frameIndex: number, frameScale: number) => void;
  setFrameRotate: (screenIndex: number, frameIndex: number, rotateZ: number) => void;
  setFrameTilt: (screenIndex: number, frameIndex: number, tiltX: number, tiltY: number) => void;
  setFrameColor: (screenIndex: number, frameIndex: number, frameColor: string | undefined) => void;
  setImageRotation: (screenIndex: number, frameIndex: number, imageRotation: number) => void;
  // Shared backgrounds
  sharedBackgrounds: Record<string, SharedBackground>;
  currentSharedBackground: SharedBackground | undefined;
  setSharedBackground: (canvasSize: string, sharedBg: SharedBackground | undefined) => void;
  toggleScreenInSharedBackground: (screenId: string) => void;
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
  const hasStartedInitialLoad = useRef(false);

  // Loading state for initial load (exposed to consumers for loading indicator)
  const [isInitializing, setIsInitializing] = useState(true);

  // Project state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  type UndoableDoc = {
    name: string;
    screensByCanvasSize: Record<string, Screen[]>;
    sharedBackgrounds?: Record<string, SharedBackground>;
  };

  const createInitialDoc = useCallback((): UndoableDoc => {
    const defaultTextElements: TextElement[] = [createDefaultTextElement([])];
    const initialScreen: Screen = {
      id: `screen-0`,
      name: 'Screen 1',
      images: [{ diyOptions: getDefaultDIYOptions('phone') }],
      settings: getDefaultScreenSettings(),
      textElements: defaultTextElements,
    };
    return {
      name: 'My Project',
      screensByCanvasSize: { 'iphone-6.5': [initialScreen] },
    };
  }, []);

  const {
    state: doc,
    commit: commitDoc,
    mutate: mutateDoc,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetDocWithHistory,
    past,
    future,
    goTo,
    position,
  } = usePatchHistory<UndoableDoc>(() => createInitialDoc(), { maxHistory: 100 });

  const historyEntries = useMemo(() => [...past, ...future], [past, future]);
  const historyPosition = position;
  const goToHistory = useCallback((p: number) => goTo(p), [goTo]);

  const [currentCanvasSize, setCurrentCanvasSize] = useState<string>('iphone-6.5');
  const currentCanvasSizeRef = useRef<string>('iphone-6.5');
  const projectCreatedAt = useRef<Date>(new Date());
  // Tracks if project is pristine (untouched) - used to skip syncing on sign-in
  const projectPristine = useRef<boolean>(true);
  // Tracks first content save after load to avoid marking pristine=false on initial render
  const hasCompletedFirstContentSave = useRef<boolean>(false);

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<string>('layout');
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState<boolean>(true);
  const [navWidth, setNavWidth] = useState<number>(300);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [downloadJpegQuality, setDownloadJpegQuality] = useState<number>(90);

  const screens = useMemo(() => doc.screensByCanvasSize[currentCanvasSize] || [], [doc.screensByCanvasSize, currentCanvasSize]);
  const sharedBackgrounds = useMemo(() => doc.sharedBackgrounds || {}, [doc.sharedBackgrounds]);
  const currentSharedBackground = useMemo(() => doc.sharedBackgrounds?.[currentCanvasSize], [doc.sharedBackgrounds, currentCanvasSize]);
  const [zoom, setZoom] = useState<number>(100);
  // Support multi-selection
  const [selectedScreenIndices, setSelectedScreenIndices] = useState<number[]>([0]);
  // Track selected frame index within the composition
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  // Hide frame selection handles until user explicitly selects a frame (or on load)
  const [frameSelectionVisible, setFrameSelectionVisible] = useState<boolean>(false);
  
  // Media Cache to prevent flashing
  const [mediaCache, setMediaCache] = useState<Record<number, string>>({});
  
  const setCachedMedia = useCallback((mediaId: number, url: string) => {
    setMediaCache(prev => ({ ...prev, [mediaId]: url }));
  }, []);

  // Track save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Initialize project sync hook (handles auth state, background sync)
  // Use a custom event to bridge sync → React since loadProjectIntoState is declared below
  const { syncStatus, isSignedIn, syncProject, syncAll } = useProjectSync({
    onProjectsPulled: useCallback((pulledIds: string[]) => {
      window.dispatchEvent(new CustomEvent('appframes:projects-pulled', { detail: pulledIds }));
    }, []),
  });

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

  useEffect(() => {
    currentCanvasSizeRef.current = currentCanvasSize;
  }, [currentCanvasSize]);

  // Backward-compatible screens setter: updates the current canvas size's screens list.
  const setScreens: React.Dispatch<React.SetStateAction<Screen[]>> = useCallback((action) => {
    commitDoc('Edit screens', (draft) => {
      const size = currentCanvasSizeRef.current;
      const prevScreens = draft.screensByCanvasSize[size] || [];
      const nextScreens = typeof action === 'function' ? (action as (prev: Screen[]) => Screen[])(prevScreens) : action;
      draft.screensByCanvasSize[size] = nextScreens;
    });
  }, [commitDoc]);

  const commitCurrentScreens = useCallback((label: string, updater: (screensDraft: Screen[]) => void) => {
    commitDoc(label, (draft) => {
      const size = currentCanvasSizeRef.current;
      if (!draft.screensByCanvasSize[size]) draft.screensByCanvasSize[size] = [];
      updater(draft.screensByCanvasSize[size]!);
    });
  }, [commitDoc]);

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
    // Inherit settings from the last screen if one exists, otherwise use defaults
    const lastScreen = screens.length > 0 ? screens[screens.length - 1] : null;
    const defaultSettings = lastScreen
      ? { ...lastScreen.settings, selectedTextId: undefined }
      : (() => {
          // Auto-detect orientation from canvas size dimensions for first screen
          const defaults = getDefaultScreenSettings();
          const size = currentCanvasSizeRef.current;
          const dims = getCanvasDimensions(size, 'portrait');
          if (dims.width > dims.height) defaults.orientation = 'landscape';
          return defaults;
        })();
    const frameCount = getCompositionFrameCount(defaultSettings.composition);

    // Determine which DIY options to use for the new screen's frames:
    // 1. If screens exist, reuse the frame from the last screen's first non-cleared slot
    // 2. Otherwise, infer device type from the current canvas size
    // Canvas sizes that should not have a device frame
    const isFramelessCanvas = (size: string) =>
      size === 'google-feature-graphic';

    const getFrameOptions = (): DIYOptions | null => {
      const size = currentCanvasSizeRef.current;
      if (isFramelessCanvas(size)) return null;

      if (screens.length > 0) {
        const lastScreen = screens[screens.length - 1];
        const lastFrame = lastScreen?.images?.find(
          (img) => img && !img.cleared && img.diyOptions
        );
        if (lastFrame?.diyOptions) return { ...lastFrame.diyOptions };
      }
      // Infer device type from canvas size
      if (size.startsWith('ipad-')) return getDefaultDIYOptions('tablet');
      if (size.startsWith('watch-')) return getDefaultDIYOptions('phone');
      if (size.startsWith('google-tablet')) return getDefaultDIYOptions('tablet');
      if (size.startsWith('google-chromebook')) return getDefaultDIYOptions('laptop');
      return getDefaultDIYOptions('phone');
    };

    const frameOpts = getFrameOptions();

    // Initialize images array based on composition type
    // For frameless canvas sizes, create cleared slots (no device frame)
    const images: ScreenImage[] = Array(frameCount).fill(null).map(() =>
      frameOpts ? { diyOptions: { ...frameOpts } } : { cleared: true }
    );

    // If an image was provided, add it to the first slot
    if (imageOrMediaId) {
      if (typeof imageOrMediaId === 'number') {
        images[0] = { mediaId: imageOrMediaId, ...(frameOpts ? { diyOptions: { ...frameOpts } } : { cleared: true }) };
      } else {
        images[0] = { image: imageOrMediaId, ...(frameOpts ? { diyOptions: { ...frameOpts } } : { cleared: true }) };
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
    commitCurrentScreens('Add screen', (list) => {
      list.push(newScreen);
    });
    // Select the newly added screen (exclusive selection)
    setSelectedScreenIndices([screens.length]);
    setSelectedFrameIndex(0);
    setFrameSelectionVisible(false); // New screen: nothing selected
  };

  const duplicateScreen = (screenIndex: number) => {
    const sourceScreen = screens[screenIndex];
    if (!sourceScreen) return;

    screenIdCounter.current += 1;
    const newScreen: Screen = {
      id: `screen-${screenIdCounter.current}`,
      images: sourceScreen.images
        ? sourceScreen.images.map((img) =>
            img
              ? {
                  ...img,
                  // Deep copy diyOptions to avoid shared state
                  diyOptions: img.diyOptions ? { ...img.diyOptions } : undefined,
                }
              : {}
          )
        : [],
      name: `${sourceScreen.name} (copy)`,
      settings: { ...sourceScreen.settings, selectedTextId: undefined },
      textElements: sourceScreen.textElements
        ? sourceScreen.textElements.map((el) => ({
            ...el,
            id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            style: { ...el.style },
          }))
        : [],
    };

    commitCurrentScreens('Duplicate screen', (list) => {
      // Insert the duplicate right after the source screen
      list.splice(screenIndex + 1, 0, newScreen);
    });
    // Select the newly duplicated screen
    setSelectedScreenIndices([screenIndex + 1]);
    setSelectedFrameIndex(0);
    setFrameSelectionVisible(false);
  };

  // Update settings for the currently selected screen(s)
  // Currently we only update the primary selected screen to avoid complexity,
  // but we could potentially update all selected screens here.
  const updateSelectedScreenSettings = (updates: Partial<Omit<CanvasSettings, 'selectedScreenIndex'>>) => {
    // Check if canvas size is being changed
    if (updates.canvasSize && updates.canvasSize !== currentCanvasSize) {
      // Pass any additional settings (e.g. orientation) to apply to the new canvas size's screens
      const { canvasSize, ...remainingUpdates } = updates;
      switchCanvasSize(canvasSize, Object.keys(remainingUpdates).length > 0 ? remainingUpdates : undefined);
      return;
    }

    // Treat pure text selection as UI state (no undo history entry) to avoid noisy history and flicker.
    const keys = Object.keys(updates);
    if (keys.length === 1 && keys[0] === 'selectedTextId') {
      mutateDoc((draft) => {
        const list = draft.screensByCanvasSize[currentCanvasSize] || [];
        const screen = list[primarySelectedIndex];
        if (!screen) return;
        screen.settings = { ...screen.settings, selectedTextId: (updates as any).selectedTextId };
      });
      return;
    }

    const label =
      updates.canvasBackgroundMediaId !== undefined ? 'Change canvas background'
      : updates.backgroundColor !== undefined ? 'Change background color'
      : updates.composition !== undefined ? 'Change composition'
      : updates.orientation !== undefined ? 'Change orientation'
      : 'Edit screen settings';

    commitCurrentScreens(label, (list) => {
      const screen = list[primarySelectedIndex];
      if (!screen) return;
      const prevComposition = screen.settings.composition;
      screen.settings = { ...screen.settings, ...updates };

      // If composition changed, resize images array to match new composition
      // and reset frame positions to default
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
  };

  const addFrameSlot = useCallback(() => {
    const screen = screens[primarySelectedIndex];
    const currentComposition = screen?.settings?.composition ?? 'single';
    const currentCount = getCompositionFrameCount(currentComposition);
    if (!screen) return;
    if (currentCount >= 3) return;

    const nextComposition =
      currentComposition === 'single' ? 'dual'
      : currentComposition === 'dual' || currentComposition === 'stack' ? 'triple'
      : 'triple';

    const nextCount = getCompositionFrameCount(nextComposition);

    commitCurrentScreens('Add frame', (list) => {
      const s = list[primarySelectedIndex];
      if (!s) return;
      s.settings = { ...s.settings, composition: nextComposition };
      const imgs = [...(s.images || [])];
      // Ensure existing cleared (frameless) slots get device options when adding frames
      for (let i = 0; i < imgs.length; i++) {
        if (imgs[i]?.cleared && !imgs[i]?.diyOptions) {
          imgs[i] = { ...imgs[i], cleared: false, diyOptions: getDefaultDIYOptions('phone') };
        }
      }
      while (imgs.length < nextCount) imgs.push({ diyOptions: getDefaultDIYOptions('phone'), frameX: 0, frameY: 0 });
      s.images = imgs.slice(0, nextCount);
    });

    // Select the newly-added frame slot.
    setSelectedFrameIndex(nextCount - 1);
  }, [commitCurrentScreens, primarySelectedIndex, screens, setSelectedFrameIndex]);

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

    commitDoc('Delete screen', (draft) => {
      const size = currentCanvasSizeRef.current;
      const list = draft.screensByCanvasSize[size];
      if (list) {
        const idx = list.findIndex((s) => s.id === id);
        if (idx !== -1) list.splice(idx, 1);
      }
      // Also remove from shared background if present
      const sharedBg = draft.sharedBackgrounds?.[size];
      if (sharedBg) {
        sharedBg.screenIds = sharedBg.screenIds.filter(sid => sid !== id);
        // If less than 2 screens remain, disable shared background
        if (sharedBg.screenIds.length < 2) {
          delete draft.sharedBackgrounds![size];
        }
      }
    });

    // Adjust selected indices
    setSelectedScreenIndices(prev => {
      // Remove the removed index
      let newIndices = prev.filter(i => i !== indexToRemove);

      // Shift indices greater than the removed index
      newIndices = newIndices.map(i => i > indexToRemove ? i - 1 : i);

      // If no screens left, select 0 (but screens array is empty, so handle that)
      const nextLen = Math.max(0, screens.length - 1);
      if (nextLen === 0) return [0];

      // If selection is empty (because we removed the only selected one), select the last one or 0
      if (newIndices.length === 0) {
        return [Math.max(0, Math.min(indexToRemove, nextLen - 1))];
      }

      return newIndices;
    });
  };

  const replaceScreen = (index: number, imageOrMediaId: string | number, imageSlotIndex: number = 0) => {
    commitCurrentScreens('Replace media', (list) => {
      const screen = list[index];
      if (!screen) return;
      const frameCount = getCompositionFrameCount(screen.settings.composition);
      if (!screen.images) screen.images = [];
      while (screen.images.length < frameCount) screen.images.push({ diyOptions: getDefaultDIYOptions('phone') });
      if (imageSlotIndex < screen.images.length) {
        const existing = screen.images[imageSlotIndex] || {};
        screen.images[imageSlotIndex] =
          typeof imageOrMediaId === 'number'
            ? { ...existing, mediaId: imageOrMediaId, image: undefined }
            : { ...existing, image: imageOrMediaId, mediaId: undefined };
      }
    });
  };

  const addTextElement = useCallback((screenId: string) => {
    commitCurrentScreens('Add text', (list) => {
      const screen = list.find((s) => s.id === screenId);
      if (!screen) return;
      const existing = screen.textElements ?? [];
      const newEl = createDefaultTextElement(existing);
      screen.textElements = [...existing, newEl];
      screen.settings = { ...screen.settings, selectedTextId: newEl.id };
    });
  }, [commitCurrentScreens]);

  const updateTextElement = useCallback((screenId: string, textId: string, updates: Omit<Partial<TextElement>, 'style'> & { style?: Partial<TextStyle> }) => {
    const labelForUpdate = () => {
      const styleKeys = updates.style ? Object.keys(updates.style) : [];
      const hasOnly = (keys: string[]) =>
        Object.keys(updates).every((k) => k === 'style' || keys.includes(k)) &&
        (updates.style ? styleKeys.length > 0 : true);

      // Most specific/common operations first
      if (typeof updates.content === 'string' && hasOnly(['content'])) return 'Edit text content';
      if (typeof updates.rotation === 'number' && hasOnly(['rotation'])) return 'Rotate text';
      if ((typeof updates.x === 'number' || typeof updates.y === 'number') && hasOnly(['x', 'y'])) return 'Move text';

      if (updates.style) {
        const resizeStyleKeys = new Set(['maxWidth', 'fontSize', 'backgroundPadding']);
        const isResize = styleKeys.some((k) => resizeStyleKeys.has(k));
        if (isResize && styleKeys.every((k) => resizeStyleKeys.has(k))) return 'Resize text';
        return 'Change text style';
      }

      if (typeof updates.visible === 'boolean' && hasOnly(['visible'])) return updates.visible ? 'Show text' : 'Hide text';
      if (typeof updates.name === 'string' && hasOnly(['name'])) return 'Rename text';

      return 'Edit text';
    };

    commitCurrentScreens(labelForUpdate(), (list) => {
      const screen = list.find((s) => s.id === screenId);
      if (!screen) return;
      const els = screen.textElements ?? [];
      const idx = els.findIndex((t) => t.id === textId);
      if (idx === -1) return;
      const t = els[idx];
      els[idx] = {
        ...t,
        ...updates,
        x: typeof updates.x === 'number' ? clamp01(updates.x) : t.x,
        y: typeof updates.y === 'number' ? clamp01(updates.y) : t.y,
        rotation: typeof updates.rotation === 'number' ? normalizeRotation(updates.rotation) : t.rotation,
        style: updates.style ? { ...t.style, ...updates.style } : t.style,
      };
      screen.textElements = els;
    });
  }, [commitCurrentScreens]);

  const deleteTextElement = useCallback((screenId: string, textId: string) => {
    commitCurrentScreens('Delete text', (list) => {
      const screen = list.find((s) => s.id === screenId);
      if (!screen) return;
      const remaining = (screen.textElements ?? []).filter((t) => t.id !== textId);
      const nextSelected =
        screen.settings.selectedTextId === textId ? (remaining[remaining.length - 1]?.id ?? undefined) : screen.settings.selectedTextId;
      screen.textElements = remaining;
      screen.settings = { ...screen.settings, selectedTextId: nextSelected };
    });
  }, [commitCurrentScreens]);

  const reorderTextElements = useCallback((screenId: string, fromIndex: number, toIndex: number) => {
    commitCurrentScreens('Reorder text', (list) => {
      const screen = list.find((s) => s.id === screenId);
      if (!screen) return;
      const sorted = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      if (fromIndex < 0 || fromIndex >= sorted.length) return;
      const clampedTo = Math.max(0, Math.min(sorted.length - 1, toIndex));
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(clampedTo, 0, moved);
      screen.textElements = sorted.map((t, i) => ({ ...t, zIndex: i + 1 }));
    });
  }, [commitCurrentScreens]);

  const selectTextElement = useCallback((textId: string | null) => {
    updateSelectedScreenSettings({ selectedTextId: textId ?? undefined });
  }, [updateSelectedScreenSettings]);

  const selectTextElementOnScreen = useCallback((screenIndex: number, textId: string | null) => {
    // Update a specific screen's selectedTextId (for multi-select scenarios)
    // When selecting text on one screen, clear selection on all other screens
    mutateDoc((draft) => {
      const size = currentCanvasSizeRef.current;
      const list = draft.screensByCanvasSize[size] || [];
      
      // If selecting text (not clearing), clear selection on all other screens first
      if (textId) {
        list.forEach((screen, idx) => {
          if (idx !== screenIndex && screen.settings.selectedTextId) {
            screen.settings = { ...screen.settings, selectedTextId: undefined };
          }
        });
      }
      
      // Update the target screen's selection
      const screen = list[screenIndex];
      if (!screen) return;
      screen.settings = { ...screen.settings, selectedTextId: textId ?? undefined };
    });
  }, []);

  const duplicateTextElement = useCallback((screenId: string, textId: string) => {
    commitCurrentScreens('Duplicate text', (list) => {
      const screen = list.find((s) => s.id === screenId);
      if (!screen) return;
      const existing = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      const idx = existing.findIndex((t) => t.id === textId);
      if (idx === -1) return;
      const source = existing[idx];
      const copy: TextElement = {
        ...source,
        id: createId('text'),
        name: `${source.name} Copy`,
        x: clamp01(source.x + 2),
        y: clamp01(source.y + 2),
      };
      existing.splice(idx + 1, 0, copy);
      screen.textElements = existing.map((t, i) => ({ ...t, zIndex: i + 1 }));
      screen.settings = { ...screen.settings, selectedTextId: copy.id };
    });
  }, [commitCurrentScreens]);

  const setCanvasBackgroundMedia = useCallback((screenIndex: number, mediaId: number | undefined) => {
    commitCurrentScreens('Change canvas background', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      screen.settings = { ...screen.settings, canvasBackgroundMediaId: mediaId };
    });
  }, [commitCurrentScreens]);

  const clearFrameSlot = useCallback((screenIndex: number, frameIndex: number) => {
    commitCurrentScreens('Clear frame', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      const existing = screen.images[frameIndex] || {};
      // Preserve position and transform when clearing media
      screen.images[frameIndex] = {
        ...existing,
        diyOptions: existing.diyOptions, // Keep DIY options if they exist
        diyTemplateId: existing.diyTemplateId,
        cleared: true,
        image: undefined,
        mediaId: undefined,
        panX: undefined,
        panY: undefined,
        // Preserve frameX, frameY, tiltX, tiltY, rotateZ, frameScale
        frameX: existing.frameX ?? 0,
        frameY: existing.frameY ?? 0,
        tiltX: existing.tiltX ?? 0,
        tiltY: existing.tiltY ?? 0,
        rotateZ: existing.rotateZ ?? 0,
        frameScale: existing.frameScale ?? 100,
      };
    });
  }, [commitCurrentScreens]);

  const setFrameDIYOptions = useCallback((screenIndex: number, frameIndex: number, options: DIYOptions, templateId?: string) => {
    commitCurrentScreens('Change device type', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      const frameCount = getCompositionFrameCount(screen.settings.composition);
      while (screen.images.length < frameCount) screen.images.push({});
      if (frameIndex < screen.images.length) {
        screen.images[frameIndex] = {
          ...(screen.images[frameIndex] || {}),
          diyOptions: options,
          diyTemplateId: templateId,
          cleared: false
        };
      }
    });
  }, [commitCurrentScreens]);

  const setFramePan = useCallback((screenIndex: number, frameIndex: number, panX: number, panY: number) => {
    commitCurrentScreens('Pan media', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), panX, panY };
    });
  }, [commitCurrentScreens]);

  const addFramePositionDelta = useCallback((screenIndex: number, frameIndex: number, dx: number, dy: number) => {
    commitCurrentScreens('Move frame', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      const curX = screen.images[frameIndex]?.frameX ?? 0;
      const curY = screen.images[frameIndex]?.frameY ?? 0;
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameX: curX + dx, frameY: curY + dy };
    });
  }, [commitCurrentScreens]);

  const setFramePosition = useCallback((screenIndex: number, frameIndex: number, frameX: number, frameY: number) => {
    commitCurrentScreens('Move frame', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameX, frameY };
    });
  }, [commitCurrentScreens]);

  const setFrameScale = useCallback((screenIndex: number, frameIndex: number, frameScale: number) => {
    commitCurrentScreens('Scale frame', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameScale };
    });
  }, [commitCurrentScreens]);

  const setFrameRotate = useCallback((screenIndex: number, frameIndex: number, rotateZ: number) => {
    commitCurrentScreens('Rotate frame', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), rotateZ };
    });
  }, [commitCurrentScreens]);

  const setFrameTilt = useCallback((screenIndex: number, frameIndex: number, tiltX: number, tiltY: number) => {
    commitCurrentScreens('Tilt frame', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      screen.images[frameIndex] = {
        ...(screen.images[frameIndex] || {}),
        tiltX: clampFrameTransform(tiltX, 'tiltX'),
        tiltY: clampFrameTransform(tiltY, 'tiltY'),
      };
    });
  }, [commitCurrentScreens]);

  const setFrameColor = useCallback((screenIndex: number, frameIndex: number, frameColor: string | undefined) => {
    commitCurrentScreens('Change frame color', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameColor };
    });
  }, [commitCurrentScreens]);

  const setImageRotation = useCallback((screenIndex: number, frameIndex: number, imageRotation: number) => {
    commitCurrentScreens('Rotate image', (list) => {
      const screen = list[screenIndex];
      if (!screen) return;
      if (!screen.images) screen.images = [];
      while (screen.images.length <= frameIndex) screen.images.push({});
      // Normalize rotation to 0-360 range
      const normalizedRotation = ((imageRotation % 360) + 360) % 360;
      screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), imageRotation: normalizedRotation };
    });
  }, [commitCurrentScreens]);

  const setSharedBackground = useCallback((canvasSize: string, sharedBg: SharedBackground | undefined) => {
    const label = sharedBg ? 'Update shared background' : 'Remove shared background';
    commitDoc(label, (draft) => {
      if (!draft.sharedBackgrounds) draft.sharedBackgrounds = {};
      if (sharedBg) {
        draft.sharedBackgrounds[canvasSize] = sharedBg;
      } else {
        delete draft.sharedBackgrounds[canvasSize];
      }
    });
  }, [commitDoc]);

  const toggleScreenInSharedBackground = useCallback((screenId: string) => {
    const size = currentCanvasSizeRef.current;
    const allScreens = doc.screensByCanvasSize[size] || [];
    const existing = doc.sharedBackgrounds?.[size];

    if (!existing) {
      // Create new shared background with this screen
      commitDoc('Enable shared background', (draft) => {
        if (!draft.sharedBackgrounds) draft.sharedBackgrounds = {};
        draft.sharedBackgrounds[size] = createDefaultSharedBackground([screenId]);
      });
      return;
    }

    const isInGroup = existing.screenIds.includes(screenId);

    if (isInGroup) {
      // Remove from group
      const newIds = existing.screenIds.filter(id => id !== screenId);
      if (newIds.length < 2) {
        // Less than 2 screens - disable shared background
        commitDoc('Disable shared background', (draft) => {
          if (draft.sharedBackgrounds) {
            delete draft.sharedBackgrounds[size];
          }
        });
      } else {
        commitDoc('Remove screen from shared background', (draft) => {
          if (draft.sharedBackgrounds?.[size]) {
            draft.sharedBackgrounds[size].screenIds = newIds;
          }
        });
      }
    } else {
      // Add to group in correct order
      const newIds = insertScreenIdInOrder(existing.screenIds, screenId, allScreens);
      commitDoc('Add screen to shared background', (draft) => {
        if (draft.sharedBackgrounds?.[size]) {
          draft.sharedBackgrounds[size].screenIds = newIds;
        }
      });
    }
  }, [commitDoc, doc.screensByCanvasSize, doc.sharedBackgrounds]);

  // Get screens for current canvas size
  const getCurrentScreens = useCallback((): Screen[] => {
    return doc.screensByCanvasSize[currentCanvasSize] || [];
  }, [doc.screensByCanvasSize, currentCanvasSize]);

  // Switch canvas size
  const switchCanvasSize = useCallback((newSize: string, settingsOverrides?: Record<string, unknown>) => {
    // Save current workspace state before switching (will be triggered by useEffect)

    // Update to new canvas size
    setCurrentCanvasSize(newSize);

    // Initialize empty screen array for new canvas size if it doesn't exist
    // and apply any settings overrides (e.g. orientation) to existing screens
    commitDoc('Switch canvas size', (draft) => {
      if (!draft.screensByCanvasSize[newSize]) draft.screensByCanvasSize[newSize] = [];
      if (settingsOverrides) {
        const screens = draft.screensByCanvasSize[newSize];
        screens.forEach(screen => {
          screen.settings = { ...screen.settings, ...settingsOverrides };
        });
      }
    });

    // Reset selection state for new canvas size
    const screensForNewSize = doc.screensByCanvasSize[newSize] || [];
    if (screensForNewSize.length > 0) {
      setSelectedScreenIndices([0]);
    } else {
      setSelectedScreenIndices([]);
    }

    // Reset selected frame index
    setSelectedFrameIndex(0);
  }, [commitDoc, doc.screensByCanvasSize]);

  const reorderScreens = useCallback((fromIndex: number, toIndex: number) => {
    commitDoc('Reorder screens', (draft) => {
      const size = currentCanvasSizeRef.current;
      const prev = draft.screensByCanvasSize[size];
      if (!prev) return;
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= prev.length || toIndex >= prev.length) return;

      const [moved] = prev.splice(fromIndex, 1);
      prev.splice(toIndex, 0, moved);

      // Also reorder screenIds in shared background if present
      const sharedBg = draft.sharedBackgrounds?.[size];
      if (sharedBg) {
        sharedBg.screenIds = reorderScreenIds(sharedBg, prev);
      }
    });

    // Preserve selection by screen id(s), not by raw index.
    setSelectedScreenIndices((prevSel) => {
      const size = currentCanvasSizeRef.current;
      const prev = doc.screensByCanvasSize[size] || [];
      const selectedIds = prevSel.map((i) => prev[i]?.id).filter(Boolean) as string[];
      if (selectedIds.length === 0) return prevSel;

      // Compute new order
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      const idToIndex = new Map(next.map((s, i) => [s.id, i]));
      const remapped = selectedIds
        .map((id) => idToIndex.get(id))
        .filter((i): i is number => typeof i === 'number');

      return remapped.length > 0 ? remapped : prevSel;
    });
  }, [commitDoc, doc.screensByCanvasSize]);

  // Load project data into React state
  const loadProjectIntoState = useCallback((project: Project) => {
    setCurrentProjectId(project.id);
    // Clear selection on load so user sees clean "nothing selected" state
    const screensWithNoSelection = Object.fromEntries(
      Object.entries(project.screensByCanvasSize).map(([size, screens]) => [
        size,
        screens.map((s) => ({
          ...s,
          settings: { ...s.settings, selectedTextId: undefined },
        })),
      ])
    );
    resetDocWithHistory({ name: project.name, screensByCanvasSize: screensWithNoSelection });
    setCurrentCanvasSize(project.currentCanvasSize);
    setSelectedScreenIndices(project.selectedScreenIndices);
    setSelectedFrameIndex(project.selectedFrameIndex ?? 0);
    setFrameSelectionVisible(false);
    setZoom(project.zoom);
    projectCreatedAt.current = project.createdAt;
    projectPristine.current = project.pristine;
    hasCompletedFirstContentSave.current = false; // Reset to skip first save after load

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
  }, [resetDocWithHistory]);

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
          // Project was deleted — try to fall back to an existing project
          // instead of blindly creating another "My Project"
          const existing = await persistenceDB.getAllProjects();
          if (existing.length > 0) {
            const recent = existing.sort((a, b) =>
              b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime()
            )[0];
            loadProjectIntoState(recent);
          } else {
            const newProject = await persistenceDB.createProject('My Project');
            loadProjectIntoState(newProject);
          }
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
            downloadFormat,
            downloadJpegQuality,
          });
        } else {
          // No projects exist, create default project with current screens
          const newProject = await persistenceDB.createProject('My Project');
          // Seed with our default in-memory doc (so the first project is not empty).
          const seed = createInitialDoc();
          newProject.screensByCanvasSize = seed.screensByCanvasSize;
          const firstSize = Object.keys(seed.screensByCanvasSize)[0];
          if (firstSize) {
            newProject.currentCanvasSize = firstSize;
          }
          await persistenceDB.saveProject(newProject);
          // Don't load the empty project - keep the initial default screen
          // Just set the project ID so saves will work
          setCurrentProjectId(newProject.id);
          resetDocWithHistory({ name: newProject.name, screensByCanvasSize: newProject.screensByCanvasSize });
          setCurrentCanvasSize(newProject.currentCanvasSize);
          setFrameSelectionVisible(false);
          projectCreatedAt.current = newProject.createdAt;
        }
      }
      
      // Load UI preferences
      if (appState) {
        setSidebarTab(appState.sidebarTab);
        setSidebarPanelOpen(appState.sidebarPanelOpen);
        setNavWidth(appState.navWidth);
        if (appState.downloadFormat === 'png' || appState.downloadFormat === 'jpg') {
          setDownloadFormat(appState.downloadFormat);
        }
        if (typeof appState.downloadJpegQuality === 'number') {
          setDownloadJpegQuality(Math.max(0, Math.min(100, appState.downloadJpegQuality)));
        }
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      // Continue with default state
    } finally {
      // Mark that initial state has been loaded
      hasLoadedInitialState.current = true;
      setIsInitializing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    createInitialDoc,
    downloadFormat,
    downloadJpegQuality,
    loadProjectIntoState,
    navWidth,
    resetDocWithHistory,
    sidebarPanelOpen,
    sidebarTab,
  ]);

  // Reload UI when sync pulls projects from server
  useEffect(() => {
    const handler = async (e: Event) => {
      const pulledIds = (e as CustomEvent<string[]>).detail;
      if (!pulledIds?.length) return;

      if (currentProjectId && pulledIds.includes(currentProjectId)) {
        // Current project was updated on server — reload it into state
        const updated = await persistenceDB.loadProject(currentProjectId);
        if (updated) loadProjectIntoState(updated);
      } else if (currentProjectId) {
        // Check if current project was deleted by claimLocalProjects
        const current = await persistenceDB.loadProject(currentProjectId);
        if (!current) {
          // Switch to most recent available project
          const all = await persistenceDB.getAllProjects();
          if (all.length > 0) {
            const recent = all.sort((a, b) =>
              b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime()
            )[0];
            loadProjectIntoState(recent);
          }
        }
      }
    };
    window.addEventListener('appframes:projects-pulled', handler);
    return () => window.removeEventListener('appframes:projects-pulled', handler);
  }, [currentProjectId, loadProjectIntoState]);

  // Save project state (debounced)
  // Don't use useCallback - we need fresh values on each call
  // contentChanged: true when screensByCanvasSize or name changed (marks project non-pristine)
  const saveProjectState = (contentChanged = false) => {
    if (!currentProjectId || !hasLoadedInitialState.current) {
      return;
    }

    // If content changed, mark project as no longer pristine (skip first save after load)
    if (contentChanged) {
      if (hasCompletedFirstContentSave.current) {
        projectPristine.current = false;
      }
      hasCompletedFirstContentSave.current = true;
    }

    debouncedSave(async () => {
      // Check if project still exists (might have been deleted by claimLocalProjects)
      const existingProject = await persistenceDB.loadProject(currentProjectId);
      if (!existingProject && projectPristine.current) {
        // Project was deleted and was pristine - don't re-create it
        return;
      }

      await persistenceDB.saveProject({
        id: currentProjectId,
        name: doc.name,
        screensByCanvasSize: doc.screensByCanvasSize,
        currentCanvasSize,
        selectedScreenIndices,
        primarySelectedIndex,
        selectedFrameIndex,
        zoom,
        pristine: projectPristine.current,
        createdAt: projectCreatedAt.current,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      });
      // Enqueue for server sync (if signed in, and only if not pristine)
      if (!projectPristine.current) {
        syncProject(currentProjectId);
      }
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
        downloadFormat,
        downloadJpegQuality,
      });
    });
  };

  // Load persisted state on mount
  useEffect(() => {
    if (hasStartedInitialLoad.current) return;
    hasStartedInitialLoad.current = true;
    loadPersistedState();
  }, [loadPersistedState]);

  // Save project state when screensByCanvasSize or name changes (content changes mark non-pristine)
  useEffect(() => {
    saveProjectState(true); // Content changed - mark non-pristine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.screensByCanvasSize, doc.name]);

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

  // Save app state when UI prefs change
  useEffect(() => {
    saveAppState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId, sidebarTab, sidebarPanelOpen, navWidth, downloadFormat, downloadJpegQuality]);

  // screens are derived from doc.screensByCanvasSize[currentCanvasSize], so we no longer
  // need bi-directional syncing effects (which also avoids stringify costs).

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
          name: doc.name,
          screensByCanvasSize: doc.screensByCanvasSize,
          currentCanvasSize,
          selectedScreenIndices,
          primarySelectedIndex,
          selectedFrameIndex,
          zoom,
          pristine: projectPristine.current,
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
        downloadFormat,
        downloadJpegQuality,
      });
    } catch (error) {
      console.error('Failed to create new project:', error);
      throw error;
    }
  }, [currentProjectId, doc.name, doc.screensByCanvasSize, currentCanvasSize, 
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
          name: doc.name,
          screensByCanvasSize: doc.screensByCanvasSize,
          currentCanvasSize,
          selectedScreenIndices,
          primarySelectedIndex,
          selectedFrameIndex,
          zoom,
          pristine: projectPristine.current,
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
          downloadFormat,
          downloadJpegQuality,
        });
      } else {
        console.error('Project not found:', projectId);
      }
    } catch (error) {
      console.error('Failed to switch project:', error);
      throw error;
    }
  }, [currentProjectId, doc.name, doc.screensByCanvasSize, currentCanvasSize,
      selectedScreenIndices, primarySelectedIndex, selectedFrameIndex, zoom,
      sidebarTab, sidebarPanelOpen, navWidth, loadProjectIntoState]);

  /**
   * Delete a project by ID
   * If deleting current project, switches to another project or creates new one
   * Media library is preserved across all operations
   */
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      // Delete the project from local database
      await persistenceDB.deleteProject(projectId);
      // Remove from sync queue if pending
      await persistenceDB.dequeueSyncProject(projectId);

      // Try to delete on server (if signed in) - fire and forget
      if (isSignedIn) {
        const baseRevision = await persistenceDB.getSyncedRevision(projectId);
        fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseRevision }),
        }).catch(console.error);
      }

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
  }, [currentProjectId, switchProject, createNewProject, isSignedIn]);

  /**
   * Rename the current project
   */
  const renameProject = useCallback(async (newName: string) => {
    try {
      if (!currentProjectId) {
        console.error('No current project to rename');
        return;
      }
      
      // Update local state (undoable)
      commitDoc('Rename project', (draft) => {
        draft.name = newName;
      });
      
      // Update in database
      await persistenceDB.renameProject(currentProjectId, newName);
    } catch (error) {
      console.error('Failed to rename project:', error);
      throw error;
    }
  }, [commitDoc, currentProjectId]);

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
        frameSelectionVisible,
        setFrameSelectionVisible,
        primarySelectedIndex,
        settings,
        handleScreenSelect,
        addScreen,
        addFrameSlot,
        updateSelectedScreenSettings,
        setSettings,
        removeScreen,
        duplicateScreen,
        replaceScreen,
        mediaCache,
        setCachedMedia,
        currentProjectId,
        currentProjectName: doc.name,
        screensByCanvasSize: doc.screensByCanvasSize,
        currentCanvasSize,
        saveStatus,
        undo,
        redo,
        canUndo,
        canRedo,
        historyEntries,
        historyPosition,
        goToHistory,
        sidebarTab,
        setSidebarTab,
        sidebarPanelOpen,
        setSidebarPanelOpen,
        navWidth,
        setNavWidth,
        downloadFormat,
        setDownloadFormat,
        downloadJpegQuality,
        setDownloadJpegQuality,
        switchCanvasSize,
        getCurrentScreens,
        reorderScreens,
        createNewProject,
        switchProject,
        deleteProject,
        renameProject,
        getAllProjects,
        syncStatus,
        isSignedIn,
        syncAll,
        isInitializing,
        addTextElement,
        updateTextElement,
        deleteTextElement,
        reorderTextElements,
        selectTextElement,
        selectTextElementOnScreen,
        duplicateTextElement,
        setCanvasBackgroundMedia,
        clearFrameSlot,
        setFrameDIYOptions,
        setFramePan,
        addFramePositionDelta,
        setFramePosition,
        setFrameScale,
        setFrameRotate,
        setFrameTilt,
        setFrameColor,
        setImageRotation,
        sharedBackgrounds,
        currentSharedBackground,
        setSharedBackground,
        toggleScreenInSharedBackground,
      }}
    >
      {children}
      <WelcomeModal />
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
