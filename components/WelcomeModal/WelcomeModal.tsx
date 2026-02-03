'use client';

import { useEffect, useState } from 'react';
import {
  AspectRatio,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconDeviceMobile,
  IconPalette,
  IconRotate,
  IconDeviceFloppy,
  IconDownload,
  IconLayersIntersect,
} from '@tabler/icons-react';
import { persistenceDB } from '@/lib/PersistenceDB';

// Sample YouTube video - replace with actual demo video later
const DEMO_VIDEO_ID = 'dQw4w9WgXcQ';

// YouTube embed URL with autoplay, muted, no controls, looping
const getEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: <IconDeviceMobile size={20} />,
    title: 'Device Frames',
    description: 'Add realistic device frames to your screenshots',
  },
  {
    icon: <IconPalette size={20} />,
    title: 'DIY Customization',
    description: 'Build custom frames with bezel, cutout, and style options',
  },
  {
    icon: <IconLayersIntersect size={20} />,
    title: 'Multiple Screens',
    description: 'Organize screens by canvas size for different platforms',
  },
  {
    icon: <IconRotate size={20} />,
    title: 'Rotation & Scale',
    description: 'Transform frames with rotation and scaling controls',
  },
  {
    icon: <IconDownload size={20} />,
    title: 'Export Options',
    description: 'Export as PNG, JPG, or copy to clipboard',
  },
  {
    icon: <IconDeviceFloppy size={20} />,
    title: 'Auto-Save',
    description: 'Your work saves automatically, even offline',
  },
];

export function WelcomeModal() {
  const [opened, setOpened] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasCheckedPreference, setHasCheckedPreference] = useState(false);

  // Check if we should show the modal on mount
  useEffect(() => {
    const checkPreference = async () => {
      try {
        const appState = await persistenceDB.loadAppState();
        if (!appState?.hideWelcomeModal) {
          setOpened(true);
        }
      } catch (error) {
        // If we can't load state, show the modal
        setOpened(true);
      }
      setHasCheckedPreference(true);
    };

    checkPreference();
  }, []);

  const handleClose = async () => {
    // Save preference if checkbox is checked
    if (dontShowAgain) {
      try {
        await persistenceDB.saveAppState({ hideWelcomeModal: true });
      } catch (error) {
        console.error('Failed to save welcome modal preference:', error);
      }
    }
    setOpened(false);
  };

  // Don't render anything until we've checked the preference
  if (!hasCheckedPreference) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      withCloseButton={false}
      size="auto"
      padding={0}
      styles={{
        content: {
          maxWidth: 'min(900px, 90vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 12,
        },
        body: {
          padding: 0,
        },
      }}
      zIndex={1000}
    >
      <Stack gap={0}>
        {/* Dark wrapper: video + Key Features share same color scheme */}
        <Box
          bg="dark.7"
          style={{ borderRadius: '12px 12px 0 0' }}
          p="md"
          pb="lg"
        >
          {/* YouTube Video Embed - centered, proportioned */}
          <Box
            style={{
              width: 'min(800px, 85vw)',
              margin: '0 auto',
            }}
          >
            <AspectRatio ratio={16 / 9}>
              <iframe
                src={getEmbedUrl(DEMO_VIDEO_ID)}
                title="AppFrames Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0, borderRadius: 8 }}
              />
            </AspectRatio>
          </Box>

          {/* Key Features - same dark scheme as video area */}
          <Box mt="lg" px="xs">
            <Text fw={600} mb="sm" c="gray.2" size="sm" tt="uppercase" lts={0.5}>
              Key Features
            </Text>
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
              {features.map((feature, index) => (
                <Group key={index} gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon size="md" variant="light" color="gray">
                    {feature.icon}
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={600} lh={1.2} c="gray.2">
                      {feature.title}
                    </Text>
                    <Text size="xs" c="gray.5">
                      {feature.description}
                    </Text>
                  </Box>
                </Group>
              ))}
            </SimpleGrid>
          </Box>
        </Box>

        {/* Footer - subtle bar, same dark family */}
        <Box bg="dark.8" p="md" style={{ borderRadius: '0 0 12px 12px' }}>
          <Group justify="space-between">
            <Checkbox
              label="Don't show this again"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.currentTarget.checked)}
              color="gray"
              size="sm"
              styles={{
                label: { color: 'var(--mantine-color-gray-4)' },
              }}
            />
            <Button onClick={handleClose} variant="white" color="gray">
              Get Started
            </Button>
          </Group>
        </Box>
      </Stack>
    </Modal>
  );
}
