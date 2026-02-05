'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Stack, Select, Slider, Group, Tooltip } from '@mantine/core';
import { IconLayout, IconDeviceMobile, IconPhoto, IconTypography, IconSettings, IconStack } from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { DeviceTab } from './DeviceTab';
import { TextTab } from './TextTab';
import { LayersTab } from './LayersTab';
import { MediaLibrary } from './MediaLibrary';
import { CanvasSettings, Screen } from './AppFrames';

interface SidebarTabsProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
  selectedFrameIndex?: number;
  onMediaSelect?: (mediaId: number) => void;
  onPanelToggle?: (isOpen: boolean, animate?: boolean) => void;
  downloadFormat: 'png' | 'jpg';
  onDownloadFormatChange: (format: 'png' | 'jpg') => void;
  downloadJpegQuality: number;
  onDownloadJpegQualityChange: (quality: number) => void;
}

type TabId = 'layout' | 'device' | 'text' | 'layers' | 'media' | 'settings';

const tabs: { id: TabId; icon: typeof IconLayout; label: string }[] = [
  { id: 'layout', icon: IconLayout, label: 'Layout' },
  { id: 'device', icon: IconDeviceMobile, label: 'Frame' },
  { id: 'text', icon: IconTypography, label: 'Text' },
  { id: 'layers', icon: IconStack, label: 'Layers' },
  { id: 'media', icon: IconPhoto, label: 'Media' },
  { id: 'settings', icon: IconSettings, label: 'Settings' },
];

const TRANSITION = 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease';

