
import { useState, useCallback, useMemo } from 'react';
import { Screen, ScreenImage, CanvasSettings } from '../../types';
import { UndoableDoc } from '../types';
import {
    getCanvasDimensions,
    getCompositionFrameCount,
    getDefaultScreenSettings,
    generateDefaultScreenName,
    generateNextScreenName,
    inferDeviceTypeFromCanvasSize
} from '../utils';
import { getDefaultDIYOptions } from '../../diy-frames/types';
import { reorderScreenIds, insertScreenIdInOrder } from '../../sharedBackgroundUtils';

export function useScreenState(
    doc: UndoableDoc,
    commitDoc: (label: string, updator: (draft: UndoableDoc) => void) => void,
    mutateDoc: (updator: (draft: UndoableDoc) => void) => void,
    currentCanvasSize: string,
) {
    const [selectedScreenIndices, setSelectedScreenIndices] = useState<number[]>([0]);
    const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
    const [frameSelectionVisible, setFrameSelectionVisible] = useState<boolean>(false);

    const screens = useMemo(() => doc.screensByCanvasSize[currentCanvasSize] || [], [doc.screensByCanvasSize, currentCanvasSize]);

    const primarySelectedIndex = useMemo(() => {
        if (selectedScreenIndices.length === 0) return 0;
        return selectedScreenIndices[selectedScreenIndices.length - 1];
    }, [selectedScreenIndices]);

    const handleScreenSelect = useCallback((index: number, toggle: boolean, shift?: boolean) => {
        if (shift) {
            setSelectedScreenIndices(prev => {
                const anchor = prev.length > 0 ? prev[prev.length - 1] : 0;
                const start = Math.min(anchor, index);
                const end = Math.max(anchor, index);
                const range: number[] = [];
                for (let i = start; i <= end; i++) range.push(i);
                return range;
            });
        } else if (toggle) {
            setSelectedScreenIndices(prev => {
                if (prev.includes(index)) {
                    const newIndices = prev.filter(i => i !== index);
                    return newIndices.length > 0 ? newIndices : [index];
                } else {
                    return [...prev, index];
                }
            });
        } else {
            setSelectedScreenIndices([index]);
        }
        setSelectedFrameIndex(0);
    }, []);

    const addScreen = useCallback((imageOrMediaId?: string | number) => {
        const lastScreen = screens.length > 0 ? screens[screens.length - 1] : null;
        const defaultSettings = (() => {
            const defaults = getDefaultScreenSettings();
            const dims = getCanvasDimensions(currentCanvasSize, 'portrait');
            if (dims.width > dims.height) defaults.orientation = 'landscape';
            if (lastScreen) {
                defaults.composition = lastScreen.settings.composition;
                defaults.orientation = lastScreen.settings.orientation;
            }
            return defaults;
        })();
        const frameCount = getCompositionFrameCount(defaultSettings.composition);

        const getFrameOptions = () => {
            const deviceType = inferDeviceTypeFromCanvasSize(currentCanvasSize);
            if (!deviceType) return null;

            if (screens.length > 0) {
                const lastScreen = screens[screens.length - 1];
                const lastFrame = lastScreen?.images?.find(
                    (img) => img && !img.cleared && img.diyOptions
                );
                if (lastFrame?.diyOptions) return { ...lastFrame.diyOptions };
            }
            return getDefaultDIYOptions(deviceType);
        };

        const frameOpts = getFrameOptions();

        const images: ScreenImage[] = Array(frameCount).fill(null).map(() =>
            frameOpts ? { diyOptions: { ...frameOpts }, frameScale: 100 } : { cleared: true }
        );

        if (imageOrMediaId) {
            if (typeof imageOrMediaId === 'number') {
                images[0] = {
                    // @ts-ignore
                    mediaId: imageOrMediaId,
                    ...(frameOpts ? { diyOptions: { ...frameOpts }, frameScale: 100 } : { cleared: true })
                };
            } else {
                images[0] = {
                    // @ts-ignore
                    image: imageOrMediaId,
                    ...(frameOpts ? { diyOptions: { ...frameOpts }, frameScale: 100 } : { cleared: true })
                };
            }
        }

        const newScreen: Screen = {
            id: `screen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            images,
            name: generateDefaultScreenName(currentCanvasSize, screens),
            settings: defaultSettings,
            textElements: [],
        };

        commitDoc('Add screen', (draft) => {
            if (!draft.screensByCanvasSize[currentCanvasSize]) draft.screensByCanvasSize[currentCanvasSize] = [];
            draft.screensByCanvasSize[currentCanvasSize].push(newScreen);
        });

        setSelectedScreenIndices([screens.length]);
        setSelectedFrameIndex(0);
        setFrameSelectionVisible(false);
    }, [screens, currentCanvasSize, commitDoc]);

    const duplicateScreen = useCallback((screenIndex: number) => {
        const sourceScreen = screens[screenIndex];
        if (!sourceScreen) return;

        const newScreen: Screen = {
            id: `screen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            images: sourceScreen.images
                ? sourceScreen.images.map((img) =>
                    img
                        ? {
                            ...img,
                            diyOptions: img.diyOptions ? { ...img.diyOptions } : undefined,
                        }
                        : {}
                )
                : [],
            name: generateNextScreenName(sourceScreen.name, currentCanvasSize, screens),
            settings: { ...sourceScreen.settings, canvasSize: currentCanvasSize, selectedTextId: undefined },
            textElements: sourceScreen.textElements
                ? sourceScreen.textElements.map((el) => ({
                    ...el,
                    id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    style: { ...el.style },
                }))
                : [],
        };

        commitDoc('Duplicate screen', (draft) => {
            if (!draft.screensByCanvasSize[currentCanvasSize]) draft.screensByCanvasSize[currentCanvasSize] = [];
            draft.screensByCanvasSize[currentCanvasSize].splice(screenIndex + 1, 0, newScreen);
        });

        setSelectedScreenIndices([screenIndex + 1]);
        setSelectedFrameIndex(0);
        setFrameSelectionVisible(false);
    }, [screens, currentCanvasSize, commitDoc]);

    const removeScreen = useCallback((id: string) => {
        const indexToRemove = screens.findIndex(s => s.id === id);
        if (indexToRemove === -1) return;

        commitDoc('Delete screen', (draft) => {
            const list = draft.screensByCanvasSize[currentCanvasSize];
            if (list) {
                const idx = list.findIndex((s) => s.id === id);
                if (idx !== -1) list.splice(idx, 1);
            }
            const sharedBg = draft.sharedBackgrounds?.[currentCanvasSize];
            if (sharedBg) {
                sharedBg.screenIds = sharedBg.screenIds.filter(sid => sid !== id);
            }
        });

        setSelectedScreenIndices(prev => {
            let newIndices = prev.filter(i => i !== indexToRemove);
            newIndices = newIndices.map(i => i > indexToRemove ? i - 1 : i);
            const nextLen = Math.max(0, screens.length - 1);
            if (nextLen === 0) return [0];
            if (newIndices.length === 0) {
                return [Math.max(0, Math.min(indexToRemove, nextLen - 1))];
            }
            return newIndices;
        });
    }, [screens, currentCanvasSize, commitDoc]);

    const removeAllScreens = useCallback(() => {
        commitDoc('Delete all screens', (draft) => {
            draft.screensByCanvasSize[currentCanvasSize] = [];
            if (draft.sharedBackgrounds?.[currentCanvasSize]) {
                delete draft.sharedBackgrounds[currentCanvasSize];
            }
        });
        setSelectedScreenIndices([]);
    }, [commitDoc, currentCanvasSize]);

    const reorderScreens = useCallback((fromIndex: number, toIndex: number) => {
        commitDoc('Reorder screens', (draft) => {
            const prev = draft.screensByCanvasSize[currentCanvasSize];
            if (!prev) return;

            if (fromIndex === toIndex) return;
            if (fromIndex < 0 || toIndex < 0) return;
            if (fromIndex >= prev.length || toIndex >= prev.length) return;

            const [moved] = prev.splice(fromIndex, 1);
            prev.splice(toIndex, 0, moved);

            const sharedBg = draft.sharedBackgrounds?.[currentCanvasSize];
            if (sharedBg) {
                sharedBg.screenIds = reorderScreenIds(sharedBg, prev);
            }
        });

        setSelectedScreenIndices((prevSel) => {
            const selectedIds = prevSel.map((i) => screens[i]?.id).filter(Boolean);
            if (selectedIds.length === 0) return prevSel;

            const next = [...screens];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);

            const idToIndex = new Map(next.map((s, i) => [s.id, i]));
            const remapped = selectedIds.map((id) => idToIndex.get(id)).filter((i): i is number => typeof i === 'number');

            return remapped.length > 0 ? remapped : prevSel;
        });
    }, [screens, currentCanvasSize, commitDoc]);

    return {
        screens,
        selectedScreenIndices,
        setSelectedScreenIndices,
        selectedFrameIndex,
        setSelectedFrameIndex,
        frameSelectionVisible,
        setFrameSelectionVisible,
        primarySelectedIndex,
        handleScreenSelect,
        addScreen,
        duplicateScreen,
        removeScreen,
        removeAllScreens,
        reorderScreens,
    };
}
