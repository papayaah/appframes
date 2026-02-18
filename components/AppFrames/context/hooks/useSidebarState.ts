
import { useState } from 'react';

export function useSidebarState() {
    const [sidebarTab, setSidebarTab] = useState<string>('layout');
    const [sidebarPanelOpen, setSidebarPanelOpen] = useState<boolean>(true);
    const [navWidth, setNavWidth] = useState<number>(300);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
    const [downloadJpegQuality, setDownloadJpegQuality] = useState<number>(90);

    return {
        sidebarTab,
        setSidebarTab,
        sidebarPanelOpen,
        setSidebarPanelOpen,
        navWidth,
        setNavWidth,
        downloadFormat,
        setDownloadFormat,
        downloadJpegQuality,
        setDownloadJpegQuality,
    };
}
