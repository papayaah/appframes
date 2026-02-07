import { useState, useCallback, useRef, useEffect } from 'react';
import type { UsePanelStateOptions, UsePanelStateReturn } from '../types';

/**
 * Hook for managing panel open/close state with hover preview and pin support.
 *
 * Features:
 * - Hover preview: Panel shows on hover, auto-hides after delay
 * - Pin mode: Click to pin panel open permanently
 * - Configurable delays for smooth UX
 * - Optional localStorage persistence
 *
 * @example
 * ```tsx
 * const panel = usePanelState({ hoverDelay: 200, hideDelay: 300 });
 *
 * <IconButton
 *   onMouseEnter={panel.onMouseEnter}
 *   onMouseLeave={panel.onMouseLeave}
 *   onClick={panel.togglePin}
 * />
 *
 * {panel.isOpen && <Panel onClose={panel.close} />}
 * ```
 */
export function usePanelState(options: UsePanelStateOptions = {}): UsePanelStateReturn {
    const {
        defaultOpen = false,
        defaultPinned = false,
        hoverDelay = 0,
        hideDelay = 200,
        storageKey,
    } = options;

    // Load initial state from storage if available
    const getInitialState = useCallback(() => {
        if (storageKey && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return {
                        isOpen: parsed.isOpen ?? defaultOpen,
                        isPinned: parsed.isPinned ?? defaultPinned,
                    };
                }
            } catch {
                // Ignore storage errors
            }
        }
        return { isOpen: defaultOpen, isPinned: defaultPinned };
    }, [storageKey, defaultOpen, defaultPinned]);

    const initial = getInitialState();
    const [isOpen, setIsOpen] = useState(initial.isOpen);
    const [isPinned, setIsPinned] = useState(initial.isPinned);
    const [isHovering, setIsHovering] = useState(false);

    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Persist state changes
    useEffect(() => {
        if (storageKey && typeof window !== 'undefined') {
            try {
                localStorage.setItem(storageKey, JSON.stringify({ isOpen, isPinned }));
            } catch {
                // Ignore storage errors
            }
        }
    }, [isOpen, isPinned, storageKey]);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    const open = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        // Don't close if pinned
        if (!isPinned) {
            setIsOpen(false);
        }
        setIsHovering(false);
    }, [isPinned]);

    const toggle = useCallback(() => {
        setIsOpen((prev: boolean) => !prev);
    }, []);

    const pin = useCallback(() => {
        setIsPinned(true);
        setIsOpen(true);
    }, []);

    const unpin = useCallback(() => {
        setIsPinned(false);
    }, []);

    const togglePin = useCallback(() => {
        if (isPinned) {
            setIsPinned(false);
            // Optionally close when unpinning
            // setIsOpen(false);
        } else {
            setIsPinned(true);
            setIsOpen(true);
        }
    }, [isPinned]);

    const onMouseEnter = useCallback(() => {
        // Clear any pending hide
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        setIsHovering(true);

        // Show with delay if not already open
        if (!isOpen) {
            if (hoverDelay > 0) {
                hoverTimeoutRef.current = setTimeout(() => {
                    setIsOpen(true);
                }, hoverDelay);
            } else {
                setIsOpen(true);
            }
        }
    }, [isOpen, hoverDelay]);

    const onMouseLeave = useCallback(() => {
        // Clear any pending show
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        setIsHovering(false);

        // Don't hide if pinned
        if (isPinned) return;

        // Hide with delay
        if (hideDelay > 0) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsOpen(false);
            }, hideDelay);
        } else {
            setIsOpen(false);
        }
    }, [isPinned, hideDelay]);

    return {
        isOpen,
        isPinned,
        isHovering,
        open,
        close,
        toggle,
        pin,
        unpin,
        togglePin,
        onMouseEnter,
        onMouseLeave,
    };
}
