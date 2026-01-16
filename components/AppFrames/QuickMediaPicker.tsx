'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  FileButton,
  Image,
  Loader,
  Modal,
  Skeleton,
  Stack,
  SimpleGrid,
  Text,
  TextInput,
  UnstyledButton,
  Tabs,
  ScrollArea,
} from '@mantine/core';
import { Select } from '@mantine/core';
import { IconCloud, IconColumns, IconFile, IconFileText, IconLayoutGrid, IconMusic, IconPhoto, IconSearch, IconTrash, IconUpload, IconVideo, IconX, IconZoomIn } from '@tabler/icons-react';
import type { ComponentPreset } from '@reactkits.dev/react-media-library';
import { MediaLibraryProvider, RecentMediaGrid } from '@reactkits.dev/react-media-library';

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
  const [pexelsImages, setPexelsImages] = useState<PexelsImage[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('library');

  const loadPexels = useCallback(async () => {
    try {
      const res = await fetch('/api/pexels-images');
      const data = await res.json();
      setPexelsImages(data.images || []);
    } catch (error) {
      console.error('Error loading pexels:', error);
    }
  }, []);

  const handlePexelsClick = (url: string) => {
    onSelectPexels(url);
    onClose();
  };

  const preset = useMemo<ComponentPreset>(
    () => ({
      Card: ({ children, onClick, selected, className, style }) => (
        <Card
          shadow="sm"
          padding="md"
          radius="md"
          withBorder
          onClick={onClick}
          className={className}
          style={{
            cursor: onClick ? 'pointer' : 'default',
            borderColor: selected ? 'var(--mantine-color-violet-6)' : undefined,
            borderWidth: selected ? 2 : 1,
            transition: 'all 0.15s',
            ...style,
          }}
        >
          {children}
        </Card>
      ),

      Button: ({ children, onClick, variant = 'primary', disabled, loading, size = 'md', fullWidth, leftIcon, className, ...rest }) => {
        const variantMap = {
          primary: 'filled',
          secondary: 'light',
          danger: 'filled',
          outline: 'outline',
        } as const;

        return (
          <Button
            onClick={onClick}
            variant={variantMap[variant]}
            color={variant === 'danger' ? 'red' : 'violet'}
            disabled={disabled}
            loading={loading}
            size={size}
            fullWidth={fullWidth}
            leftSection={leftIcon}
            className={className}
            {...rest}
          >
            {children}
          </Button>
        );
      },

      TextInput: ({ value, onChange, placeholder, type, leftIcon, className }) => (
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          leftSection={leftIcon}
          className={className}
        />
      ),

      Select: ({ value, onChange, options, placeholder, label, 'aria-label': ariaLabel, className }) => (
        <Select
          value={value}
          onChange={(val) => onChange(val || '')}
          placeholder={placeholder}
          label={label}
          aria-label={!label ? (ariaLabel || placeholder) : undefined}
          data={options}
          className={className}
        />
      ),

      Checkbox: ({ checked, onChange, label, className }) => (
        <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} label={label} className={className} />
      ),

      Badge: ({ children, variant = 'default', className }) => {
        const variantMap = {
          default: 'light',
          primary: 'filled',
          secondary: 'outline',
        } as const;
        return (
          <Badge variant={variantMap[variant]} size="sm" className={className}>
            {children}
          </Badge>
        );
      },

      Image: ({ src, alt, className, onLoad, style, loading, decoding }) => (
        <Image
          src={src}
          alt={alt}
          className={className}
          style={style}
          fit="cover"
          w="100%"
          h="100%"
          loading={loading}
          decoding={decoding}
          onLoad={onLoad}
        />
      ),

      Modal: ({ isOpen, onClose, title, children }) => (
        <Modal opened={isOpen} onClose={onClose} title={title} size="xl">
          {children}
        </Modal>
      ),

      Loader: ({ size = 'md', className }) => <Loader size={size} className={className} />,

      EmptyState: ({ icon, message, className }) => (
        <Center p="xl" className={className}>
          <Stack align="center" gap="md">
            {icon}
            <Text c="dimmed">{message}</Text>
          </Stack>
        </Center>
      ),

      FileButton: ({ onSelect, multiple, disabled, children }) => (
        <FileButton onChange={(files) => files && onSelect(Array.isArray(files) ? files : [files])} multiple={multiple} disabled={disabled}>
          {(props) => <div {...props}>{children}</div>}
        </FileButton>
      ),

      Grid: ({ children, className, columns = 3, gap = '6px' }) => (
        <div
          className={className}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap,
          }}
        >
          {children}
        </div>
      ),

      Skeleton: ({ className }) => <Skeleton className={className} style={{ width: '100%', height: '100%' }} />,

      UploadCard: ({ onClick, isDragging, className, children }) => (
        <UnstyledButton
          onClick={onClick}
          className={className}
          style={{
            height: '100%',
            width: '100%',
            minHeight: 120,
            border: `2px dashed ${isDragging ? 'var(--mantine-color-violet-6)' : 'var(--mantine-color-gray-4)'}`,
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: isDragging ? 'var(--mantine-color-violet-0)' : 'transparent',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </UnstyledButton>
      ),

      Viewer: ({ isOpen, onClose, main, sidebar, actions }: any) => (
        <Modal opened={isOpen} onClose={onClose} fullScreen withCloseButton={false} padding={0} styles={{ body: { height: '100vh', display: 'flex' } }}>
          <div
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: 'var(--mantine-color-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {main}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>{actions}</div>
          </div>
          <div
            style={{
              width: 250,
              borderLeft: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
              backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))' }}>
              <Text fw={500} c="dimmed" size="sm">
                Library
              </Text>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>{sidebar}</div>
          </div>
        </Modal>
      ),

      ViewerThumbnail: ({ src, alt, selected, onClick }: any) => (
        <UnstyledButton
          onClick={onClick}
          style={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            border: selected ? '2px solid var(--mantine-color-violet-6)' : '2px solid transparent',
            opacity: selected ? 1 : 0.6,
            transition: 'all 0.15s',
            backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
          }}
        >
          <Image src={src} alt={alt} fit="contain" w="100%" h="100%" />
        </UnstyledButton>
      ),
    }),
    []
  );

  const icons = useMemo(
    () => ({
      upload: IconUpload,
      search: IconSearch,
      trash: IconTrash,
      photo: IconPhoto,
      video: IconVideo,
      audio: IconMusic,
      document: IconFileText,
      file: IconFile,
      layoutGrid: IconLayoutGrid,
      columns: IconColumns,
      zoomIn: IconZoomIn,
      x: IconX,
    }),
    []
  );

  useEffect(() => {
    if (activeTab !== 'pexels') return;
    if (pexelsImages.length > 0) return;
    void loadPexels();
  }, [activeTab, loadPexels, pexelsImages.length]);

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
            <MediaLibraryProvider enableDragDrop={false}>
              <RecentMediaGrid
                preset={preset}
                icons={icons}
                maxItems={12}
                columns={3}
                gap="6px"
                showLayoutToggle={false}
                multiSelect={false}
                onSelectionChange={(selected) => {
                  const id = selected[0]?.id;
                  if (typeof id === 'number') {
                    onSelectMedia(id);
                    onClose();
                  }
                }}
              />
            </MediaLibraryProvider>
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
