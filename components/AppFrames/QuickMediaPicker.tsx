'use client';

import { useState, useEffect } from 'react';
import { Box, Text, SimpleGrid, Loader, Center, Tabs, ScrollArea } from '@mantine/core';
import { IconPhoto, IconCloud } from '@tabler/icons-react';
import { db, MediaFile } from '../../lib/db';

interface PexelsImage {
  name: string;
  url: string;
}

interface QuickMediaPickerProps {
  onSelectMedia: (mediaId: number) => void;
  onSelectPexels: (url: string) => void;
  onClose: () => void;
}

export function QuickMediaPicker({ onSelectMedia, onSelectPexels, onClose }: QuickMediaPickerProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [pexelsImages, setPexelsImages] = useState<PexelsImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('library');

  useEffect(() => {
    loadMedia();
    loadPexels();
  }, []);

  const loadMedia = async () => {
    try {
      const files = await db.mediaFiles.toArray();
      setMediaFiles(files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPexels = async () => {
    try {
      const res = await fetch('/api/pexels-images');
      const data = await res.json();
      setPexelsImages(data.images || []);
    } catch (error) {
      console.error('Error loading pexels:', error);
    }
  };

  const handleMediaClick = (mediaId: number) => {
    onSelectMedia(mediaId);
    onClose();
  };

  const handlePexelsClick = (url: string) => {
    onSelectPexels(url);
    onClose();
  };

  return (
    <Box
      style={{
        width: 280,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="library" leftSection={<IconPhoto size={14} />}>
            Library
          </Tabs.Tab>
          <Tabs.Tab value="pexels" leftSection={<IconCloud size={14} />}>
            Pexels
          </Tabs.Tab>
        </Tabs.List>

        <ScrollArea h={200}>
          <Tabs.Panel value="library" p="xs">
            {loading ? (
              <Center p="md">
                <Loader size="sm" />
              </Center>
            ) : mediaFiles.length === 0 ? (
              <Center p="md">
                <Text size="xs" c="dimmed">No images in library</Text>
              </Center>
            ) : (
              <SimpleGrid cols={3} spacing={6}>
                {mediaFiles.map((media) => (
                  <Box
                    key={media.id}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #e9ecef',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => media.id && handleMediaClick(media.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={media.thumbnail}
                      alt={media.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="pexels" p="xs">
            {pexelsImages.length === 0 ? (
              <Center p="md">
                <Text size="xs" c="dimmed">No pexels images</Text>
              </Center>
            ) : (
              <SimpleGrid cols={3} spacing={6}>
                {pexelsImages.map((img) => (
                  <Box
                    key={img.url}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #e9ecef',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => handlePexelsClick(img.url)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </ScrollArea>
      </Tabs>
    </Box>
  );
}
