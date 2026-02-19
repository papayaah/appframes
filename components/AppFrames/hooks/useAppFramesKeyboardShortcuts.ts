'use client';

import { useEffect, useRef } from 'react';
import { Screen, TextElement } from '../types';
import { isEditableTarget } from '../mediaUtils';

interface UseAppFramesKeyboardShortcutsProps {
    screens: Screen[];
    primarySelectedIndex: number;
    selectedFrameIndex: number;
    deleteTextElement: (screenId: string, textId: string) => void;
    clearFrameSlot: (screenIndex: number, frameIndex: number) => void;
    pasteTextElement: (screenId: string, textEl: TextElement) => void;
}

export function useAppFramesKeyboardShortcuts({
    screens,
    primarySelectedIndex,
    selectedFrameIndex,
    deleteTextElement,
    clearFrameSlot,
    pasteTextElement,
}: UseAppFramesKeyboardShortcutsProps) {
    const copiedTextElementRef = useRef<TextElement | null>(null);

    // Delete / Backspace
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;
            if (isEditableTarget(e.target)) return;

            const screen = screens[primarySelectedIndex];
            const selectedTextId = screen?.settings?.selectedTextId;
            if (!screen) return;

            if (selectedTextId) {
                e.preventDefault();
                deleteTextElement(screen.id, selectedTextId);
                return;
            }

            e.preventDefault();
            clearFrameSlot(primarySelectedIndex, selectedFrameIndex);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [deleteTextElement, primarySelectedIndex, screens, selectedFrameIndex, clearFrameSlot]);

    // Copy (Cmd/Ctrl+C)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey) || e.key !== 'c') return;
            if (isEditableTarget(e.target)) return;

            const screen = screens[primarySelectedIndex];
            const selectedTextId = screen?.settings?.selectedTextId;
            if (!screen || !selectedTextId) return;

            const textEl = screen.textElements?.find(t => t.id === selectedTextId);
            if (!textEl) return;

            copiedTextElementRef.current = { ...textEl, style: { ...textEl.style } };
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [primarySelectedIndex, screens]);

    // Paste Text (Cmd/Ctrl+V)
    useEffect(() => {
        const onKeyDown = async (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey) || e.key !== 'v') return;
            if (isEditableTarget(e.target)) return;
            if (!copiedTextElementRef.current) return;

            const screen = screens[primarySelectedIndex];
            if (!screen) return;

            try {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    if (item.types.some(t => t.startsWith('image/'))) return;
                }
            } catch {
                // Fallback
            }

            e.preventDefault();
            pasteTextElement(screen.id, copiedTextElementRef.current);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [pasteTextElement, primarySelectedIndex, screens]);
}
