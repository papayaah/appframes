import { useState, useEffect, useCallback } from 'react';
import type { UseResponsiveLayoutOptions, UseResponsiveLayoutReturn } from '../types';

const DEFAULT_MOBILE_BREAKPOINT = 768;
const DEFAULT_TABLET_BREAKPOINT = 1024;

/**
 * Hook for responsive layout detection with SSR safety.
 *
 * Features:
 * - Mobile/tablet/desktop detection
 * - Debounced resize handling
 * - SSR-safe (defaults to desktop)
 * - Callback on breakpoint changes
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet } = useResponsiveLayout({
 *   breakpoint: 768,
 *   onChange: (isMobile) => console.log('Mobile:', isMobile),
 * });
 *
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 */
export function useResponsiveLayout(
    options: UseResponsiveLayoutOptions = {}
): UseResponsiveLayoutReturn {
    const {
        breakpoint = DEFAULT_MOBILE_BREAKPOINT,
        onChange,
    } = options;

    // SSR-safe initial state (default to desktop)
    const getInitialState = () => {
        if (typeof window === 'undefined') {
            return {
                width: 1200,
                height: 800,
                isMobile: false,
                isTablet: false,
                isDesktop: true,
            };
        }
        const width = window.innerWidth;
        const height = window.innerHeight;
        return {
            width,
            height,
            isMobile: width < breakpoint,
            isTablet: width >= breakpoint && width < DEFAULT_TABLET_BREAKPOINT,
            isDesktop: width >= DEFAULT_TABLET_BREAKPOINT,
        };
    };

    const [state, setState] = useState(getInitialState);

    const handleResize = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < breakpoint;
        const isTablet = width >= breakpoint && width < DEFAULT_TABLET_BREAKPOINT;
        const isDesktop = width >= DEFAULT_TABLET_BREAKPOINT;

        setState(prev => {
            // Only trigger onChange if mobile state changed
            if (prev.isMobile !== isMobile && onChange) {
                onChange(isMobile);
            }

            return {
                width,
                height,
                isMobile,
                isTablet,
                isDesktop,
            };
        });
    }, [breakpoint, onChange]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Initial measurement
        handleResize();

        // Debounced resize handler
        let rafId: number | null = null;
        const debouncedResize = () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                handleResize();
                rafId = null;
            });
        };

        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [handleResize]);

    return state;
}
