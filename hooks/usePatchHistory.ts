'use client';

import { useCallback, useMemo, useState } from 'react';
import { applyPatches, enablePatches, produce, produceWithPatches, type Draft, type Patch } from 'immer';

enablePatches();

export type PatchHistoryEntry = {
  label: string;
  at: number;
  patches: Patch[];
  inversePatches: Patch[];
};

type InitialState<S> = S | (() => S);

const resolveInitial = <S,>(initial: InitialState<S>): S =>
  typeof initial === 'function' ? (initial as () => S)() : initial;

export function usePatchHistory<S extends object>(
  initialState: InitialState<S>,
  options?: { maxHistory?: number }
) {
  const maxHistory = options?.maxHistory ?? 100;
  const [state, setState] = useState<S>(() => resolveInitial(initialState));
  const [past, setPast] = useState<PatchHistoryEntry[]>([]);
  const [future, setFuture] = useState<PatchHistoryEntry[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const position = past.length;
  const transitionCount = past.length + future.length;

  const decodeJsonPointerSegment = (seg: string) => seg.replace(/~1/g, '/').replace(/~0/g, '~');

  const patchPathSegments = (p: Patch): string[] => {
    const path: unknown = (p as any).path;
    if (Array.isArray(path)) return path.map((s) => String(s));
    if (typeof path === 'string') {
      // JSON Pointer (RFC6901) format: "/a/b/0"
      return path
        .split('/')
        .filter(Boolean)
        .map(decodeJsonPointerSegment);
    }
    return [];
  };

  const deriveLabel = useCallback((fallback: string, patches: Patch[]): string => {
    const base = (fallback || '').trim();
    const normalizedBase = base.length > 0 ? base : 'Edit';

    // If caller provided something specific, keep it.
    if (normalizedBase !== 'Edit screens') return normalizedBase;

    const segs = patches.flatMap(patchPathSegments);

    const has = (needle: string) => segs.includes(needle);

    if (has('textElements')) return 'Edit text';
    if (has('selectedTextId')) return 'Select text';

    if (has('canvasBackgroundMediaId')) return 'Change canvas background';
    if (has('backgroundColor')) return 'Change background color';
    if (has('composition')) return 'Change composition';
    if (has('orientation')) return 'Change orientation';

    // Screen list changes
    const touchedScreensArray = patches.some((p) => patchPathSegments(p).includes('screensByCanvasSize'));
    if (touchedScreensArray) {
      const adds = patches.filter((p) => p.op === 'add').length;
      const removes = patches.filter((p) => p.op === 'remove').length;
      if (adds > 0 && removes === 0) return 'Add screen';
      if (removes > 0 && adds === 0) return 'Delete screen';
      if (adds > 0 && removes > 0) return 'Reorder screens';
    }

    if (has('images')) {
      if (has('mediaId') || has('image')) return 'Replace media';
      if (has('deviceFrame')) return 'Change device frame';
      if (has('panX') || has('panY')) return 'Pan media';
      if (has('frameX') || has('frameY')) return 'Move frame';
      if (has('frameScale')) return 'Scale frame';
      if (has('rotateZ')) return 'Rotate frame';
      return 'Edit frame';
    }

    if (has('name')) return 'Rename';

    return normalizedBase;
  }, []);

  const commit = useCallback(
    (label: string, updater: (draft: Draft<S>) => void) => {
      setState((prev) => {
        const [next, patches, inversePatches] = produceWithPatches(prev, (draft: Draft<S>) => {
          updater(draft);
        });

        if (patches.length === 0) return prev;

        setPast((prevPast) => {
          const derived = deriveLabel(label, patches as Patch[]);
          const entry: PatchHistoryEntry = {
            label: derived,
            at: Date.now(),
            patches: patches as Patch[],
            inversePatches: inversePatches as Patch[],
          };
          const nextPast = [...prevPast, entry];
          return nextPast.length > maxHistory ? nextPast.slice(nextPast.length - maxHistory) : nextPast;
        });

        setFuture([]);
        return next as S;
      });
    },
    [deriveLabel, maxHistory]
  );

  // Update state without creating an undo history entry (useful for transient UI state).
  const mutate = useCallback((updater: (draft: Draft<S>) => void) => {
    setState((prev) => produce(prev, updater) as S);
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const entry = prevPast[prevPast.length - 1];
      setState((cur) => applyPatches(cur, entry.inversePatches) as unknown as S);
      setFuture((prevFuture) => [entry, ...prevFuture]);
      return prevPast.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const entry = prevFuture[0];
      setState((cur) => applyPatches(cur, entry.patches) as unknown as S);
      setPast((prevPast) => {
        const nextPast = [...prevPast, entry];
        return nextPast.length > maxHistory ? nextPast.slice(nextPast.length - maxHistory) : nextPast;
      });
      return prevFuture.slice(1);
    });
  }, [maxHistory]);

  const reset = useCallback((nextState: S) => {
    setState(nextState);
    setPast([]);
    setFuture([]);
  }, []);

  // Jump to an absolute position in the timeline.
  // Positions are between transitions:
  // - 0 = initial state
  // - N = state after N transitions
  const goTo = useCallback((nextPosition: number) => {
    const clamped = Math.max(0, Math.min(transitionCount, nextPosition));
    if (clamped === position) return;

    let nextState = state;
    let nextPast = past;
    let nextFuture = future;

    while (nextPast.length > clamped) {
      const entry = nextPast[nextPast.length - 1];
      nextState = applyPatches(nextState, entry.inversePatches) as unknown as S;
      nextFuture = [entry, ...nextFuture];
      nextPast = nextPast.slice(0, -1);
    }

    while (nextPast.length < clamped) {
      const entry = nextFuture[0];
      if (!entry) break;
      nextState = applyPatches(nextState, entry.patches) as unknown as S;
      nextPast = [...nextPast, entry];
      nextFuture = nextFuture.slice(1);
    }

    setState(nextState);
    setPast(nextPast);
    setFuture(nextFuture);
  }, [future, past, position, state, transitionCount]);

  return useMemo(
    () => ({
      state,
      setState,
      commit,
      mutate,
      undo,
      redo,
      canUndo,
      canRedo,
      position,
      transitionCount,
      reset,
      goTo,
      past,
      future,
    }),
    [canRedo, canUndo, commit, future, goTo, mutate, past, position, redo, reset, state, transitionCount, undo]
  );
}

