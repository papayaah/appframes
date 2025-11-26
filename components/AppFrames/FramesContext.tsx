'use client';

import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { Screen, ScreenImage, CanvasSettings } from './types';

// Canvas dimensions helper (App Store requirements)
export const getCanvasDimensions = (canvasSize: string, _orientation: string) => {
  const dimensions: Record<string, { width: number; height: number }> = {
    // iPhone 6.5" Display
    'iphone-6.5-1': { width: 1242, height: 2688 },
    'iphone-6.5-2': { width: 2688, height: 1242 },
    'iphone-6.5-3': { width: 1284, height: 2778 },
    'iphone-6.5-4': { width: 2778, height: 1284 },
    // iPad 13" Display
    'ipad-13-1': { width: 2064, height: 2752 },
    'ipad-13-2': { width: 2752, height: 2064 },
    'ipad-13-3': { width: 2048, height: 2732 },
    'ipad-13-4': { width: 2732, height: 2048 },
    // Apple Watch Ultra 3
    'watch-ultra-3-1': { width: 422, height: 514 },
    'watch-ultra-3-2': { width: 410, height: 502 },
    // Apple Watch Series 11
    'watch-s11': { width: 416, height: 496 },
    // Apple Watch Series 9
    'watch-s9': { width: 396, height: 484 },
    // Apple Watch Series 6
    'watch-s6': { width: 368, height: 448 },
    // Apple Watch Series 3
    'watch-s3': { width: 312, height: 390 },
    // Google Play - Phone
    'google-phone-1': { width: 1080, height: 1920 },
    'google-phone-2': { width: 1920, height: 1080 },
    'google-phone-3': { width: 1440, height: 2560 },
    'google-phone-4': { width: 2560, height: 1440 },
    // Google Play - Tablet
    'google-tablet-1': { width: 1600, height: 2560 },
    'google-tablet-2': { width: 2560, height: 1600 },
    'google-tablet-3': { width: 2048, height: 2732 },
    'google-tablet-4': { width: 2732, height: 2048 },
  };

  const dim = dimensions[canvasSize] || { width: 1242, height: 2688 };

  // Don't apply orientation transform since dimensions already include orientation
  return dim;
};

// Helper function to determine how many device frames a composition uses
export const getCompositionFrameCount = (composition: string): number => {
  switch (composition) {
    case 'single': return 1;
    case 'split': return 2;
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
    canvasSize: 'iphone-6.5-1',
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
    tilt: 'none',
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
        const oldComposition = screen.settings.composition;
        const newSettings = {
          ...screen.settings,
          ...updates,
        };

        if (screen.splitPairId && updates.composition && updates.composition !== 'split' && oldComposition === 'single') {
          const pairScreens = updated
            .map((s, idx) => ({ screen: s, index: idx }))
            .filter(({ screen: s }) => s.splitPairId === screen.splitPairId);

          if (pairScreens.length === 2) {
            const otherScreenData = pairScreens.find(({ index }) => index !== primarySelectedIndex);
            
            if (otherScreenData) {
              updated[otherScreenData.index] = {
                ...updated[otherScreenData.index],
                splitPairId: undefined,
                settings: {
                  ...updated[otherScreenData.index].settings,
                  composition: 'single',
                },
              };
            }

            let newImages = [...(screen.images || [])];
            const newFrameCount = getCompositionFrameCount(updates.composition);
            
            while (newImages.length < newFrameCount) {
              newImages.push({});
            }
            if (newImages.length > newFrameCount) {
              newImages = newImages.slice(0, newFrameCount);
            }

            updated[primarySelectedIndex] = {
              ...screen,
              splitPairId: undefined,
              settings: newSettings,
              images: newImages,
            };

            return updated;
          }
        }

        if (updates.composition === 'split' && oldComposition !== 'split') {
          const splitPairId = `split-${Date.now()}`;
          const newScreen: Screen = {
            id: `screen-${Date.now()}-${Math.random()}`,
            images: [{}],
            name: `Screen ${prevScreens.length + 1}`,
            settings: {
              ...newSettings,
              composition: 'single',
            },
            splitPairId,
          };

          updated[primarySelectedIndex] = {
            ...screen,
            settings: {
              ...newSettings,
              composition: 'single',
            },
            images: [{}],
            splitPairId,
          };

          updated.splice(primarySelectedIndex + 1, 0, newScreen);

          return updated;
        }

        // If composition changed, resize images array to match new composition
        let newImages = [...(screen.images || [])];
        if (updates.composition && updates.composition !== screen.settings.composition) {
          const oldFrameCount = getCompositionFrameCount(screen.settings.composition);
          const newFrameCount = getCompositionFrameCount(updates.composition);

          if (newFrameCount > oldFrameCount) {
            // Add empty slots
            while (newImages.length < newFrameCount) {
              newImages.push({});
            }
          } else if (newFrameCount < oldFrameCount) {
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

    const screenToRemove = screens[indexToRemove];
    
    if (screenToRemove.splitPairId) {
      const pairScreens = screens.filter(s => s.splitPairId === screenToRemove.splitPairId);
      
      if (pairScreens.length === 2) {
        const remainingScreen = pairScreens.find(s => s.id !== id);
        
        if (remainingScreen) {
          setScreens(prevScreens => {
            const updated = prevScreens.filter(s => s.id !== id);
            const remainingIndex = updated.findIndex(s => s.id === remainingScreen.id);
            
            if (remainingIndex !== -1) {
              updated[remainingIndex] = {
                ...updated[remainingIndex],
                splitPairId: undefined,
                settings: {
                  ...updated[remainingIndex].settings,
                  composition: 'single',
                },
              };
            }
            
            return updated;
          });
          
          setSelectedScreenIndices(prev => {
            let newIndices = prev.filter(i => i !== indexToRemove);
            newIndices = newIndices.map(i => i > indexToRemove ? i - 1 : i);
            
            const newScreensLength = screens.length - 1;
            if (newScreensLength === 0) return [0];
            
            if (newIndices.length === 0) {
              return [Math.max(0, Math.min(indexToRemove, newScreensLength - 1))];
            }
            
            return newIndices;
          });
          
          return;
        }
      }
    }

    // Regular screen removal (non-split)
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