export function SidebarTabs({
  settings,
  setSettings,
  screens,
  selectedFrameIndex = 0,
  onMediaSelect,
  onPanelToggle,
  downloadFormat,
  onDownloadFormatChange,
  downloadJpegQuality,
  onDownloadJpegQualityChange,
}: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [animate, setAnimate] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);
  const activeTabRef = useRef<TabId | null>(null);
  const isPinnedRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleTabClick = useCallback((tabId: TabId) => {
    clearHoverTimeout();

    const currentActiveTab = activeTabRef.current;
    const currentIsPinned = isPinnedRef.current;

    // Clicking the same tab that's already pinned = close/unpin
    if (currentActiveTab === tabId && currentIsPinned) {
      isPinnedRef.current = false;
      activeTabRef.current = null;
      setAnimate(true);
      setActiveTab(null);
      setIsPinned(false);
      onPanelToggle?.(false, true);
      return;
    }

    const isNewPanel = currentActiveTab === null;
    // Animate only when opening from collapsed (toggle), not when pinning from hover
    const shouldAnimate = isNewPanel;

    activeTabRef.current = tabId;
    isPinnedRef.current = true;

    setAnimate(shouldAnimate);
    setActiveTab(tabId);
    setIsPinned(true);

    if (!currentIsPinned) {
      onPanelToggle?.(true, shouldAnimate);
    }
  }, [clearHoverTimeout, onPanelToggle]);

  const handleTabHover = useCallback((tabId: TabId) => {
    if (isPinnedRef.current) return;
    clearHoverTimeout();
    isHoveringRef.current = true;
    activeTabRef.current = tabId;
    setActiveTab(tabId);
  }, [clearHoverTimeout]);

  const handleTabLeave = useCallback(() => {
    if (isPinnedRef.current) return;
    isHoveringRef.current = false;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current && !isPinnedRef.current) {
        setActiveTab(null);
      }
    }, 300);
  }, []);

  const handlePanelHover = useCallback(() => {
    if (isPinnedRef.current) return;
    clearHoverTimeout();
    isHoveringRef.current = true;
  }, [clearHoverTimeout]);

  const handlePanelLeave = useCallback(() => {
    if (isPinnedRef.current) return;
    isHoveringRef.current = false;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current && !isPinnedRef.current) {
        setActiveTab(null);
      }
    }, 200);
  }, []);

  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const handleNotchMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    // Floating (non-pinned) panel: just close on click, no drag
    if (!isPinnedRef.current) {
      clearHoverTimeout();
      activeTabRef.current = null;
      setActiveTab(null);
      return;
    }

    dragStartXRef.current = e.clientX;
    didDragRef.current = false;

    const panel = panelRef.current;
    const sidebar = sidebarRef.current;
    const navbar = sidebar?.parentElement;
    const mainEl = navbar?.parentElement?.querySelector('main') as HTMLElement | null;

    // Panel becomes absolute so it slides rigidly (no flex squish).
    // Icon rail has higher z-index, so panel slides behind it.
    if (panel) {
      panel.style.position = 'absolute';
      panel.style.left = '80px';
      panel.style.top = '0';
      panel.style.height = '100%';
      panel.style.transition = 'none';
      panel.style.willChange = 'transform';
    }
    // clip-path: clip left overflow (panel behind icon rail) but allow
    // notch to protrude ~20px past the right edge
    if (sidebar) {
      sidebar.style.clipPath = 'inset(0 -20px 0 0)';
      sidebar.style.transition = 'none';
    }
    if (navbar) navbar.style.transition = 'none';
    if (mainEl) mainEl.style.transition = 'none';
    document.body.style.cursor = 'grabbing';

    // Helper to strip every inline override we touch
    const cleanUpAll = () => {
      if (panel) {
        panel.style.position = '';
        panel.style.left = '';
        panel.style.top = '';
        panel.style.height = '';
        panel.style.transform = '';
        panel.style.transition = '';
        panel.style.willChange = '';
      }
      if (sidebar) {
        sidebar.style.clipPath = '';
        sidebar.style.width = '';
        sidebar.style.minWidth = '';
        sidebar.style.maxWidth = '';
        sidebar.style.transition = '';
      }
      if (navbar) {
        navbar.style.width = '';
        navbar.style.minWidth = '';
        navbar.style.maxWidth = '';
        navbar.style.transition = '';
      }
      if (mainEl) {
        mainEl.style.paddingLeft = '';
        mainEl.style.paddingInlineStart = '';
        mainEl.style.transition = '';
      }
    };

    const setWidth = (w: string) => {
      for (const el of [sidebar, navbar]) {
        if (!el) continue;
        el.style.width = w;
        el.style.minWidth = w;
        el.style.maxWidth = w;
      }
      if (mainEl) {
        mainEl.style.paddingLeft = w;
        mainEl.style.paddingInlineStart = w;
      }
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (dragStartXRef.current === null) return;
      const delta = Math.min(0, moveEvent.clientX - dragStartXRef.current);
      if (delta < -4) didDragRef.current = true;

      // Slide panel left (rigid, no squish)
      if (panel) panel.style.transform = `translateX(${delta}px)`;

      // Shrink sidebar + navbar + main padding so canvas follows
      setWidth(`${Math.max(80, 360 + delta)}px`);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';

      const delta = dragStartXRef.current !== null
        ? Math.min(0, upEvent.clientX - dragStartXRef.current)
        : 0;
      dragStartXRef.current = null;

      const dur = '0.2s';
      const widthTrans = `width ${dur} ease, min-width ${dur} ease, max-width ${dur} ease`;
      const padTrans = `padding-left ${dur} ease, padding-inline-start ${dur} ease`;

      const onTransitionDone = (cb: () => void) => {
        const fallback = setTimeout(cb, 300);
        const handler = () => { clearTimeout(fallback); cb(); };
        sidebar?.addEventListener('transitionend', handler, { once: true });
      };

      if (delta < -60 || !didDragRef.current) {
        // Past threshold or plain click → close.
        // Hide panel instantly, strip drag overrides, and let React
        // close the sidebar with its normal CSS transition (same path
        // as clicking a tab icon to toggle).
        if (panel) panel.style.visibility = 'hidden';
        cleanUpAll();

        clearHoverTimeout();
        isPinnedRef.current = false;
        activeTabRef.current = null;
        setAnimate(true);
        setActiveTab(null);
        setIsPinned(false);
        onPanelToggle?.(false, true);
      } else {
        // Snap back to fully open
        if (panel) {
          panel.style.transition = `transform 0.15s ease`;
          panel.style.transform = 'translateX(0)';
        }
        for (const el of [sidebar, navbar]) {
          if (!el) continue;
          el.style.transition = widthTrans;
        }
        if (mainEl) mainEl.style.transition = padTrans;
        setWidth('360px');

        onTransitionDone(() => cleanUpAll());
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [clearHoverTimeout, onPanelToggle]);

  const renderPanelContent = (tabId: TabId) => {
    switch (tabId) {
      case 'layout':
        return <Sidebar settings={settings} setSettings={setSettings} screens={screens} />;
      case 'device':
        return <DeviceTab />;
      case 'text':
        return <TextTab />;
      case 'layers':
        return <LayersTab />;
      case 'media':
        return (
          <MediaLibrary
            onSelectMedia={(mediaId) => onMediaSelect && onMediaSelect(mediaId)}
            selectedSlot={settings.selectedScreenIndex}
          />
        );
      case 'settings':
        return (
          <Box style={{ height: '100%', overflow: 'auto' }} className="scroll-on-hover">
            <Stack gap="md" p="md">
              <Text fw={700}>Download</Text>
              <Select
                label="Format"
                description="PNG can preserve transparency; JPG flattens the image (no alpha)."
                value={downloadFormat}
                onChange={(v) => {
                  if (v === 'png' || v === 'jpg') onDownloadFormatChange(v);
                }}
                data={[
                  { value: 'png', label: 'PNG (transparency supported)' },
                  { value: 'jpg', label: 'JPG (no transparency)' },
                ]}
              />
              {downloadFormat === 'jpg' && (
                <Box>
                  <Group justify="space-between" mb={6}>
                    <Text size="sm" fw={600}>JPG quality</Text>
                    <Text size="sm" c="dimmed">{downloadJpegQuality}</Text>
                  </Group>
                  <Slider
                    value={downloadJpegQuality}
                    onChange={onDownloadJpegQualityChange}
                    min={0}
                    max={100}
                    step={1}
                    label={(v) => `${v}`}
                  />
                </Box>
              )}
              <Text size="xs" c="dimmed">
                Tip: App Store screenshot uploads often reject alpha. Use JPG or set a solid Background Color.
              </Text>
            </Stack>
          </Box>
        );
    }
  };

  const sidebarWidth = isPinned && activeTab ? 360 : 80;

  return (
    <Box ref={sidebarRef} style={{ display: 'flex', width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth, height: '100%', position: 'relative', flexShrink: 0, transition: animate ? TRANSITION : 'none' }}>
      {/* Icon Rail */}
      <Box
        style={{
          width: 80,
          height: '100%',
          borderRight: '1px solid #E5E7EB',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <Tooltip key={id} label={label} position="right" withArrow>
              <Box
                onClick={() => handleTabClick(id)}
                onMouseEnter={() => handleTabHover(id)}
                onMouseLeave={handleTabLeave}
                style={{
                  width: 64,
                  height: 64,
                  padding: 0,
                  borderRadius: 8,
                  backgroundColor: isActive
                    ? isPinned
                      ? '#f0f0ff'
                      : '#f5f5f5'
                    : 'transparent',
                  color: isActive
                    ? isPinned
                      ? '#667eea'
                      : '#444'
                    : '#666',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={24} />
                <Text size="xs">{label}</Text>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Floating/Pinned Panel */}
      {activeTab && (
        <Box
          ref={panelRef}
          onMouseEnter={handlePanelHover}
          onMouseLeave={handlePanelLeave}
          style={{
            width: 280,
            height: '100%',
            position: isPinned ? 'relative' : 'absolute',
            left: isPinned ? 0 : 80,
            top: 0,
            zIndex: isPinned ? 1 : 200,
            backgroundColor: 'white',
            borderRight: '1px solid #E5E7EB',
            boxShadow: isPinned ? 'none' : '4px 0 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel Content */}
          <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }} className="scroll-on-hover">
            {renderPanelContent(activeTab)}
          </Box>

          {/* Notch handle — drag or click to close */}
          <Box
            onMouseDown={handleNotchMouseDown}
            style={{
              position: 'absolute',
              right: -10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 12,
              height: 44,
              borderRadius: 6,
              backgroundColor: 'var(--notch-bg, #E8EAF0)',
              border: '1px solid var(--notch-border, #D1D5DB)',
              boxShadow: 'var(--notch-shadow, 0 1px 3px rgba(0,0,0,0.06))',
              cursor: 'grab',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = '#667eea';
              el.style.borderColor = '#5a6fd6';
              el.style.boxShadow = '0 2px 8px rgba(102,126,234,0.3)';
              el.querySelectorAll<HTMLElement>('[data-grip]').forEach(d => d.style.backgroundColor = 'rgba(255,255,255,0.7)');
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = '#E8EAF0';
              el.style.borderColor = '#D1D5DB';
              el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
              el.querySelectorAll<HTMLElement>('[data-grip]').forEach(d => d.style.backgroundColor = '#B0B5C0');
            }}
          >
            {[0, 1, 2].map(i => (
              <Box
                key={i}
                data-grip=""
                style={{
                  width: 6,
                  height: 1.5,
                  borderRadius: 1,
                  backgroundColor: '#B0B5C0',
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
