'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Tabs, Text, ThemeIcon } from '@mantine/core';
import { IconLayout, IconDeviceMobile, IconPhoto, IconTypography, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { DeviceTab } from './DeviceTab';
import { TextTab } from './TextTab';
import { MediaLibrary } from './MediaLibrary';
import { CanvasSettings, Screen } from './AppFrames';

interface SidebarTabsProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
  selectedFrameIndex?: number;
  onFrameDeviceChange?: (frameIndex: number, deviceFrame: string) => void;
  onMediaSelect?: (mediaId: number) => void;
  onPanelToggle?: (isOpen: boolean) => void;
}

export function SidebarTabs({ 
  settings, 
  setSettings, 
  screens, 
  selectedFrameIndex = 0,
  onFrameDeviceChange,
  onMediaSelect, 
  onPanelToggle 
}: SidebarTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Extract tab from pathname (e.g., "/layout" -> "layout", "/" -> "layout")
  const currentTab = pathname === '/' ? 'layout' : pathname.replace('/', '');
  const tab = ['layout', 'device', 'text', 'media'].includes(currentTab) ? currentTab : 'layout';

  const handleTabChange = (value: string | null) => {
    if (value) {
      router.push(`/${value}`, { scroll: false });
      if (!isPanelOpen) {
        setIsPanelOpen(true);
        onPanelToggle?.(true);
      }
    }
  };

  const togglePanel = () => {
    const newState = !isPanelOpen;
    setIsPanelOpen(newState);
    onPanelToggle?.(newState);
  };

  return (
    <Box style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      <Tabs 
        value={tab} 
        onChange={handleTabChange} 
        orientation="vertical"
        variant="pills"
        style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'row',
          width: '100%'
        }}
      >
        <Tabs.List 
          style={{ 
            width: 80, // Fixed width rail
            borderRight: '1px solid #E5E7EB',
            backgroundColor: 'white',
            flexDirection: 'column',
            padding: '16px 0',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Tabs.Tab 
            value="layout" 
            style={{ 
              width: 64,
              height: 64,
              padding: 0,
              borderRadius: 8,
              backgroundColor: tab === 'layout' ? '#f8f9ff' : 'transparent',
              color: tab === 'layout' ? '#667eea' : '#666',
              border: 'none',
            }}
          >
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', height: '100%' }}>
              <IconLayout size={24} />
              <Text size="xs">Layout</Text>
            </Box>
          </Tabs.Tab>
          
          <Tabs.Tab 
            value="device" 
            style={{ 
              width: 64,
              height: 64,
              padding: 0,
              borderRadius: 8,
              backgroundColor: tab === 'device' ? '#f8f9ff' : 'transparent',
              color: tab === 'device' ? '#667eea' : '#666',
              border: 'none',
            }}
          >
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', height: '100%' }}>
              <IconDeviceMobile size={24} />
              <Text size="xs">Device</Text>
            </Box>
          </Tabs.Tab>
          
          <Tabs.Tab 
            value="text" 
            style={{ 
              width: 64,
              height: 64,
              padding: 0,
              borderRadius: 8,
              backgroundColor: tab === 'text' ? '#f8f9ff' : 'transparent',
              color: tab === 'text' ? '#667eea' : '#666',
              border: 'none',
            }}
          >
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', height: '100%' }}>
              <IconTypography size={24} />
              <Text size="xs">Text</Text>
            </Box>
          </Tabs.Tab>
          
          <Tabs.Tab 
            value="media" 
            style={{ 
              width: 64,
              height: 64,
              padding: 0,
              borderRadius: 8,
              backgroundColor: tab === 'media' ? '#f8f9ff' : 'transparent',
              color: tab === 'media' ? '#667eea' : '#666',
              border: 'none',
            }}
          >
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', height: '100%' }}>
              <IconPhoto size={24} />
              <Text size="xs">Media</Text>
            </Box>
          </Tabs.Tab>
        </Tabs.List>

        {isPanelOpen && (
          <Box style={{ flex: 1, overflow: 'hidden', position: 'relative', borderRight: '1px solid #E5E7EB' }}>
            <Tabs.Panel value="layout" style={{ height: '100%' }}>
              <Sidebar settings={settings} setSettings={setSettings} screens={screens} />
            </Tabs.Panel>

            <Tabs.Panel value="device" style={{ height: '100%' }}>
              <DeviceTab 
                settings={settings} 
                setSettings={setSettings}
                selectedFrameIndex={selectedFrameIndex}
                onFrameDeviceChange={onFrameDeviceChange}
                screens={screens}
              />
            </Tabs.Panel>

            <Tabs.Panel value="text" style={{ height: '100%' }}>
              <TextTab />
            </Tabs.Panel>

            <Tabs.Panel value="media" style={{ height: '100%' }}>
              <MediaLibrary
                onSelectMedia={(mediaId) => onMediaSelect && onMediaSelect(mediaId)}
                selectedSlot={settings.selectedScreenIndex}
              />
            </Tabs.Panel>
          </Box>
        )}
      </Tabs>

      {/* Notch / Pullout Handle */}
      <Box
        onClick={togglePanel}
        style={{
          position: 'absolute',
          right: -16, // Protrude into main area
          top: '50%',
          transform: 'translateY(-50%)',
          width: 16,
          height: 48,
          backgroundColor: '#white',
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          border: '1px solid #E5E7EB',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
          background: 'white'
        }}
      >
        {isPanelOpen ? <IconChevronLeft size={12} /> : <IconChevronRight size={12} />}
      </Box>
    </Box>
  );
}
