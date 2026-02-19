'use client';

import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';

interface UseAppFramesEventsProps {
    setAiSidebarOpen: (open: boolean) => void;
    setNavWidth: (width: number) => void;
}

export function useAppFramesEvents({
    setAiSidebarOpen,
    setNavWidth,
}: UseAppFramesEventsProps) {
    // Listen for AI sidebar open/close events
    useEffect(() => {
        const handleAISidebarOpen = () => {
            setAiSidebarOpen(true);
            setNavWidth(500); // 80 (rail) + 420 (AI sidebar)
        };
        const handleAISidebarClose = () => {
            setAiSidebarOpen(false);
            setNavWidth(80); // Back to rail only
        };

        window.addEventListener('ai-sidebar-open', handleAISidebarOpen);
        window.addEventListener('ai-sidebar-close', handleAISidebarClose);

        return () => {
            window.removeEventListener('ai-sidebar-open', handleAISidebarOpen);
            window.removeEventListener('ai-sidebar-close', handleAISidebarClose);
        };
    }, [setAiSidebarOpen, setNavWidth]);

    // Initialize persistence database
    useEffect(() => {
        const initPersistence = async () => {
            try {
                const { persistenceDB } = await import('../../../lib/PersistenceDB');
                await persistenceDB.init();
            } catch (error) {
                console.error('Failed to initialize persistence:', error);
                notifications.show({
                    title: 'Persistence Unavailable',
                    message: 'Your work will not be saved across sessions. The app will continue to work in memory-only mode.',
                    color: 'yellow',
                    autoClose: 10000,
                });
            }
        };

        initPersistence();
    }, []);
}
