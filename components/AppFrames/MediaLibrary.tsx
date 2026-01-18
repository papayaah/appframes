'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
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
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Select } from '@mantine/core';
import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconColumns,
  IconFile,
  IconFileText,
  IconLayoutGrid,
  IconList,
  IconMusic,
  IconPhoto,
  IconSearch,
  IconTrash,
  IconUpload,
  IconVideo,
  IconX,
  IconZoomIn,
} from '@tabler/icons-react';
import type { ComponentPreset, MediaAsset } from '@reactkits.dev/react-media-library';
import { MediaGrid, MediaLibraryProvider, useMediaLibraryContext } from '@reactkits.dev/react-media-library';
import { PexelsImagePicker } from './PexelsImagePicker';

interface MediaLibraryProps {
  onSelectMedia: (mediaId: number) => void;
  selectedSlot?: number;
}

const mantinePreset: ComponentPreset = {
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

  Grid: ({ children, className, columns = 4, gap = '1rem' }) => (
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
        minHeight: 160,
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
};

function MediaLibraryContent({ onSelectMedia, selectedSlot }: MediaLibraryProps) {
  const { uploadFiles } = useMediaLibraryContext();
  const [pexelsPickerOpen, setPexelsPickerOpen] = useState(false);
  const prevSelectedIdsRef = useRef<Set<number>>(new Set());

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
      list: IconList,
      columns: IconColumns,
      slidersHorizontal: IconAdjustmentsHorizontal,
      check: IconCheck,
      x: IconX,
      zoomIn: IconZoomIn,
    }),
    []
  );

  const handleSelectionChange = useCallback(
    (selectedAssets: MediaAsset[]) => {
      const next = new Set<number>(
        selectedAssets
          .map((a) => a.id)
          .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
      );

      const prev = prevSelectedIdsRef.current;
      let newlyAdded: number | null = null;
      const nextArr = Array.from(next);
      for (let i = 0; i < nextArr.length; i += 1) {
        const id = nextArr[i]!;
        if (!prev.has(id)) {
          newlyAdded = id;
          break;
        }
      }

      // If nothing new was added but exactly one item is selected, treat that as the selection.
      if (newlyAdded == null && next.size === 1) {
        newlyAdded = Array.from(next)[0]!;
      }

      prevSelectedIdsRef.current = next;
      if (newlyAdded != null) onSelectMedia(newlyAdded);
    },
    [onSelectMedia]
  );

  return (
    <Box p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box mb="xs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Box>
          <Text size="sm" fw={700} mb={4}>
            Media
          </Text>
          {selectedSlot !== undefined && (
            <Text size="xs" c="dimmed">
              APPLIES TO SLOT {selectedSlot + 1}
            </Text>
          )}
        </Box>

        <Button variant="light" size="xs" leftSection={<IconPhoto size={14} />} onClick={() => setPexelsPickerOpen(true)}>
          Pexels
        </Button>
      </Box>

      <PexelsImagePicker opened={pexelsPickerOpen} onClose={() => setPexelsPickerOpen(false)} onImport={uploadFiles} />

      <Box style={{ flex: 1, overflow: 'auto' }}>
        <MediaGrid
          preset={mantinePreset}
          icons={icons as any}
          onSelectionChange={handleSelectionChange}
          draggable={true}
          onDragStart={(asset, e) => {
            // Compatibility with appframes' existing drop handling expectations.
            // We keep the library's own payloads (application/json, text/uri-list)
            // and add a simple numeric mediaId for drops onto frames.
            if (typeof asset.id === 'number') {
              try {
                e.dataTransfer.setData('mediaId', String(asset.id));
              } catch {
                // ignore
              }
            }
          }}
        />
      </Box>
    </Box>
  );
}

export function MediaLibrary(props: MediaLibraryProps) {
  return (
    <MediaLibraryProvider enableDragDrop={true}>
      <MediaLibraryContent {...props} />
    </MediaLibraryProvider>
  );
}
