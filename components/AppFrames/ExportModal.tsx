'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  Progress,
  Radio,
  Slider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconDownload, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { Screen, SharedBackground } from './types';
import { getCanvasDimensions, getCanvasSizeLabel } from './FramesContext';
import { exportService, type ExportFormat, type CancelToken } from '@/lib/ExportService';

const sanitizeFilenamePart = (input: string) => {
  const s = (input || '').trim();
  if (!s) return 'screen';
  return s.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatTimestamp = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
};

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

export function ExportModal({
  opened,
  onClose,
  screensByCanvasSize,
  sharedBackgrounds,
}: {
  opened: boolean;
  onClose: () => void;
  screensByCanvasSize: Record<string, Screen[]>;
  sharedBackgrounds?: Record<string, SharedBackground>;
}) {
  const nonEmptyCanvasSizes = useMemo(() => {
    return Object.entries(screensByCanvasSize)
      .filter(([, screens]) => (screens || []).length > 0)
      .map(([canvasSize]) => canvasSize);
  }, [screensByCanvasSize]);

  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<number>(90);
  const [selectedCanvasSizes, setSelectedCanvasSizes] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentScreenName: '' });
  const cancelTokenRef = useRef<CancelToken>({ cancelled: false });

  const isPro = exportService.isProUser();

  // Default selection: all non-empty canvas sizes when opening.
  useEffect(() => {
    if (opened) {
      setSelectedCanvasSizes(nonEmptyCanvasSizes);
      setIsExporting(false);
      setProgress({ current: 0, total: 0, currentScreenName: '' });
      cancelTokenRef.current = { cancelled: false };
    }
  }, [opened, nonEmptyCanvasSizes]);

  const selectedScreens = useMemo(() => {
    const screens: Array<{ canvasSize: string; screen: Screen }> = [];
    for (const cs of selectedCanvasSizes) {
      const list = screensByCanvasSize[cs] || [];
      for (const s of list) screens.push({ canvasSize: cs, screen: s });
    }
    return screens;
  }, [screensByCanvasSize, selectedCanvasSizes]);

  const totalScreens = selectedScreens.length;
  const estimatedSize = exportService.estimateExportSize(totalScreens, format, quality);

  const appleCanvasSizes = useMemo(
    () => sortCanvasSizesByDimensionsDesc(nonEmptyCanvasSizes.filter((cs) => getPlatform(cs) === 'apple')),
    [nonEmptyCanvasSizes],
  );
  const googleCanvasSizes = useMemo(
    () => sortCanvasSizesByDimensionsDesc(nonEmptyCanvasSizes.filter((cs) => getPlatform(cs) === 'google')),
    [nonEmptyCanvasSizes],
  );

  const toggleCanvasSize = (cs: string) => {
    setSelectedCanvasSizes((prev) => (prev.includes(cs) ? prev.filter((x) => x !== cs) : [...prev, cs]));
  };

  const handleCancelExport = () => {
    cancelTokenRef.current.cancelled = true;
    setIsExporting(false);
    setProgress({ current: 0, total: 0, currentScreenName: '' });
    notifications.show({
      title: 'Export cancelled',
      message: 'No files were downloaded.',
      color: 'yellow',
    });
  };

  const handleExport = async () => {
    if (totalScreens === 0) return;

    setIsExporting(true);
    setProgress({ current: 0, total: totalScreens, currentScreenName: '' });
    cancelTokenRef.current = { cancelled: false };

    try {
      if (totalScreens === 1) {
        const only = selectedScreens[0];
        const blob = await exportService.exportScreen(only.screen, only.canvasSize, format, quality);
        if (cancelTokenRef.current.cancelled) {
          setIsExporting(false);
          return;
        }

        const base = sanitizeFilenamePart(only.screen.name || 'screen');
        exportService.downloadBlob(blob, `${base}.${format}`);
        notifications.show({
          title: 'Export complete',
          message: `Downloaded 1 ${format.toUpperCase()} file.`,
          color: 'green',
        });
        onClose();
        return;
      }

      const zipBlob = await exportService.exportScreensToZip(
        screensByCanvasSize,
        selectedCanvasSizes,
        format,
        quality,
        (current, total, screenName) => {
          setProgress({ current, total, currentScreenName: screenName });
        },
        cancelTokenRef.current,
        sharedBackgrounds,
      );

      if (cancelTokenRef.current.cancelled) {
        setIsExporting(false);
        return;
      }

      exportService.downloadBlob(zipBlob, `appframes-export-${formatTimestamp(new Date())}.zip`);
      notifications.show({
        title: 'Export complete',
        message: `Downloaded ZIP with ${totalScreens} screens.`,
        color: 'green',
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'EXPORT_CANCELLED') {
        // Already handled via cancel action.
        setIsExporting(false);
        return;
      }
      notifications.show({
        title: 'Export failed',
        message: msg || 'Please try again.',
        color: 'red',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const CanvasSizeRow = ({ canvasSize }: { canvasSize: string }) => {
    const dims = getCanvasDimensions(canvasSize, 'portrait');
    const count = (screensByCanvasSize[canvasSize] || []).length;
    const checked = selectedCanvasSizes.includes(canvasSize);
    return (
      <Checkbox
        checked={checked}
        onChange={() => toggleCanvasSize(canvasSize)}
        label={
          <Group justify="space-between" gap="xs" wrap="nowrap">
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} style={{ lineHeight: 1.2 }} truncate>
                {getCanvasSizeLabel(canvasSize)}
              </Text>
              <Text size="xs" c="dimmed">
                {dims.width} × {dims.height}px
              </Text>
            </Box>
            <Badge size="sm" variant="light">
              {count}
            </Badge>
          </Group>
        }
      />
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (isExporting) return;
        onClose();
      }}
      title={<Title order={4}>Export</Title>}
      centered
      size="lg"
      closeOnEscape={!isExporting}
      closeOnClickOutside={!isExporting}
    >
      <Stack gap="md">
        {!isPro && (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text fw={600}>Watermark included</Text>
                <Text size="sm" c="dimmed">
                  Free exports include a small “Made with AppFrames” watermark.
                </Text>
              </Box>
              <Button
                size="xs"
                variant="light"
                onClick={() => {
                  notifications.show({
                    title: 'Upgrade to Pro',
                    message: 'Pro billing isn’t wired up yet. (This is a placeholder CTA.)',
                    color: 'blue',
                  });
                }}
              >
                Upgrade to Pro
              </Button>
            </Group>
          </Alert>
        )}

        {isExporting ? (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Exporting…</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconX size={14} />}
                onClick={handleCancelExport}
              >
                Cancel
              </Button>
            </Group>
            <Progress
              value={progress.total ? (progress.current / progress.total) * 100 : 0}
              striped
              animated
            />
            <Group justify="space-between" mt="xs">
              <Text size="sm" c="dimmed">
                {progress.current} of {progress.total}
              </Text>
              <Text size="sm" c="dimmed" style={{ maxWidth: 320 }} truncate>
                {progress.currentScreenName || ''}
              </Text>
            </Group>
          </Box>
        ) : (
          <>
            <Stack gap="xs">
              <Text fw={600}>Format</Text>
              <Radio.Group value={format} onChange={(v) => setFormat(v as ExportFormat)}>
                <Group gap="lg">
                  <Radio value="png" label="PNG (lossless)" />
                  <Radio value="jpg" label="JPG (smaller files)" />
                </Group>
              </Radio.Group>
              {format === 'jpg' && (
                <Box>
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      JPG quality
                    </Text>
                    <Text size="sm" c="dimmed">
                      {quality}
                    </Text>
                  </Group>
                  <Slider
                    value={quality}
                    onChange={setQuality}
                    min={0}
                    max={100}
                    step={1}
                    label={(v) => `${v}`}
                  />
                </Box>
              )}
            </Stack>

            <Divider />

            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={600}>Canvas sizes</Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => setSelectedCanvasSizes(nonEmptyCanvasSizes)}
                    disabled={nonEmptyCanvasSizes.length === 0}
                  >
                    Select all
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => setSelectedCanvasSizes([])}
                    disabled={selectedCanvasSizes.length === 0}
                  >
                    Deselect all
                  </Button>
                </Group>
              </Group>

              {nonEmptyCanvasSizes.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No screens available to export yet.
                </Text>
              ) : (
                <Stack gap="sm">
                  {appleCanvasSizes.length > 0 && (
                    <Stack gap="xs">
                      <Text size="sm" fw={700} c="dimmed">
                        Apple App Store
                      </Text>
                      {appleCanvasSizes.map((cs) => <CanvasSizeRow key={cs} canvasSize={cs} />)}
                    </Stack>
                  )}
                  {googleCanvasSizes.length > 0 && (
                    <Stack gap="xs">
                      <Text size="sm" fw={700} c="dimmed">
                        Google Play Store
                      </Text>
                      {googleCanvasSizes.map((cs) => <CanvasSizeRow key={cs} canvasSize={cs} />)}
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>

            <Divider />

            <Group justify="space-between">
              <Box>
                <Text fw={600}>{totalScreens} screen{totalScreens === 1 ? '' : 's'}</Text>
                <Text size="sm" c="dimmed">
                  Estimated size: {estimatedSize}
                </Text>
                {totalScreens === 0 && (
                  <Text size="sm" c="red">
                    Please select at least one canvas size.
                  </Text>
                )}
              </Box>
              <Group>
                <Button variant="subtle" onClick={onClose}>
                  Close
                </Button>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  disabled={totalScreens === 0}
                >
                  Export
                </Button>
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}


