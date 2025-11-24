'use client';

import { useState, useEffect } from 'react';
import { Box, Text, SimpleGrid, ActionIcon, Loader, Center } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconX, IconUpload } from '@tabler/icons-react';
import { db, MediaFile } from '../../lib/db';
import { OPFSManager } from '../../lib/opfs';

interface MediaLibraryProps {
  onSelectMedia: (mediaId: number) => void;
  selectedSlot?: number;
}

export function MediaLibrary({ onSelectMedia, selectedSlot }: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMedia();
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

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        // Save to OPFS
        const fileName = `${Date.now()}-${file.name}`;
        await OPFSManager.saveFile(fileName, file);

        // Create thumbnail
        const thumbnail = await createThumbnail(file);

        // Get image dimensions
        const img = await createImageBitmap(file);
        const width = img.width;
        const height = img.height;

        // Save metadata to IndexedDB
        await db.mediaFiles.add({
          name: file.name,
          fileHandle: fileName,
          thumbnail,
          width,
          height,
          size: file.size,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await loadMedia();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, fileHandle: string) => {
    try {
      await db.mediaFiles.delete(id);
      await OPFSManager.deleteFile(fileHandle);
      await loadMedia();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  if (loading) {
    return (
      <Center p="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Box p="md">
      <Box mb="xs">
        <Text size="sm" fw={700} mb={4}>
          Media
        </Text>
        {selectedSlot !== undefined && (
          <Text size="xs" c="dimmed">
            APPLIES TO SLOT {selectedSlot + 1}
          </Text>
        )}
      </Box>

      <Dropzone
        onDrop={handleDrop}
        accept={IMAGE_MIME_TYPE}
        loading={uploading}
        style={{
          border: '2px dashed #dee2e6',
          borderRadius: 8,
          padding: 0,
          minHeight: 'auto',
          marginBottom: 16,
        }}
      >
        <Center p="md">
          <Box style={{ textAlign: 'center' }}>
            <IconUpload size={24} color="#868e96" style={{ margin: '0 auto 8px' }} />
            <Text size="sm" fw={500} c="dimmed">
              Click to Upload
            </Text>
            <Text size="xs" c="dimmed">
              or drag and drop
            </Text>
          </Box>
        </Center>
      </Dropzone>

      <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
        Library
      </Text>

      <SimpleGrid cols={2} spacing="xs">
        {mediaFiles.map((media) => (
          <Box
            key={media.id}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid #dee2e6',
              transition: 'all 0.2s',
            }}
            onClick={() => media.id && onSelectMedia(media.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.transform = 'scale(1.02)';
              const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
              if (deleteBtn) deleteBtn.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#dee2e6';
              e.currentTarget.style.transform = 'scale(1)';
              const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
              if (deleteBtn) deleteBtn.style.opacity = '0';
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
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('mediaId', String(media.id));
              }}
            />
            <ActionIcon
              size="xs"
              color="red"
              variant="filled"
              className="delete-btn"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              onClick={(e) => {
                e.stopPropagation();
                media.id && handleDelete(media.id, media.fileHandle);
              }}
            >
              <IconX size={12} />
            </ActionIcon>
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 4,
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
                {media.name}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
