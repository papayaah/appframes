
import { useCallback } from 'react';
import { TextElement, Screen, TextStyle } from '../../types';
import { UndoableDoc } from '../types';
import { clamp01, normalizeRotation, createDefaultTextElement, getMaxZIndex } from '../utils';

export function useTextOperations(
    doc: UndoableDoc,
    commitDoc: (label: string, updator: (draft: UndoableDoc) => void) => void,
    mutateDoc: (updator: (draft: UndoableDoc) => void) => void,
    currentCanvasSize: string,
    primarySelectedIndex: number,
) {

    const commitCurrentScreens = useCallback((label: string, updater: (screensDraft: Screen[]) => void) => {
        commitDoc(label, (draft) => {
            if (!draft.screensByCanvasSize[currentCanvasSize]) draft.screensByCanvasSize[currentCanvasSize] = [];
            updater(draft.screensByCanvasSize[currentCanvasSize]!);
        });
    }, [commitDoc, currentCanvasSize]);

    // Helper for text selection logic which spans across screens/sizes
    const clearSelectionGlobally = useCallback((draft: UndoableDoc) => {
        Object.values(draft.screensByCanvasSize).forEach((screens) => {
            screens.forEach((screen) => {
                if (screen.settings.selectedTextId) {
                    screen.settings.selectedTextId = undefined;
                }
            });
        });
    }, []);

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
            // Simple heuristic for label
            if (updates.content !== undefined) return 'Edit text content';
            if (updates.rotation !== undefined) return 'Rotate text';
            if (updates.x !== undefined || updates.y !== undefined) return 'Move text';
            return 'Edit text';
        };

        commitCurrentScreens(labelForUpdate(), (list) => {
            const screen = list.find((s) => s.id === screenId);
            if (!screen) return;
            const els = screen.textElements ?? [];
            const idx = els.findIndex((t) => t.id === textId);
            if (idx === -1) return;
            const t = els[idx];

            const newContent = typeof updates.content === 'string' ? updates.content : t.content;
            const newName = typeof updates.name === 'string' ? updates.name : t.name;

            // Sync logic
            const isCurrentlySynced = /^(Text|Double-click to edit)(\s+\d+)?$/i.test(t.name) || t.name === t.content || !t.name;
            let finalContent = newContent;
            let finalName = newName;

            if (updates.content !== undefined && isCurrentlySynced) {
                finalName = updates.content;
            } else if (updates.name !== undefined && isCurrentlySynced) {
                finalContent = updates.name;
            }
            if (updates.name === '') {
                finalName = finalContent;
            }

            els[idx] = {
                ...t,
                ...updates,
                content: finalContent,
                name: finalName,
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
        mutateDoc((draft) => {
            clearSelectionGlobally(draft);

            if (textId !== null) {
                // Assume selection is for the primary selected screen on current canvas
                const list = draft.screensByCanvasSize[currentCanvasSize] || [];
                const screen = list[primarySelectedIndex];
                if (screen) {
                    screen.settings.selectedTextId = textId;
                }
            }
        });
    }, [mutateDoc, clearSelectionGlobally, currentCanvasSize, primarySelectedIndex]);

    const selectTextElementOnScreen = useCallback((screenIndex: number, textId: string | null) => {
        mutateDoc((draft) => {
            clearSelectionGlobally(draft);

            if (textId) {
                const list = draft.screensByCanvasSize[currentCanvasSize] || [];
                const screen = list[screenIndex];
                if (screen) {
                    screen.settings.selectedTextId = textId;
                }
            }
        });
    }, [mutateDoc, clearSelectionGlobally, currentCanvasSize]);

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
                id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                name: `${source.name} Copy`,
                x: clamp01(source.x + 2),
                y: clamp01(source.y + 2),
            };
            existing.splice(idx + 1, 0, copy);
            screen.textElements = existing.map((t, i) => ({ ...t, zIndex: i + 1 }));
            screen.settings = { ...screen.settings, selectedTextId: copy.id };
        });
    }, [commitCurrentScreens]);

    const pasteTextElement = useCallback((targetScreenId: string, source: TextElement) => {
        commitCurrentScreens('Paste text', (list) => {
            const screen = list.find((s) => s.id === targetScreenId);
            if (!screen) return;
            const existing = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
            const copy: TextElement = {
                ...source,
                style: { ...source.style },
                id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                name: `${source.name} Copy`,
                x: clamp01(source.x + 2),
                y: clamp01(source.y + 2),
                zIndex: getMaxZIndex(existing) + 1,
            };
            existing.push(copy);
            screen.textElements = existing.map((t, i) => ({ ...t, zIndex: i + 1 }));
            screen.settings = { ...screen.settings, selectedTextId: copy.id };
        });
    }, [commitCurrentScreens]);

    return {
        addTextElement,
        updateTextElement,
        deleteTextElement,
        reorderTextElements,
        selectTextElement,
        selectTextElementOnScreen,
        duplicateTextElement,
        pasteTextElement,
    };
}
