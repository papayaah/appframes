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
import { getBackgroundStyle } from '@/components/AppFrames/sharedBackgroundUtils';

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
    if (el.src && el.src.length < 10000) urls.add(el.src);
    if (el.currentSrc && el.currentSrc.length < 10000) urls.add(el.currentSrc);
  });
  // background-image urls
  root.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const inlineBg = htmlEl.style.backgroundImage;
    if (inlineBg && inlineBg !== 'none' && inlineBg.length < 10000) {
      extractCssUrls(inlineBg).forEach((u) => urls.add(u));
    }
    const bg = window.getComputedStyle(el as Element).backgroundImage;
    if (bg && bg !== 'none' && bg.length < 10000) {
      extractCssUrls(bg).forEach((u) => urls.add(u));
    }
  });
  return Array.from(urls).filter(u => u && !u.startsWith('data:'));
};

const blobToDataUrl = async (blobUrl: string): Promise<string> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(blobUrl);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to inline blob:', blobUrl, e);
    return blobUrl;
  }
};

const inlineBlobUrls = async (root: HTMLElement) => {
  const allUrls = collectImageUrls(root);
  const blobUrls = allUrls.filter((u) => u.startsWith('blob:'));
  if (blobUrls.length === 0) return;

  const blobMap = new Map<string, string>();
  for (const url of blobUrls) {
    if (!blobMap.has(url)) {
      blobMap.set(url, await blobToDataUrl(url));
    }
  }

  // Replace in <img> tags
  root.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    if (el.src.startsWith('blob:') && blobMap.has(el.src)) {
      el.src = blobMap.get(el.src)!;
    }
  });

  // Replace in background images
  root.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const bgs = [htmlEl.style.backgroundImage, window.getComputedStyle(el).backgroundImage];
    bgs.forEach((bg, i) => {
      if (bg && bg !== 'none' && bg.includes('blob:')) {
        let newBg = bg;
        blobMap.forEach((dataUrl, blobUrl) => {
          newBg = newBg.split(blobUrl).join(dataUrl);
        });
        if (i === 0) htmlEl.style.backgroundImage = newBg;
        else htmlEl.style.setProperty('background-image', newBg, 'important');
      }
    });
  });
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

