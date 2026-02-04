'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Drawer,
  FileButton,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
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
import { createAuthClient } from 'better-auth/client';
import type { AIGenerateSidebarProps, ComponentPreset, MediaAIGenerator, MediaAsset, MediaPexelsProvider, PexelsImagePickerProps, MediaFreepikProvider, FreepikContentPickerProps, MediaSyncConfig } from '@reactkits.dev/react-media-library';
import { MediaGrid, MediaLibraryProvider, useMediaLibraryContext } from '@reactkits.dev/react-media-library';

// Auth client for getting user ID (sync purposes)
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

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

  AIGenerateSidebar: ({
    isOpen,
    onClose,
    prompt,
    onPromptChange,
    width,
    onWidthChange,
    height,
    onHeightChange,
    steps,
    onStepsChange,
    model,
    onModelChange,
    onPresetChange,
    error,
    generating,
    onGenerate,
    onCancel,
  }: AIGenerateSidebarProps) => {
    // Track previous state so we only dispatch close when transitioning open→closed,
    // not on initial mount with isOpen=false (which would reset navWidth to 80).
    const wasOpenRef = useRef(false);
    useEffect(() => {
      if (isOpen) {
        wasOpenRef.current = true;
        window.dispatchEvent(new CustomEvent('ai-sidebar-open'));
      } else if (wasOpenRef.current) {
        wasOpenRef.current = false;
        window.dispatchEvent(new CustomEvent('ai-sidebar-close'));
      }
    }, [isOpen]);

    return isOpen ? (
      <Box
        style={{
          width: '420px',
          height: 'calc(100vh - 45px)', // Account for header height
          borderLeft: '1px solid #E5E7EB',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: '80px', // Position next to icon rail (main panel floats)
          top: '45px', // Below header
          zIndex: 100,
          boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text fw={600} size="lg">Generate image</Text>
          <UnstyledButton
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <IconX size={20} />
          </UnstyledButton>
        </Box>
        <Box style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
      <Stack gap="md">
        <div>
          <Text size="sm" fw={600} mb={4}>
            Prompt
          </Text>
          <TextInput
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe the image you want..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <Text size="sm" fw={600} mb={4}>
              Width
            </Text>
            <TextInput
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              type="number"
              placeholder="768"
            />
          </div>
          <div>
            <Text size="sm" fw={600} mb={4}>
              Height
            </Text>
            <TextInput
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              type="number"
              placeholder="768"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <Text size="sm" fw={600} mb={4}>
              Preset
            </Text>
            <Select
              value=""
              onChange={(val) => val && onPresetChange(val)}
              placeholder="Pick a size"
              data={[
                { value: '512', label: '512 × 512' },
                { value: '768', label: '768 × 768' },
                { value: '1024', label: '1024 × 1024' },
              ]}
            />
          </div>
          <div>
            <Text size="sm" fw={600} mb={4}>
              Steps (optional)
            </Text>
            <TextInput
              value={steps}
              onChange={(e) => onStepsChange(e.target.value)}
              type="number"
              placeholder="25"
            />
          </div>
        </div>

        <div>
          <Text size="sm" fw={600} mb={4}>
            Model (optional)
          </Text>
          <TextInput
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="e.g. stability-ai/sdxl:… (provider-specific)"
          />
        </div>

        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="light" onClick={onCancel} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={onGenerate} loading={generating} disabled={!prompt.trim()}>
              Generate
            </Button>
          </Group>
        </Stack>
        </Box>
      </Box>
    ) : null;
  },

  PexelsImagePicker: ({
    isOpen,
    onClose,
    images,
    loading,
    selected,
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
    importing,
    onImport,
  }: PexelsImagePickerProps) => (
    <Modal
      opened={isOpen}
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
            <Button variant="subtle" size="xs" onClick={selected.size === images.length ? onDeselectAll : onSelectAll}>
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
            <Text c="dimmed">No images found</Text>
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
                onClick={() => onToggleSelect(img.url)}
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
                  onChange={() => onToggleSelect(img.url)}
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
            onClick={onImport}
            loading={importing}
            disabled={selected.size === 0}
          >
            Import {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </Group>
      </Box>
    </Modal>
  ),

  FreepikContentPicker: ({
    isOpen,
    onClose,
    content,
    loading,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    selected,
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
    importing,
    onImport,
    order,
    onOrderChange,
  }: FreepikContentPickerProps) => (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>Freepik Icons</Text>
        </Group>
      }
      size="lg"
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* Search & Filters */}
      <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Group gap="sm" mb="sm">
          <TextInput
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
          />
          <Select
            value={order}
            onChange={(val) => onOrderChange((val as 'relevance' | 'popularity' | 'date') || 'relevance')}
            data={[
              { value: 'relevance', label: 'Relevance' },
              { value: 'popularity', label: 'Popular' },
              { value: 'date', label: 'Newest' },
            ]}
            style={{ width: 120 }}
          />
          <Button onClick={onSearch} disabled={loading}>
            Search
          </Button>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {content.length} icons found • {selected.size} selected
          </Text>
          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              onClick={selected.size === content.length && content.length > 0 ? onDeselectAll : onSelectAll}
              disabled={content.length === 0}
            >
              {selected.size === content.length && content.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Content Grid */}
      <Box p="md" style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <Center p="xl">
            <Loader size="sm" />
          </Center>
        ) : content.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No icons found. Try a different search term.</Text>
          </Center>
        ) : (
          <SimpleGrid cols={4} spacing="sm">
            {content.map((item) => (
              <Box
                key={item.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selected.has(item.id) ? '3px solid #667eea' : '1px solid #dee2e6',
                  transition: 'all 0.15s',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
                onClick={() => onToggleSelect(item.id)}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  style={{
                    maxWidth: '80%',
                    maxHeight: '80%',
                    objectFit: 'contain',
                  }}
                />
                <Checkbox
                  checked={selected.has(item.id)}
                  onChange={() => onToggleSelect(item.id)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                  }}
                  styles={{
                    input: {
                      backgroundColor: selected.has(item.id) ? '#667eea' : 'rgba(255,255,255,0.9)',
                      borderColor: selected.has(item.id) ? '#667eea' : '#dee2e6',
                    },
                  }}
                />
                {item.isFree && (
                  <Badge
                    size="xs"
                    color="green"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                    }}
                  >
                    Free
                  </Badge>
                )}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 4,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                  }}
                >
                  <Text
                    size="xs"
                    c="white"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 10,
                    }}
                  >
                    {item.name}
                  </Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Footer */}
      <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onImport}
            loading={importing}
            disabled={selected.size === 0}
          >
            Import {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </Group>
      </Box>
    </Modal>
  ),
};

