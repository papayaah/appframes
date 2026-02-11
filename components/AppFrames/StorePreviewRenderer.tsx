'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconDownload, IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useFrames, getCanvasDimensions, getCanvasSizeLabel } from './FramesContext';
import type { Screen } from './types';
import { CompositionRenderer } from './CompositionRenderer';
import { TextElement as CanvasTextElement } from './TextElement';
import { useMediaImage } from '@/hooks/useMediaImage';
import { exportService } from '@/lib/ExportService';
import { ExportModal } from './ExportModal';
import { getBackgroundStyle } from './Sidebar';

const getPlatform = (canvasSize: string): 'apple' | 'google' => {
  if (canvasSize.startsWith('google')) return 'google';
  return 'apple';
};

const sortCanvasSizesByDimensionsDesc = (canvasSizes: string[]) => {
  return [...canvasSizes].sort((a, b) => {
    const da = getCanvasDimensions(a, 'portrait');
    const db = getCanvasDimensions(b, 'portrait');
    const areaA = da.width * da.height;
    const areaB = db.width * db.height;
    if (areaA !== areaB) return areaB - areaA;
    return a.localeCompare(b);
  });
};

function CanvasBackground({ mediaId }: { mediaId?: number }) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

function StaticCanvas({
  screen,
  canvasSize,
  scale,
}: {
  screen: Screen;
  canvasSize: string;
  scale: number;
}) {
  const { width, height } = getCanvasDimensions(canvasSize, screen?.settings?.orientation ?? 'portrait');
  const screenSettings = {
    ...screen.settings,
    selectedScreenIndex: 0,
    canvasSize,
  };

  return (
    <Box
      style={{
        width: width * scale,
        height: height * scale,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        ...getBackgroundStyle(screenSettings.backgroundColor),
      }}
    >
      <Box
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <CanvasBackground mediaId={screenSettings.canvasBackgroundMediaId} />
        <Box style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          <CompositionRenderer
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            settings={screenSettings as any}
            screen={screen as any}
            disableCrossCanvasDrag={true}
          />
        </Box>
        {(screen.textElements || [])
          .filter((t) => t.visible)
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map((t) => (
            <CanvasTextElement
              key={t.id}
              element={t}
              selected={false}
              disabled={true}
              onSelect={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          ))}
      </Box>
    </Box>
  );
}

export function StorePreviewRenderer() {
  const router = useRouter();
  const { screensByCanvasSize, switchCanvasSize, sharedBackgrounds } = useFrames();
  const [exportOpened, setExportOpened] = useState(false);
  const [quickExporting, setQuickExporting] = useState(false);

  const nonEmptyCanvasSizes = useMemo(() => {
    return Object.entries(screensByCanvasSize)
      .filter(([, screens]) => (screens || []).length > 0)
      .map(([canvasSize]) => canvasSize);
  }, [screensByCanvasSize]);

  const appleCanvasSizes = useMemo(
    () => sortCanvasSizesByDimensionsDesc(nonEmptyCanvasSizes.filter((cs) => getPlatform(cs) === 'apple')),
    [nonEmptyCanvasSizes],
  );
  const googleCanvasSizes = useMemo(
    () => sortCanvasSizesByDimensionsDesc(nonEmptyCanvasSizes.filter((cs) => getPlatform(cs) === 'google')),
    [nonEmptyCanvasSizes],
  );

  const totalScreens = useMemo(() => {
    return nonEmptyCanvasSizes.reduce((sum, cs) => sum + ((screensByCanvasSize[cs] || []).length), 0);
  }, [nonEmptyCanvasSizes, screensByCanvasSize]);

  const handleEditCanvasSize = (canvasSize: string) => {
    switchCanvasSize(canvasSize);
    router.push('/');
  };

  const handleQuickExportAll = async () => {
    if (totalScreens === 0) return;
    setQuickExporting(true);
    try {
      const zipBlob = await exportService.exportScreensToZip(
        screensByCanvasSize,
        nonEmptyCanvasSizes,
        'png',
        90,
        undefined,
        { cancelled: false },
        sharedBackgrounds,
      );
      exportService.downloadBlob(zipBlob, `appframes-export-all-${Date.now()}.zip`);
      notifications.show({
        title: 'Export complete',
        message: `Downloaded ZIP with ${totalScreens} screens.`,
        color: 'green',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notifications.show({
        title: 'Quick export failed',
        message: msg || 'Please try again.',
        color: 'red',
      });
    } finally {
      setQuickExporting(false);
    }
  };

  const handleQuickExportCanvasSize = async (canvasSize: string) => {
    const screens = screensByCanvasSize[canvasSize] || [];
    if (screens.length === 0) return;

    try {
      if (screens.length === 1) {
        const s = screens[0];
        const sharedBg = sharedBackgrounds?.[canvasSize];
        const blob = await exportService.exportScreen(s, canvasSize, 'png', 90, screens, sharedBg);
        exportService.downloadBlob(blob, `${(s.name || 'screen').replace(/\s+/g, ' ').trim()}.png`);
        notifications.show({
          title: 'Export complete',
          message: 'Downloaded 1 PNG file.',
          color: 'green',
        });
        return;
      }

      const zipBlob = await exportService.exportScreensToZip(
        screensByCanvasSize,
        [canvasSize],
        'png',
        90,
        undefined,
        undefined,
        sharedBackgrounds,
      );
      exportService.downloadBlob(zipBlob, `appframes-export-${canvasSize}-${Date.now()}.zip`);
      notifications.show({
        title: 'Export complete',
        message: `Downloaded ZIP with ${screens.length} screens.`,
        color: 'green',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notifications.show({
        title: 'Quick export failed',
        message: msg || 'Please try again.',
        color: 'red',
      });
    }
  };

  const CanvasSizeGroup = ({ canvasSize }: { canvasSize: string }) => {
    const screens = screensByCanvasSize[canvasSize] || [];
    const baseDims = getCanvasDimensions(canvasSize, 'portrait');
    const label = getCanvasSizeLabel(canvasSize);

    // Scale previews to fit comfortably.
    const maxW = 240;
    const maxH = 520;
    const dimsForScreens = screens.map((s) =>
      getCanvasDimensions(canvasSize, s?.settings?.orientation ?? 'portrait'),
    );
    const maxDims = dimsForScreens.reduce(
      (acc, d) => ({
        width: Math.max(acc.width, d.width),
        height: Math.max(acc.height, d.height),
      }),
      { width: baseDims.width, height: baseDims.height },
    );
    const scale = Math.min(maxW / maxDims.width, maxH / maxDims.height);
    const orientations = new Set(screens.map((s) => s?.settings?.orientation ?? 'portrait'));
    const dimsLabel =
      orientations.size > 1
        ? `${baseDims.width} × ${baseDims.height}px (P) • ${baseDims.height} × ${baseDims.width}px (L)`
        : orientations.has('landscape')
          ? `${baseDims.height} × ${baseDims.width}px`
          : `${baseDims.width} × ${baseDims.height}px`;

    return (
      <Stack gap="xs">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Group gap="sm" align="baseline">
              <Title order={4}>{label}</Title>
              <Text size="sm" c="dimmed">
                {dimsLabel}
              </Text>
              <Text size="sm" c="dimmed">
                • {screens.length} screen{screens.length === 1 ? '' : 's'}
              </Text>
            </Group>
          </Box>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconDownload size={14} />}
              onClick={() => handleQuickExportCanvasSize(canvasSize)}
            >
              Quick export
            </Button>
            <Button
              size="xs"
              variant="default"
              leftSection={<IconEdit size={14} />}
              onClick={() => handleEditCanvasSize(canvasSize)}
            >
              Edit
            </Button>
          </Group>
        </Group>

        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing="md"
          verticalSpacing="md"
        >
          {screens.map((screen) => (
            <Card key={screen.id} padding="sm" radius="md" withBorder>
              <Stack gap="xs">
                <StaticCanvas screen={screen} canvasSize={canvasSize} scale={scale} />
                <Text size="sm" fw={600} style={{ lineHeight: 1.2 }} lineClamp={2}>
                  {screen.name || 'Untitled'}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    );
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Button
            component={Link}
            href="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back to editor
          </Button>
          <Title order={3}>Preview</Title>
        </Group>

        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={handleQuickExportAll}
            loading={quickExporting}
            disabled={totalScreens === 0}
          >
            Quick export all
          </Button>
          <Button onClick={() => setExportOpened(true)} disabled={totalScreens === 0}>
            Export…
          </Button>
        </Group>
      </Group>

      {totalScreens === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Stack gap="sm" align="center">
            <Title order={4}>No screenshots yet</Title>
            <Text c="dimmed" ta="center" style={{ maxWidth: 520 }}>
              Create at least one screen in the editor, then come back here to review and export
              by canvas size.
            </Text>
            <Button component={Link} href="/" leftSection={<IconArrowLeft size={16} />}>
              Go to editor
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="xl">
          {appleCanvasSizes.length > 0 && (
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Apple App Store</Title>
              </Group>
              <Divider />
              {appleCanvasSizes.map((cs) => (
                <CanvasSizeGroup key={cs} canvasSize={cs} />
              ))}
            </Stack>
          )}

          {googleCanvasSizes.length > 0 && (
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Google Play Store</Title>
              </Group>
              <Divider />
              {googleCanvasSizes.map((cs) => (
                <CanvasSizeGroup key={cs} canvasSize={cs} />
              ))}
            </Stack>
          )}
        </Stack>
      )}

      <ExportModal
        opened={exportOpened}
        onClose={() => setExportOpened(false)}
        screensByCanvasSize={screensByCanvasSize}
        sharedBackgrounds={sharedBackgrounds}
      />
    </Box>
  );
}