function CanvasBackground({
  mediaId,
  blur,
  panX = 50,
  panY = 50,
  backgroundScale = 0,
  backgroundRotation = 0
}: {
  mediaId?: number;
  blur?: number;
  panX?: number;
  panY?: number;
  backgroundScale?: number;
  backgroundRotation?: number;
}) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  const hasBlur = blur != null && blur > 0;

  const rotationCompensation = [90, 270].includes(Math.abs(backgroundRotation % 360)) ? 1.42 : 1;
  const finalScale = (1 + backgroundScale / 100) * rotationCompensation;

  return (
    <div
      style={{
        position: 'absolute',
        inset: hasBlur ? `-${blur}px` : 0,
        clipPath: hasBlur ? `inset(${blur}px)` : undefined,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: `${panX}% ${panY}%`,
        backgroundRepeat: 'no-repeat',
        filter: hasBlur ? `blur(${blur}px)` : undefined,
        transform: `scale(${finalScale}) rotate(${backgroundRotation}deg)`,
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
  sharedImageDimensions,
}: {
  screen: Screen;
  canvasSize: string;
  width: number;
  height: number;
  isPro: boolean;
  allScreens?: Screen[];
  sharedBackground?: SharedBackground;
  sharedImageDimensions?: { width: number; height: number } | null;
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
      data-export-surface="true"
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
          imageDimensions={sharedImageDimensions}
        />
      ) : (
        <CanvasBackground
          mediaId={screenSettings.canvasBackgroundMediaId}
          blur={blurAmount}
          panX={screenSettings.screenPanX}
          panY={screenSettings.screenPanY}
          backgroundScale={screenSettings.backgroundScale}
          backgroundRotation={screenSettings.backgroundRotation}
        />
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
            onSelect={() => { }}
            onUpdate={() => { }}
            onDelete={() => { }}
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

    // Pre-resolve shared background dimensions to avoid useEffect delays during render
    let sharedImageDimensions: { width: number; height: number } | null = null;
    if (sharedBackground?.type === 'image' && sharedBackground.mediaId) {
      try {
        const db = await (import('@reactkits.dev/react-media-library').then(m => m.initDB()));
        const asset = await db.get('assets', sharedBackground.mediaId);
        if (asset?.width && asset.height) {
          sharedImageDimensions = { width: asset.width, height: asset.height };
        }
      } catch (err) {
        console.warn('Failed to pre-resolve shared background dimensions', err);
      }
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    // Use conventional positioning but keep it hidden from human eyes
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.background = 'transparent';
    container.style.zIndex = '-10000';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    container.id = 'appframes-export-container';
    document.body.appendChild(container);

    const root = createRoot(container);
    try {
      root.render(
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
              sharedImageDimensions={sharedImageDimensions}
            />
          </InteractionLockProvider>
        </MantineProvider>
      );

      // Give React a moment to render
      await sleep(100);

      // Wait for React to commit meaningful content
      const renderWaitStart = Date.now();
      while (Date.now() - renderWaitStart < 3000) {
        // Look for any element that might be a frame or text
        const hasContent = container.querySelector('[data-frame-drop-zone="true"], .canvas-text-element');
        if (hasContent) break;
        await sleep(100);
      }

      const node = container.querySelector('[data-export-surface="true"]') as HTMLElement | null
        || container.firstElementChild as HTMLElement | null;

      if (!node) throw new Error('Export render failed: DOM remains empty after 3s');

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch { /* ignore */ }
      }

      // Wait for CSS background images to be available, especially OPFS blob URLs.
      const expectedMediaCount =
        new Set<number>([
          ...(typeof screen.settings.canvasBackgroundMediaId === 'number' ? [screen.settings.canvasBackgroundMediaId] : []),
          ...((screen.images || [])
            .filter((img) => !(img as any)?.cleared)
            .map((img) => img?.mediaId)
            .filter((id): id is number => typeof id === 'number')),
        ]).size;

      const waitStart = Date.now();
      let allUrls: string[] = [];
      while (expectedMediaCount > 0) {
        allUrls = collectImageUrls(container);
        const blobCount = allUrls.filter((u) => u.startsWith('blob:')).length;
        if (blobCount >= expectedMediaCount) break;
        if (Date.now() - waitStart > 10000) { // 10s for high-res exports
          console.warn(`Export timeout waiting for ${expectedMediaCount} media items. Found: ${blobCount}`);
          break;
        }
        await sleep(150);
      }

      // STEP: Manually inline blobs to prevent ERR_FILE_NOT_FOUND in html-to-image
      await inlineBlobUrls(container);

      const finalUrls = collectImageUrls(container);
      // Preload any discovered images (best-effort).
      const urlsToPreload = finalUrls
        .slice(0, 40); // avoid pathological cases
      await Promise.all(urlsToPreload.map(preloadImage));

      // Visual stability wait
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await sleep(100);

      const options = {
        cacheBust: true,
        pixelRatio: 1,
        width,
        height,
        // If tainting occurs, having useCORS may help when servers set proper headers.
        useCORS: true,
      };

      const nonBlobDataUrls = allUrls.filter((u) => !u.startsWith('blob:') && !u.startsWith('data:'));

      // IMPORTANT: Store uploads require exact pixel dimensions.
      // Since the node is already sized to the store resolution, use pixelRatio=1.
      const renderOnce = async (skipFonts = false): Promise<Blob> => {
        const renderOptions = {
          ...options,
          ...(skipFonts ? { skipFonts: true } : {}),
        };

        if (format === 'png' && typeof toBlob === 'function') {
          const blob: Blob | null = await toBlob(node, renderOptions);
          if (blob && blob.size > 0) return blob;
        }

        const dataUrl =
          format === 'png'
            ? await toPng(node, renderOptions)
            : await toJpeg(node, { ...renderOptions, quality: Math.max(0, Math.min(1, quality / 100)) });
        return dataUrlToBlob(dataUrl);
      };

      // Retry a couple times to avoid rare “empty blob” races.
      let blob;
      try {
        blob = await renderOnce(false);
      } catch (err) {
        console.warn('Initial render failed, retrying without fonts...', err);
        blob = await renderOnce(true);
      }

      if (!blob || blob.size === 0) {
        await sleep(150);
        blob = await renderOnce(false);
      }
      if (!blob || blob.size === 0) {
        await sleep(300);
        blob = await renderOnce(true); // Last resort: skip fonts
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


