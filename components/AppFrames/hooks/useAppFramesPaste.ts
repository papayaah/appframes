'use client';

import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Screen } from '../types';
import { handleMediaUpload, isEditableTarget } from '../mediaUtils';
import { getCompositionFrameCount } from '../FramesContext';

interface UseAppFramesPasteProps {
    screens: Screen[];
    addScreen: (mediaId: number) => void;
    replaceScreen: (screenIndex: number, mediaId: number, frameIndex: number) => void;
    setCanvasBackgroundMedia: (screenIndex: number, mediaId: number) => void;
    primarySelectedIndex: number;
    selectedFrameIndex: number;
    frameSelectionVisible: boolean;
}

export function useAppFramesPaste({
    screens,
    addScreen,
    replaceScreen,
    setCanvasBackgroundMedia,
    primarySelectedIndex,
    selectedFrameIndex,
    frameSelectionVisible,
}: UseAppFramesPasteProps) {
    useEffect(() => {
        const onPaste = async (e: ClipboardEvent) => {
            try {
                if (isEditableTarget(e.target)) return;

                const clipboard = e.clipboardData;
                if (!clipboard?.items?.length) return;

                const items = Array.from(clipboard.items);
                const imageItem = items.find(item => item.type?.startsWith('image/'));
                if (!imageItem) return;

                const pastedFile = imageItem.getAsFile();
                if (!pastedFile) return;

                e.preventDefault();

                const normalizedFile = pastedFile.name && pastedFile.name.trim().length > 0
                    ? pastedFile
                    : new File([pastedFile], `clipboard-${Date.now()}.png`, { type: pastedFile.type || 'image/png' });

                const mediaId = await handleMediaUpload(normalizedFile);
                if (!mediaId) {
                    notifications.show({
                        title: 'Paste failed',
                        message: 'Could not import the image from your clipboard.',
                        color: 'red',
                    });
                    return;
                }

                if (screens.length === 0) {
                    addScreen(mediaId);
                    return;
                }

                if (frameSelectionVisible) {
                    const targetScreen = screens[primarySelectedIndex];
                    const frameCount = targetScreen ? getCompositionFrameCount(targetScreen.settings.composition) : 1;
                    const safeFrameIndex = Math.max(0, Math.min(selectedFrameIndex, frameCount - 1));
                    replaceScreen(primarySelectedIndex, mediaId, safeFrameIndex);
                } else {
                    setCanvasBackgroundMedia(primarySelectedIndex, mediaId);
                }
            } catch (error) {
                console.error('Error handling paste:', error);
            }
        };

        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [addScreen, frameSelectionVisible, primarySelectedIndex, replaceScreen, screens, selectedFrameIndex, setCanvasBackgroundMedia]);
}