function MediaLibraryContent({ onSelectMedia, selectedSlot }: MediaLibraryProps) {
  const { uploadFiles } = useMediaLibraryContext();
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
    <Box p="xs" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {selectedSlot !== undefined && (
        <Text size="xs" c="dimmed" mb={4} px={4}>
          APPLIES TO SLOT {selectedSlot + 1}
        </Text>
      )}

      <Box style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
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
  const ai = useMemo<MediaAIGenerator>(
    () => ({
      async generateImages(req) {
        const res = await fetch('/api/ai/images/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(req),
        });
        if (!res.ok) {
          throw new Error('AI generation failed');
        }
        const blob = await res.blob();
        const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
        const file = new File([blob], `ai-${Date.now()}.${ext}`, { type: blob.type || 'image/png' });
        return [
          {
            file,
            metadata: {
              provider: res.headers.get('x-ai-provider') ?? 'backend',
              model: res.headers.get('x-ai-model') ?? undefined,
              prompt: req.prompt,
              width: req.width,
              height: req.height,
            },
          },
        ];
      },
    }),
    []
  );

  const pexels = useMemo<MediaPexelsProvider>(
    () => ({
      async fetchImages() {
        const res = await fetch('/api/pexels-images');
        const data = await res.json();
        return (data.images || []).map((img: any) => ({
          name: img.name,
          url: img.url,
          size: img.size,
          modified: img.modified,
        }));
      },
    }),
    []
  );

  const freepik = useMemo<MediaFreepikProvider>(
    () => ({
      async searchIcons(options) {
        const params = new URLSearchParams();
        if (options.query) params.set('term', options.query);
        if (options.order) params.set('order', options.order);
        if (options.page) params.set('page', String(options.page));
        if (options.perPage) params.set('per_page', String(options.perPage));

        const res = await fetch(`/api/freepik/icons?${params}`);
        if (!res.ok) {
          throw new Error('Failed to search Freepik icons');
        }
        const data = await res.json();
        return data.content || [];
      },

      async downloadContent(content) {
        // Use the thumbnail URL but swap to 512px for better quality
        // Freepik CDN URLs follow pattern: https://cdn-icons-png.freepik.com/{size}/...
        // Preview uses 128, we want 512 for import
        const highResUrl = content.thumbnailUrl.replace(/\/128\//, '/512/');

        const res = await fetch(highResUrl);
        if (!res.ok) {
          throw new Error('Failed to download Freepik icon');
        }
        const blob = await res.blob();
        const filename = `${content.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
        return new File([blob], filename, { type: 'image/png' });
      },
    }),
    []
  );

  // Sync configuration for server-side media storage
  const sync = useMemo<MediaSyncConfig>(
    () => ({
      apiBaseUrl: '',
      getUserId: async () => {
        try {
          const result: any = await authClient.getSession();
          return result?.data?.user?.id || null;
        } catch {
          return null;
        }
      },
    }),
    []
  );

  return (
    <MediaLibraryProvider enableDragDrop={true} ai={ai} pexels={pexels} freepik={freepik} sync={sync}>
      <MediaLibraryContent {...props} />
    </MediaLibraryProvider>
  );
}
