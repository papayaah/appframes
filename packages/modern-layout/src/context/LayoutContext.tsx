'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import type {
    LayoutShellConfig,
    LayoutState,
    LayoutActions,
    LayoutComponentPreset,
    LayoutIcons,
} from '../types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<LayoutShellConfig> = {
    collapsedNavWidth: 80,
    expandedNavWidth: 360,
    settingsPanelWidth: 320,
    headerHeight: 45,
    mobileBreakpoint: 768,
    persistState: true,
    storageKeyPrefix: 'modern-layout',
};

// ============================================================================
// Context Types
// ============================================================================

interface LayoutContextValue extends LayoutState, LayoutActions {
    config: Required<LayoutShellConfig>;
    preset: LayoutComponentPreset | null;
    icons: LayoutIcons;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

export interface LayoutProviderProps {
    children: ReactNode;
    /** Layout configuration */
    config?: LayoutShellConfig;
    /** Component preset for headless UI */
    preset?: LayoutComponentPreset | null;
    /** Icon set */
    icons?: LayoutIcons;
    /** Initial active tab */
    initialActiveTab?: string | null;
    /** Initial left panel open state */
    initialLeftPanelOpen?: boolean;
    /** Initial settings panel open state */
    initialSettingsPanelOpen?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

export function LayoutProvider({
    children,
    config: userConfig,
    preset = null,
    icons = {},
    initialActiveTab = null,
    initialLeftPanelOpen = false,
    initialSettingsPanelOpen = false,
}: LayoutProviderProps) {
    const config = useMemo(() => ({
        ...DEFAULT_CONFIG,
        ...userConfig,
    }), [userConfig]);

    const { isMobile } = useResponsiveLayout({
        breakpoint: config.mobileBreakpoint,
    });

    // Load persisted state
    const loadPersistedState = useCallback(() => {
        if (!config.persistState || typeof window === 'undefined') {
            return null;
        }
        try {
            const stored = localStorage.getItem(`${config.storageKeyPrefix}-state`);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch {
            // Ignore storage errors
        }
        return null;
    }, [config.persistState, config.storageKeyPrefix]);

    const persisted = loadPersistedState();

    // State
    const [navWidth, setNavWidth] = useState(
        persisted?.navWidth ?? (initialLeftPanelOpen ? config.expandedNavWidth : config.collapsedNavWidth)
    );
    const [leftPanelOpen, setLeftPanelOpen] = useState(
        persisted?.leftPanelOpen ?? initialLeftPanelOpen
    );
    const [activeTabId, setActiveTabId] = useState<string | null>(
        persisted?.activeTabId ?? initialActiveTab
    );
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(
        persisted?.settingsPanelOpen ?? initialSettingsPanelOpen
    );
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileDrawerTab, setMobileDrawerTab] = useState<string | null>(null);

    // Persist state changes
    useEffect(() => {
        if (!config.persistState || typeof window === 'undefined') return;

        try {
            localStorage.setItem(`${config.storageKeyPrefix}-state`, JSON.stringify({
                navWidth,
                leftPanelOpen,
                activeTabId,
                settingsPanelOpen,
            }));
        } catch {
            // Ignore storage errors
        }
    }, [config.persistState, config.storageKeyPrefix, navWidth, leftPanelOpen, activeTabId, settingsPanelOpen]);

    // Actions
    const toggleLeftPanel = useCallback((tabId?: string) => {
        if (tabId) {
            if (activeTabId === tabId && leftPanelOpen) {
                // Same tab clicked while open - close panel
                setLeftPanelOpen(false);
                setNavWidth(config.collapsedNavWidth);
            } else {
                // Different tab or panel closed - open with this tab
                setActiveTabId(tabId);
                setLeftPanelOpen(true);
                setNavWidth(config.expandedNavWidth);
            }
        } else {
            // No tab specified - just toggle
            setLeftPanelOpen((prev: boolean) => {
                const next = !prev;
                setNavWidth(next ? config.expandedNavWidth : config.collapsedNavWidth);
                return next;
            });
        }
    }, [activeTabId, leftPanelOpen, config.collapsedNavWidth, config.expandedNavWidth]);

    const toggleSettingsPanel = useCallback(() => {
        setSettingsPanelOpen((prev: boolean) => !prev);
    }, []);

    // Context value
    const value = useMemo<LayoutContextValue>(() => ({
        // Config
        config,
        preset,
        icons,

        // State
        navWidth,
        leftPanelOpen,
        activeTabId,
        settingsPanelOpen,
        isMobile,
        mobileDrawerOpen,
        mobileDrawerTab,

        // Actions
        setNavWidth,
        setLeftPanelOpen,
        setActiveTabId,
        toggleLeftPanel,
        setSettingsPanelOpen,
        toggleSettingsPanel,
        setMobileDrawerOpen,
        setMobileDrawerTab,
    }), [
        config,
        preset,
        icons,
        navWidth,
        leftPanelOpen,
        activeTabId,
        settingsPanelOpen,
        isMobile,
        mobileDrawerOpen,
        mobileDrawerTab,
        toggleLeftPanel,
        toggleSettingsPanel,
    ]);

    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useLayout(): LayoutContextValue {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}

// Internal export for direct context access (advanced use cases)
export const LayoutContextInternal = LayoutContext;
