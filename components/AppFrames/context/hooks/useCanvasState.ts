
import { useState, useCallback } from 'react';
import { UndoableDoc } from '../types';
import {
    getCanvasDimensions,
    inferDeviceTypeFromCanvasSize
} from '../utils';
import { Screen, ScreenImage, TextElement, SharedBackground } from '../../types';
import { getDefaultDIYOptions } from '../../diy-frames/types';
import {
    reorderScreenIds as reorderIds,
    insertScreenIdInOrder as insertId,
    createDefaultSharedBackground as createSharedBg
} from '../../sharedBackgroundUtils';

export function useCanvasState(
    doc: UndoableDoc,
    commitDoc: (label: string, updator: (draft: UndoableDoc) => void) => void,
    resetSelection: () => void,
) {
    const [currentCanvasSize, setCurrentCanvasSize] = useState<string>('iphone-6.9');
    const [zoom, setZoom] = useState<number>(100);

    const switchCanvasSize = useCallback((newSize: string, settingsOverrides?: Record<string, unknown>) => {
        setCurrentCanvasSize(newSize);

        commitDoc('Switch canvas size', (draft) => {
            if (!draft.screensByCanvasSize[newSize]) draft.screensByCanvasSize[newSize] = [];

            const screens = draft.screensByCanvasSize[newSize];
            screens.forEach(screen => {
                screen.settings = {
                    ...screen.settings,
                    canvasSize: newSize,
                    ...(settingsOverrides || {})
                };
            });
        });

        resetSelection();
    }, [commitDoc, resetSelection]);

    const copyScreensToCanvasSize = useCallback((targetCanvasSize: string) => {
        const sourceCanvasSize = currentCanvasSize;
        const sourceScreens = doc.screensByCanvasSize[sourceCanvasSize];

        if (!sourceScreens || sourceScreens.length === 0) return;
        if (targetCanvasSize === sourceCanvasSize) return;

        // Determine device types for frame adaptation
        const sourceDeviceType = inferDeviceTypeFromCanvasSize(sourceCanvasSize);
        const targetDeviceType = inferDeviceTypeFromCanvasSize(targetCanvasSize);
        const deviceTypeChanged = sourceDeviceType !== targetDeviceType;

        // Calculate height ratio for proportional scaling
        const sourceDims = getCanvasDimensions(sourceCanvasSize, 'portrait');
        const targetDims = getCanvasDimensions(targetCanvasSize, 'portrait');
        const heightRatio = targetDims.height / sourceDims.height;

        const adaptedScreens: Screen[] = sourceScreens.map((src) => {
            const adaptedImages: ScreenImage[] = (src.images || []).map((img) => {
                if (!img) return {};

                const adapted: ScreenImage = {
                    ...img,
                    diyOptions: img.diyOptions ? { ...img.diyOptions } : undefined,
                    frameEffects: img.frameEffects ? { ...img.frameEffects } : undefined,
                    frameX: (img.frameX ?? 0) * heightRatio,
                    frameY: (img.frameY ?? 0) * heightRatio,
                    frameScale: (img.frameScale ?? 100) * heightRatio,
                    tiltX: img.tiltX,
                    tiltY: img.tiltY,
                    rotateZ: img.rotateZ,
                };

                if (deviceTypeChanged) {
                    if (!targetDeviceType) {
                        adapted.diyOptions = undefined;
                        adapted.cleared = true;
                    } else {
                        adapted.diyOptions = getDefaultDIYOptions(targetDeviceType);
                        adapted.cleared = false;
                    }
                }
                return adapted;
            });

            const adaptedTextElements: TextElement[] = (src.textElements || []).map((el) => {
                const style = { ...el.style };
                if (style.fontSize) style.fontSize *= heightRatio;
                if (typeof style.lineHeight === 'number') style.lineHeight *= heightRatio;
                if (style.letterSpacing) style.letterSpacing *= heightRatio;

                return {
                    ...el,
                    id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    style,
                };
            });

            return {
                id: `screen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                images: adaptedImages,
                name: src.name,
                settings: {
                    ...src.settings,
                    canvasSize: targetCanvasSize,
                    selectedTextId: undefined,
                    screenScale: 0,
                    screenPanX: 50,
                    screenPanY: 50,
                },
                textElements: adaptedTextElements,
            };
        });

        commitDoc('Copy screens to canvas size', (draft) => {
            if (!draft.screensByCanvasSize[targetCanvasSize]) {
                draft.screensByCanvasSize[targetCanvasSize] = [];
            }
            draft.screensByCanvasSize[targetCanvasSize].push(...adaptedScreens);
        });

        setCurrentCanvasSize(targetCanvasSize);
        resetSelection();
    }, [commitDoc, doc.screensByCanvasSize, currentCanvasSize, resetSelection]);

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
        const size = currentCanvasSize;
        const allScreens = doc.screensByCanvasSize[size] || [];
        const existing = doc.sharedBackgrounds?.[size];

        if (!existing) {
            commitDoc('Enable shared background', (draft) => {
                if (!draft.sharedBackgrounds) draft.sharedBackgrounds = {};
                draft.sharedBackgrounds[size] = createSharedBg([screenId]);
            });
            return;
        }

        const isInGroup = existing.screenIds.includes(screenId);

        if (isInGroup) {
            const newIds = existing.screenIds.filter(id => id !== screenId);
            commitDoc('Remove screen from shared background', (draft) => {
                if (draft.sharedBackgrounds?.[size]) {
                    draft.sharedBackgrounds[size].screenIds = newIds;
                }
            });
        } else {
            const newIds = insertId(existing.screenIds, screenId, allScreens);
            commitDoc('Add screen to shared background', (draft) => {
                if (draft.sharedBackgrounds?.[size]) {
                    draft.sharedBackgrounds[size].screenIds = newIds;
                }
            });
        }
    }, [commitDoc, doc.screensByCanvasSize, doc.sharedBackgrounds, currentCanvasSize]);

    return {
        currentCanvasSize,
        setCurrentCanvasSize,
        zoom,
        setZoom,
        switchCanvasSize,
        copyScreensToCanvasSize,
        setSharedBackground,
        toggleScreenInSharedBackground,
    };
}
