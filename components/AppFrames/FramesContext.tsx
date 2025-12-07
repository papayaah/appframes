'use client';

import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { Screen, ScreenImage, CanvasSettings, DEFAULT_TEXT_STYLE } from './types';

// Canvas dimensions helper (App Store requirements)
export const getCanvasDimensions = (canvasSize: string, _orientation: string) => {
  const dimensions: Record<string, { width: number; height: number }> = {
    // Apple App Store - iPhone (Portrait only)
    'iphone-6.9': { width: 1320, height: 2868 },
    'iphone-6.5': { width: 1284, height: 2778 },
    'iphone-6.3': { width: 1206, height: 2622 },
    'iphone-6.1': { width: 1179, height: 2556 },
    'iphone-5.5': { width: 1242, height: 2208 },
    'iphone-4.7': { width: 750, height: 1334 },
    'iphone-4.0': { width: 640, height: 1136 },
    'iphone-3.5': { width: 640, height: 960 },
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
    'iphone-6.9': 'iPhone 6.9"',
    'iphone-6.5': 'iPhone 6.5"',
    'iphone-6.3': 'iPhone 6.3"',
    'iphone-6.1': 'iPhone 6.1"',
    'iphone-5.5': 'iPhone 5.5"',
    'iphone-4.7': 'iPhone 4.7"',
    'iphone-4.0': 'iPhone 4.0"',
    'iphone-3.5': 'iPhone 3.5"',
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

// Helper function to get default settings for a new screen
export const getDefaultScreenSettings = (): Omit<CanvasSettings, 'selectedScreenIndex'> => {
  return {
    canvasSize: 'iphone-6.9',
    deviceFrame: 'iphone-14-pro',
    composition: 'single',
    compositionScale: 85,
    captionVertical: 10,
    captionHorizontal: 50,
    screenScale: 100,
    screenPanX: 50,
    screenPanY: 50,
    orientation: 'portrait',
    backgroundColor: '#E5E7EB',
    captionText: 'Powerful tools for your workflow',
    showCaption: true,
    captionStyle: { ...DEFAULT_TEXT_STYLE },
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
}

const FramesContext = createContext<FramesContextType | undefined>(undefined);

export function FramesProvider({ children }: { children: ReactNode }) {
  // Use a counter for screen IDs to avoid hydration issues
  const screenIdCounter = useRef(0);

  // Initialize with one empty screen with default settings
  const [screens, setScreens] = useState<Screen[]>([
    {
      id: `screen-0`,
      name: 'Screen 1',
      images: [], // Empty images array - will be populated based on composition
      settings: getDefaultScreenSettings(),
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

  // Primary selected screen is the last one in the selection list (most recently selected)
  const primarySelectedIndex = selectedScreenIndices.length > 0
    ? selectedScreenIndices[selectedScreenIndices.length - 1]
    : 0;

  // Get current screen's settings (computed from primary selected screen)
  const currentScreen = screens[primarySelectedIndex];
  const settings: CanvasSettings = currentScreen
    ? { ...currentScreen.settings, selectedScreenIndex: primarySelectedIndex }
    : { ...getDefaultScreenSettings(), selectedScreenIndex: 0 };

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

    // Initialize images array based on composition type
    const images: ScreenImage[] = Array(frameCount).fill(null).map(() => ({}));

    // If an image was provided, add it to the first slot
    if (imageOrMediaId) {
      if (typeof imageOrMediaId === 'number') {
        images[0] = { mediaId: imageOrMediaId };
      } else {
        images[0] = { image: imageOrMediaId };
      }
    }

    screenIdCounter.current += 1;
    const newScreen: Screen = {
      id: `screen-${screenIdCounter.current}`,
      images,
      name: `Screen ${screens.length + 1}`,
      settings: defaultSettings, // Each screen gets its own default settings
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
            // Add empty slots
            while (newImages.length < newFrameCount) {
              newImages.push({});
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
          newImages.push({});
        }

        if (imageSlotIndex < newImages.length) {
          newImages[imageSlotIndex] = typeof imageOrMediaId === 'number'
            ? { mediaId: imageOrMediaId, image: undefined }
            : { image: imageOrMediaId, mediaId: undefined };
        }

        updatedScreens[index] = {
          ...screen,
          images: newImages,
        };
      }
      return updatedScreens;
    });
  };

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
