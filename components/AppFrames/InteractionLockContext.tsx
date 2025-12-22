'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type LockState =
  | { active: false }
  | { active: true; token: string; ownerKey: string; kind: string };

interface InteractionLockApi {
  /** True if any manipulation gesture is currently active anywhere in the canvas UI. */
  isLocked: boolean;
  /** If locked, which element owns the gesture (unique key). */
  activeOwnerKey: string | null;
  /** Begin a gesture for `ownerKey`. Returns a token to end it. */
  begin: (ownerKey: string, kind: string) => string;
  /** End a gesture previously started via `begin(token)`. */
  end: (token: string) => void;
  /** Convenience: is the current lock held by this owner? */
  isOwnerActive: (ownerKey: string) => boolean;
}

const InteractionLockContext = createContext<InteractionLockApi | null>(null);

const createToken = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function InteractionLockProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LockState>({ active: false });
  const stateRef = useRef<LockState>(state);
  stateRef.current = state;

  const begin = useCallback((ownerKey: string, kind: string) => {
    const token = createToken();
    setState({ active: true, token, ownerKey, kind });
    return token;
  }, []);

  const end = useCallback((token: string) => {
    const current = stateRef.current;
    if (current.active && current.token === token) {
      setState({ active: false });
    }
  }, []);

  const isOwnerActive = useCallback((ownerKey: string) => {
    const current = stateRef.current;
    return current.active && current.ownerKey === ownerKey;
  }, []);

  const value = useMemo<InteractionLockApi>(() => {
    return {
      isLocked: state.active,
      activeOwnerKey: state.active ? state.ownerKey : null,
      begin,
      end,
      isOwnerActive,
    };
  }, [begin, end, isOwnerActive, state.active, state.active ? (state as any).ownerKey : null]);

  return <InteractionLockContext.Provider value={value}>{children}</InteractionLockContext.Provider>;
}

export function useInteractionLock(): InteractionLockApi {
  const ctx = useContext(InteractionLockContext);
  if (!ctx) throw new Error('useInteractionLock must be used within InteractionLockProvider');
  return ctx;
}


