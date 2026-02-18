
import { useCallback } from 'react';
import { Screen, FrameEffects, ScreenImage, BackgroundEffects } from '../../types';
import { UndoableDoc } from '../types';
import { getCompositionFrameCount, clampFrameTransform } from '../utils';
import { DIYOptions, getDefaultDIYOptions } from '../../diy-frames/types';

export function useFrameOperations(
    commitDoc: (label: string, updator: (draft: UndoableDoc) => void) => void,
    mutateDoc: (updator: (draft: UndoableDoc) => void) => void,
    currentCanvasSize: string,
) {

    const commitCurrentScreens = useCallback((label: string, updater: (screensDraft: Screen[]) => void) => {
        commitDoc(label, (draft) => {
            if (!draft.screensByCanvasSize[currentCanvasSize]) draft.screensByCanvasSize[currentCanvasSize] = [];
            updater(draft.screensByCanvasSize[currentCanvasSize]!);
        });
    }, [commitDoc, currentCanvasSize]);

    const mutateCurrentScreens = useCallback((updater: (screensDraft: Screen[]) => void) => {
        mutateDoc((draft) => {
            if (!draft.screensByCanvasSize[currentCanvasSize]) draft.screensByCanvasSize[currentCanvasSize] = [];
            updater(draft.screensByCanvasSize[currentCanvasSize]!);
        });
    }, [mutateDoc, currentCanvasSize]);

    const replaceScreen = useCallback((index: number, imageOrMediaId: string | number, imageSlotIndex: number = 0) => {
        commitCurrentScreens('Replace media', (list) => {
            const screen = list[index];
            if (!screen) return;
            const frameCount = getCompositionFrameCount(screen.settings.composition);
            if (!screen.images) screen.images = [];
            while (screen.images.length < frameCount) screen.images.push({ diyOptions: getDefaultDIYOptions('phone') });
            if (imageSlotIndex < screen.images.length) {
                const existing = screen.images[imageSlotIndex] || {};
                if (typeof imageOrMediaId === 'number') {
                    screen.images[imageSlotIndex] = { ...existing, mediaId: imageOrMediaId, image: undefined };
                } else {
                    screen.images[imageSlotIndex] = { ...existing, image: imageOrMediaId, mediaId: undefined };
                }
            }
        });
    }, [commitCurrentScreens]);

    const addFrameSlot = useCallback((screenIndex: number) => {
        commitCurrentScreens('Add frame', (list) => {
            const s = list[screenIndex];
            // Note: primarySelectedIndex is handled by caller to pass correct screenIndex
            if (!s) return;

            const currentComposition = s.settings?.composition ?? 'single';
            const currentCount = getCompositionFrameCount(currentComposition);
            if (currentCount >= 3) return;

            const nextComposition =
                currentComposition === 'single' ? 'dual'
                    : currentComposition === 'dual' || currentComposition === 'stack' ? 'triple'
                        : 'triple'; // fan is max 3 too?

            const nextCount = getCompositionFrameCount(nextComposition);

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
    }, [commitCurrentScreens]);

    const clearFrameSlot = useCallback((screenIndex: number, frameIndex: number) => {
        commitCurrentScreens('Clear frame', (list) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            const existing = screen.images[frameIndex] || {};
            screen.images[frameIndex] = {
                ...existing,
                diyOptions: existing.diyOptions,
                diyTemplateId: existing.diyTemplateId,
                cleared: true,
                image: undefined,
                mediaId: undefined,
                panX: undefined,
                panY: undefined,
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

    const setFramePan = useCallback((screenIndex: number, frameIndex: number, panX: number, panY: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), panX, panY };
        };
        if (persistent) commitCurrentScreens('Pan media', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

    const setFramePosition = useCallback((screenIndex: number, frameIndex: number, frameX: number, frameY: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameX, frameY };
        };
        if (persistent) commitCurrentScreens('Move frame', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

    const setFrameScale = useCallback((screenIndex: number, frameIndex: number, frameScale: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameScale };
        };
        if (persistent) commitCurrentScreens('Scale frame', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

    const setFrameRotate = useCallback((screenIndex: number, frameIndex: number, rotateZ: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), rotateZ };
        };
        if (persistent) commitCurrentScreens('Rotate frame', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

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

    const setFrameEffects = useCallback((screenIndex: number, frameIndex: number, frameEffects: FrameEffects) => {
        commitCurrentScreens('Change frame effects', (list) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), frameEffects };
        });
    }, [commitCurrentScreens]);

    const setImageRotation = useCallback((screenIndex: number, frameIndex: number, imageRotation: number) => {
        commitCurrentScreens('Rotate image', (list) => {
            const screen = list[screenIndex];
            if (!screen) return;
            if (!screen.images) screen.images = [];
            while (screen.images.length <= frameIndex) screen.images.push({});
            const normalizedRotation = ((imageRotation % 360) + 360) % 360;
            screen.images[frameIndex] = { ...(screen.images[frameIndex] || {}), imageRotation: normalizedRotation };
        });
    }, [commitCurrentScreens]);

    // Background Operations
    const setCanvasBackgroundMedia = useCallback((screenIndex: number, mediaId: number | undefined) => {
        commitCurrentScreens('Set background', (list) => {
            const screen = list[screenIndex];
            if (screen) {
                screen.settings.canvasBackgroundMediaId = mediaId;
            }
        });
    }, [commitCurrentScreens]);

    const setBackgroundPan = useCallback((screenIndex: number, panX: number, panY: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (screen) {
                screen.settings = { ...screen.settings, screenPanX: panX, screenPanY: panY };
            }
        };
        if (persistent) commitCurrentScreens('Pan background', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

    const setBackgroundRotation = useCallback((screenIndex: number, rotation: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (screen) {
                screen.settings = { ...screen.settings, backgroundRotation: rotation };
            }
        };
        if (persistent) commitCurrentScreens('Rotate background', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

    const setBackgroundScale = useCallback((screenIndex: number, scale: number, persistent = true) => {
        const update = (list: Screen[]) => {
            const screen = list[screenIndex];
            if (screen) {
                screen.settings = { ...screen.settings, backgroundScale: scale };
            }
        };
        if (persistent) commitCurrentScreens('Scale background', update);
        else mutateCurrentScreens(update);
    }, [commitCurrentScreens, mutateCurrentScreens]);

    const applyBackgroundEffectsToAll = useCallback((effects: BackgroundEffects) => {
        commitCurrentScreens('Apply effects to all', (list) => {
            list.forEach(screen => {
                screen.settings.backgroundEffects = { ...effects };
            });
        });
    }, [commitCurrentScreens]);

    return {
        replaceScreen,
        addFrameSlot,
        clearFrameSlot,
        setFrameDIYOptions,
        setFramePan,
        setFramePosition,
        setFrameScale,
        setFrameRotate,
        setFrameTilt,
        setFrameColor,
        setFrameEffects,
        setImageRotation,
        setCanvasBackgroundMedia,
        setBackgroundPan,
        setBackgroundRotation,
        setBackgroundScale,
        applyBackgroundEffectsToAll,
    };
}
