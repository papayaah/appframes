'use client';

import { useEffect } from 'react';

export function useUndoRedoHotkeys(options: {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isEditableTarget: (target: EventTarget | null) => boolean;
}) {
  const { undo, redo, canUndo, canRedo, isEditableTarget } = options;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
        return;
      }

      if (key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canRedo, canUndo, isEditableTarget, redo, undo]);
}

