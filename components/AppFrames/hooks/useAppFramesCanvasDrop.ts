'use client';

import { notifications } from '@mantine/notifications';
import { Screen } from '../types';
import { handleMediaUpload } from '../mediaUtils';
import { getCompositionFrameCount } from '../FramesContext';

interface UseAppFramesCanvasDropProps {
    screens: Screen[];
    setScreens: (action: (prevScreens: Screen[]) => Screen[]) => void;
    primarySelectedIndex: number;
    setCanvasBackgroundMedia: (screenIndex: number, mediaId: number) => void;
}

export function useAppFramesCanvasDrop({
    screens,
    setScreens,
    primarySelectedIndex,
    setCanvasBackgroundMedia,
}: UseAppFramesCanvasDropProps) {
    const handleReplaceScreen = async (files: File[], targetFrameIndex?: number, targetScreenIndex?: number) => {
        try {
            const screenIndex = targetScreenIndex !== undefined ? targetScreenIndex : primarySelectedIndex;
            const targetScreen = screens[screenIndex];

            if (!targetScreen) return;

            const layoutFrameCount = getCompositionFrameCount(targetScreen.settings.composition);

            const uploadPromises = files.map(file => handleMediaUpload(file));
            const mediaIds = await Promise.all(uploadPromises);

            const validMediaIds = mediaIds.filter((id): id is number => typeof id === 'number');
            const failedCount = mediaIds.length - validMediaIds.length;
            if (failedCount > 0) {
                notifications.show({
                    title: 'Some uploads failed',
                    message: `Failed to import ${failedCount} file${failedCount === 1 ? '' : 's'} into your media library.`,
                    color: 'red',
                });
            }

            const effectiveTargetFrameIndex =
                targetFrameIndex === undefined && files.length > 1 ? 0 : targetFrameIndex;
            if (targetFrameIndex == null && files.length <= 1) {
                const backgroundMediaId = validMediaIds[0];
                if (!backgroundMediaId) return;
                setCanvasBackgroundMedia(screenIndex, backgroundMediaId);
                return;
            }

            const filesToProcess = Math.min(validMediaIds.length, layoutFrameCount);

            setScreens(prevScreens => {
                const updated = [...prevScreens];
                if (!updated[screenIndex]) return prevScreens;

                const screen = updated[screenIndex];
                const newImages = [...screen.images];

                while (newImages.length < layoutFrameCount) {
                    newImages.push({});
                }

                const startIndex = Math.max(0, Math.min(effectiveTargetFrameIndex ?? 0, layoutFrameCount - 1));
                const orderedIndices = Array.from({ length: layoutFrameCount }, (_, i) => (startIndex + i) % layoutFrameCount);
                const isEmptySlot = (img: any) =>
                    img?.cleared === true || img?.deviceFrame === '' || (!img?.mediaId && !img?.image);

                if (filesToProcess <= 0) {
                    return updated;
                }

                if (files.length <= 1) {
                    const mediaId = validMediaIds[0];
                    if (typeof mediaId === 'number') {
                        newImages[startIndex] = { ...newImages[startIndex], mediaId, image: undefined, cleared: false };
                    }
                } else {
                    const toFill = validMediaIds.slice(0, filesToProcess);
                    const emptyIndices = orderedIndices.filter((idx) => isEmptySlot(newImages[idx]));
                    const filled = new Set<number>();

                    let cursor = 0;
                    for (const idx of emptyIndices) {
                        const mediaId = toFill[cursor];
                        if (mediaId == null) break;
                        newImages[idx] = { ...newImages[idx], mediaId, image: undefined, cleared: false };
                        filled.add(idx);
                        cursor += 1;
                        if (cursor >= toFill.length) break;
                    }
                    for (const idx of orderedIndices) {
                        if (cursor >= toFill.length) break;
                        if (filled.has(idx)) continue;
                        const mediaId = toFill[cursor];
                        newImages[idx] = { ...newImages[idx], mediaId, image: undefined, cleared: false };
                        cursor += 1;
                    }
                }

                updated[screenIndex] = {
                    ...screen,
                    images: newImages,
                };

                return updated;
            });

        } catch (error) {
            console.error('Error processing dropped files:', error);
            const msg = error instanceof Error ? error.message : String(error);
            notifications.show({
                title: 'Drop failed',
                message: msg || 'Failed to process images. Please try again.',
                color: 'red',
            });
        }
    };

    return { handleReplaceScreen };
}
