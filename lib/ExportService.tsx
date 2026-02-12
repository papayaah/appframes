import React from 'react';
import type { Screen, SharedBackground } from '@/components/AppFrames/types';
import { getCanvasDimensions } from '@/components/AppFrames/FramesContext';
import { CompositionRenderer } from '@/components/AppFrames/CompositionRenderer';
import { TextElement as CanvasTextElement } from '@/components/AppFrames/TextElement';
import { SharedCanvasBackground } from '@/components/AppFrames/SharedCanvasBackground';
import { BackgroundEffectsOverlay } from '@/components/AppFrames/BackgroundEffectsOverlay';
import { useMediaImage } from '@/hooks/useMediaImage';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme';
import { InteractionLockProvider } from '@/components/AppFrames/InteractionLockContext';
import { getBackgroundStyle } from '@/components/AppFrames/Sidebar';

export type ExportFormat = 'png' | 'jpg';

export interface ExportOptions {
  format: ExportFormat;
  quality: number; // 0-100, only applies to JPG
  selectedCanvasSizes: string[];
}

export interface ExportProgressState {
  current: number;
  total: number;
  currentScreenName?: string;
}

export interface CancelToken {
  cancelled: boolean;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const extractCssUrls = (cssValue: string): string[] => {
  if (!cssValue || cssValue === 'none') return [];
  const out: string[] = [];
  const re = /url\(["']?(.*?)["']?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssValue)) != null) {
    const u = (m[1] || '').trim();
    if (u) out.push(u);
  }
  return out;
};

const collectImageUrls = (root: HTMLElement): string[] => {
  const urls = new Set<string>();
  // <img src>
  root.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    const src = el.currentSrc || el.src;
    if (src) urls.add(src);
  });
  // background-image urls
  root.querySelectorAll('*').forEach((el) => {
    const bg = window.getComputedStyle(el as Element).backgroundImage;
    extractCssUrls(bg).forEach((u) => urls.add(u));
  });
  return Array.from(urls);
};

const preloadImage = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    // Helps when the URL supports CORS. (blob: URLs ignore this.)
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });

const dataUrlToBlob = (dataUrl: string): Blob => {
  // Safari can return 0-byte blobs when using fetch() on data: URLs. Convert manually instead.
  const [header, data] = dataUrl.split(',', 2);
  if (!header || data == null) {
    throw new Error('Export render failed: invalid data URL');
  }
  const mimeMatch = header.match(/data:([^;]+)(;base64)?/i);
  const mime = mimeMatch?.[1] || 'application/octet-stream';
  const isBase64 = header.toLowerCase().includes(';base64');

  if (isBase64) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  // Percent-encoded (rare)
  const text = decodeURIComponent(data);
  return new Blob([text], { type: mime });
};

