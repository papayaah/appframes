'use client';

import { useState, useEffect } from 'react';
import { Modal, Box, Text, SimpleGrid, Button, Checkbox, Loader, Center, Group } from '@mantine/core';
import { IconPhoto, IconCheck } from '@tabler/icons-react';

interface PexelsImage {
  name: string;
  url: string;
  size: number;
  modified: string;
}

interface PexelsImagePickerProps {
  opened: boolean;
  onClose: () => void;
  onImport: (files: File[]) => void;
}

export function PexelsImagePicker({ opened, onClose, onImport }: PexelsImagePickerProps) {
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (opened) {
      loadImages();
      setSelected(new Set());
    }
  }, [opened]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pexels-images');
      const data = await res.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading pexels images:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (url: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === images.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map(img => img.url)));
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;

    setImporting(true);
    try {
      const files: File[] = [];
      for (const url of selected) {
        const res = await fetch(url);
        const blob = await res.blob();
        const fileName = url.split('/').pop() || 'image.jpg';
        const file = new File([blob], fileName, { type: blob.type });
        files.push(file);
      }
      onImport(files);
      onClose();
    } catch (error) {
      console.error('Error importing images:', error);
      alert('Failed to import images');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPhoto size={20} />
          <Text fw={600}>Pexels Images</Text>
        </Group>
      }
      size="lg"
      styles={{
        body: { padding: 0 },
      }}
    >
      <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {images.length} images available • {selected.size} selected
          </Text>
          <Group gap="xs">
            <Button variant="subtle" size="xs" onClick={selectAll}>
              {selected.size === images.length ? 'Deselect All' : 'Select All'}
            </Button>
          </Group>
        </Group>
      </Box>

      <Box p="md" style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <Center p="xl">
            <Loader size="sm" />
          </Center>
        ) : images.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No images found in pexels_images folder</Text>
          </Center>
        ) : (
          <SimpleGrid cols={3} spacing="sm">
            {images.map((img) => (
              <Box
                key={img.url}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selected.has(img.url) ? '3px solid #667eea' : '1px solid #dee2e6',
                  transition: 'all 0.15s',
                }}
                onClick={() => toggleSelect(img.url)}
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
                <Checkbox
                  checked={selected.has(img.url)}
                  onChange={() => toggleSelect(img.url)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                  }}
                  styles={{
                    input: {
                      backgroundColor: selected.has(img.url) ? '#667eea' : 'rgba(255,255,255,0.9)',
                      borderColor: selected.has(img.url) ? '#667eea' : '#dee2e6',
                    },
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 6,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  }}
                >
                  <Text
                    size="xs"
                    c="white"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {img.name}
                  </Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleImport}
            loading={importing}
            disabled={selected.size === 0}
          >
            Import {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