const sanitizeFilenamePart = (input: string) => {
  const s = (input || '').trim();
  if (!s) return 'screen';
  // Replace invalid filename characters for most OSes, collapse whitespace.
  return s
    .replace(/[\/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

const pad2 = (n: number) => String(n).padStart(2, '0');

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

const orderedCanvasSizes = (selected: string[]) => {
  const apple = selected.filter((c) => getPlatform(c) === 'apple');
  const google = selected.filter((c) => getPlatform(c) === 'google');
  return [
    ...sortCanvasSizesByDimensionsDesc(apple),
    ...sortCanvasSizesByDimensionsDesc(google),
  ];
};

function CanvasBackground({ mediaId, blur }: { mediaId?: number; blur?: number }) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  const hasBlur = blur != null && blur > 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: hasBlur ? `-${blur}px` : 0,
        clipPath: hasBlur ? `inset(${blur}px)` : undefined,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: hasBlur ? `blur(${blur}px)` : undefined,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

function ExportSurface({
  screen,
  canvasSize,
  width,
  height,
  isPro,
  allScreens,
  sharedBackground,
}: {
  screen: Screen;
  canvasSize: string;
  width: number;
  height: number;
  isPro: boolean;
  allScreens?: Screen[];
  sharedBackground?: SharedBackground;
}) {
  const screenSettings = {
    ...screen.settings,
    selectedScreenIndex: 0,
    canvasSize,
  };

  // Check if this screen is part of a shared background
  const isInSharedBg = sharedBackground?.screenIds.includes(screen.id) ?? false;

  const blurAmount = screenSettings.backgroundEffects?.blur ?? 0;
  const hasBlur = blurAmount > 0;

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background color/gradient layer (separate div for blur support) */}
      <div
        style={{
          position: 'absolute',
          inset: hasBlur ? `-${blurAmount}px` : 0,
          clipPath: hasBlur ? `inset(${blurAmount}px)` : undefined,
          ...getBackgroundStyle(screenSettings.backgroundColor),
          filter: hasBlur ? `blur(${blurAmount}px)` : undefined,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Render shared background if this screen is part of a shared background group */}
      {isInSharedBg && allScreens && sharedBackground ? (
        <SharedCanvasBackground
          screenId={screen.id}
          allScreens={allScreens}
          sharedBackground={sharedBackground}
          screenWidth={width}
          screenHeight={height}
          blur={blurAmount}
        />
      ) : (
        <CanvasBackground mediaId={screenSettings.canvasBackgroundMediaId} blur={blurAmount} />
      )}
      <BackgroundEffectsOverlay effects={screenSettings.backgroundEffects} screenId={screen.id} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        <CompositionRenderer
          // CompositionRenderer expects the CanvasSettings shape; screenSettings matches it.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          settings={screenSettings as any}
          screen={screen as any}
          disableCrossCanvasDrag={true}
        />
      </div>
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
      {!isPro && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            fontSize: 14,
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            color: '#000',
            opacity: 0.4,
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          Made with AppFrames
        </div>
      )}
    </div>
  );
}

export class ExportService {
  /**
   * Placeholder pro-check. If you later add real auth/subscriptions, update this.
   * You can also force pro in the browser by setting `localStorage.appframes_is_pro = "true"`.
   */
  isProUser(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('appframes_is_pro') === 'true';
  }

  estimateExportSize(screenCount: number, format: ExportFormat, quality: number = 90): string {
    if (screenCount <= 0) return '0 MB';
    if (format === 'png') {
      // Very rough: screenshots tend to be ~2–5MB each depending on content.
      const mb = screenCount * 3.2;
      return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
    }
    // JPG: heavily dependent on quality; rough heuristic.
    const q = Math.max(0, Math.min(100, quality));
    const per = 0.4 + (q / 100) * 1.4; // 0.4MB @0 → 1.8MB @100
    const mb = screenCount * per;
    return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  }

  generateFilename(screen: Screen, index: number, format: ExportFormat): string {
    const base = sanitizeFilenamePart(screen.name || `Screen ${index + 1}`).toLowerCase();
    return `${pad2(index + 1)}-${base}.${format}`;
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    // Some browsers (notably Safari) can produce empty/corrupt downloads if we revoke immediately.
    // Append to DOM to maximize compatibility, click, then revoke on a delay.
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
  }

  async exportScreen(
    screen: Screen,
    canvasSize: string,
    format: ExportFormat,
    quality: number = 90,
    allScreens?: Screen[],
    sharedBackground?: SharedBackground,
  ): Promise<Blob> {
    return this.renderScreenToImage(screen, canvasSize, format, quality, allScreens, sharedBackground);
  }

  async exportScreensToZip(
    screensByCanvasSize: Record<string, Screen[]>,
    selectedCanvasSizes: string[],
    format: ExportFormat,
    quality: number = 90,
    onProgress?: (current: number, total: number, screenName: string) => void,
    cancelToken?: CancelToken,
    sharedBackgrounds?: Record<string, SharedBackground>,
  ): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const canvasSizes = orderedCanvasSizes(selectedCanvasSizes);
    const total = canvasSizes.reduce((sum, cs) => sum + ((screensByCanvasSize[cs] || []).length), 0);

    let current = 0;
    let successCount = 0;
    for (const canvasSize of canvasSizes) {
      if (cancelToken?.cancelled) {
        throw new Error('EXPORT_CANCELLED');
      }

      const screens = screensByCanvasSize[canvasSize] || [];
      if (screens.length === 0) continue;

      const folder = zip.folder(canvasSize);
      if (!folder) continue;

      for (let i = 0; i < screens.length; i++) {
        if (cancelToken?.cancelled) {
          throw new Error('EXPORT_CANCELLED');
        }

        const screen = screens[i];
        const name = screen?.name || `Screen ${i + 1}`;

        try {
          const sharedBg = sharedBackgrounds?.[canvasSize];
          const blob = await this.exportScreen(screen, canvasSize, format, quality, screens, sharedBg);
          folder.file(this.generateFilename(screen, i, format), blob);
          successCount += 1;
        } catch (err) {
          // Skip individual failures; keep going.
          // eslint-disable-next-line no-console
          console.error(`Failed to export screen "${name}" (${canvasSize})`, err);
        }

        current += 1;
        onProgress?.(current, total, name);

        // Keep UI responsive on large exports.
        await sleep(50);
      }
    }

    if (cancelToken?.cancelled) {
      throw new Error('EXPORT_CANCELLED');
    }
    if (successCount === 0) {
      throw new Error('All screens failed to export.');
    }

    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  private async renderScreenToImage(
    screen: Screen,
    canvasSize: string,
    format: ExportFormat,
    quality: number,
    allScreens?: Screen[],
    sharedBackground?: SharedBackground,
  ): Promise<Blob> {
    const { createRoot } = await import('react-dom/client');
    // Prefer toBlob when available to avoid data URL edge cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { toPng, toJpeg, toBlob } = (await import('html-to-image')) as any;

    const orientation = screen?.settings?.orientation ?? 'portrait';
    const { width, height } = getCanvasDimensions(canvasSize, orientation);
    const isPro = this.isProUser();

    const container = document.createElement('div');
    container.style.position = 'fixed';
    // Keep it off-screen but still in the DOM/layout flow.
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.background = 'transparent';
    container.style.zIndex = '-1';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    const root = createRoot(container);
    try {
      root.render(
        // IMPORTANT: This is a separate React root; Mantine context does not cross roots.
        // Wrap with MantineProvider to avoid "MantineProvider was not found" crashes during export.
        <MantineProvider theme={theme}>
          <InteractionLockProvider>
            <ExportSurface
              screen={screen}
              canvasSize={canvasSize}
              width={width}
              height={height}
              isPro={isPro}
              allScreens={allScreens}
              sharedBackground={sharedBackground}
            />
          </InteractionLockProvider>
        </MantineProvider>
      );

      // Give React + media loading a moment.
      // (html-to-image will also attempt to inline assets, but this reduces flakiness.)
      await sleep(0);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch { /* ignore */ }
      }

      const node = container.firstElementChild as HTMLElement | null;
      if (!node) throw new Error('Export render failed: no node');

      // Wait for CSS background images to be available, especially OPFS blob URLs.
      const expectedMediaCount =
        new Set<number>([
          ...(typeof screen.settings.canvasBackgroundMediaId === 'number' ? [screen.settings.canvasBackgroundMediaId] : []),
          ...((screen.images || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((img) => !(img as any)?.cleared)
            .map((img) => img?.mediaId)
            .filter((id): id is number => typeof id === 'number')),
        ]).size;

      const waitStart = Date.now();
      while (expectedMediaCount > 0) {
        const urls = collectImageUrls(node);
        const blobCount = urls.filter((u) => u.startsWith('blob:')).length;
        if (blobCount >= expectedMediaCount) break;
        if (Date.now() - waitStart > 2500) break;
        await sleep(60);
      }

      const allUrls = collectImageUrls(node);

      // Preload any discovered images (best-effort).
      const urlsToPreload = allUrls
        .filter((u) => !u.startsWith('data:'))
        .slice(0, 40); // avoid pathological cases
      await Promise.all(urlsToPreload.map(preloadImage));

      const options = {
        cacheBust: true,
        pixelRatio: 1,
        // If tainting occurs, having useCORS may help when servers set proper headers.
        useCORS: true,
      };

      const nonBlobDataUrls = allUrls.filter((u) => !u.startsWith('blob:') && !u.startsWith('data:'));

      // IMPORTANT: Store uploads require exact pixel dimensions.
      // Since the node is already sized to the store resolution, use pixelRatio=1.
      const renderOnce = async (): Promise<Blob> => {
        if (format === 'png' && typeof toBlob === 'function') {
          const blob: Blob | null = await toBlob(node, options);
          if (blob && blob.size > 0) return blob;
        }

        const dataUrl =
          format === 'png'
            ? await toPng(node, options)
            : await toJpeg(node, { ...options, quality: Math.max(0, Math.min(1, quality / 100)) });
        return dataUrlToBlob(dataUrl);
      };

      // Retry a couple times to avoid rare “empty blob” races.
      let blob = await renderOnce();
      if (!blob || blob.size === 0) {
        await sleep(150);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        blob = await renderOnce();
      }
      if (!blob || blob.size === 0) {
        await sleep(300);
        blob = await renderOnce();
      }

      if (!blob || blob.size === 0) {
        const hints: string[] = [];
        if (nonBlobDataUrls.length > 0) {
          hints.push(`Non-blob image URLs detected (likely CORS): ${nonBlobDataUrls.slice(0, 3).join(', ')}${nonBlobDataUrls.length > 3 ? '…' : ''}`);
        }
        hints.push(`Expected media refs: ${expectedMediaCount}, discovered URLs: ${allUrls.length}`);
        hints.push(`Export size: ${width}×${height}px`);
        throw new Error(`Export render failed: empty blob. ${hints.join(' | ')}`);
      }
      return blob;
    } finally {
      try { root.unmount(); } catch { /* ignore */ }
      container.remove();
    }
  }
}

export const exportService = new ExportService();


