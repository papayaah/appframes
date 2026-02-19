'use client';

import { notifications } from '@mantine/notifications';
import { Screen, CanvasSettings } from '../types';
import { getCanvasDimensions } from '../FramesContext';
import { exportService } from '@/lib/ExportService';

interface UseAppFramesDownloadProps {
    screens: Screen[];
    selectedScreenIndices: number[];
    settings: CanvasSettings;
    mediaCache: Record<number, string>;
    downloadFormat: 'png' | 'jpg';
    downloadJpegQuality: number;
}

export function useAppFramesDownload({
    screens,
    selectedScreenIndices,
    settings,
    mediaCache,
    downloadFormat,
    downloadJpegQuality,
}: UseAppFramesDownloadProps) {
    const handleDownload = async () => {
        try {
            const canvasSize = settings.canvasSize;
            const { toPng } = await import('html-to-image');
            const { initDB, getFileFromOpfs } = await import('@reactkits.dev/react-media-library');
            const mediaDb = await initDB();

            const fileToDataUrl = (file: File) =>
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                });

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

            const replaceBlobUrlsWithDataUrls = async (root: HTMLElement) => {
                const reverse = new Map<string, number>();
                Object.entries(mediaCache || {}).forEach(([id, url]) => {
                    if (url) reverse.set(url, Number(id));
                });

                const blobToData = new Map<string, string>();
                const ensureDataUrl = async (blobUrl: string): Promise<string | null> => {
                    if (blobToData.has(blobUrl)) return blobToData.get(blobUrl)!;

                    const mediaId = reverse.get(blobUrl);
                    if (typeof mediaId === 'number' && Number.isFinite(mediaId)) {
                        const asset = await mediaDb.get('assets', mediaId);
                        if (asset) {
                            const file = await getFileFromOpfs(asset.handleName);
                            if (file) {
                                const dataUrl = await fileToDataUrl(file);
                                blobToData.set(blobUrl, dataUrl);
                                return dataUrl;
                            }
                        }
                    }

                    try {
                        const resp = await fetch(blobUrl);
                        const blob = await resp.blob();
                        const file = new File([blob], 'image', { type: blob.type || 'image/png' });
                        const dataUrl = await fileToDataUrl(file);
                        blobToData.set(blobUrl, dataUrl);
                        return dataUrl;
                    } catch {
                        return null;
                    }
                };

                const restoreFns: Array<() => void> = [];
                const nodes: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
                for (const el of nodes) {
                    const prevBgImg = el.style.backgroundImage;
                    const prevBg = el.style.background;
                    const urls = [
                        ...extractCssUrls(prevBgImg),
                        ...extractCssUrls(prevBg),
                    ].filter((u) => u.startsWith('blob:'));
                    if (urls.length === 0) continue;

                    let nextBgImg = prevBgImg;
                    let nextBg = prevBg;
                    for (const u of urls) {
                        const dataUrl = await ensureDataUrl(u);
                        if (!dataUrl) continue;
                        if (nextBgImg) nextBgImg = nextBgImg.split(u).join(dataUrl);
                        if (nextBg) nextBg = nextBg.split(u).join(dataUrl);
                    }

                    if (nextBgImg !== prevBgImg) {
                        restoreFns.push(() => { el.style.backgroundImage = prevBgImg; });
                        el.style.backgroundImage = nextBgImg;
                    }
                    if (nextBg !== prevBg) {
                        restoreFns.push(() => { el.style.background = prevBg; });
                        el.style.background = nextBg;
                    }
                }

                return () => restoreFns.forEach((fn) => fn());
            };

            for (const screenIndex of selectedScreenIndices) {
                const screen = screens[screenIndex];
                if (!screen) continue;
                const canvasElement = document.getElementById(`canvas-${screen.id}`) as HTMLElement | null;
                if (!canvasElement) continue;

                const dims = getCanvasDimensions(canvasSize, screen.settings.orientation ?? 'portrait');
                const rect = canvasElement.getBoundingClientRect();

                document.body.dataset.appframesExporting = 'true';
                const prevOverflow = canvasElement.style.overflow;
                canvasElement.style.overflow = 'visible';
                const restoreBg = await replaceBlobUrlsWithDataUrls(canvasElement);
                try {
                    const ratioX = rect.width > 0 ? dims.width / rect.width : 1;
                    const ratioY = rect.height > 0 ? dims.height / rect.height : 1;
                    const captureRatio = Math.max(2, Math.min(4, Math.ceil(Math.max(ratioX, ratioY))));

                    const dataUrl = await toPng(canvasElement, {
                        cacheBust: true,
                        pixelRatio: captureRatio,
                        backgroundColor: screen.settings.backgroundColor === 'transparent' ? 'transparent' : undefined,
                        filter: (node) => {
                            if (!(node instanceof HTMLElement)) return true;
                            return node.dataset.exportHide !== 'true';
                        },
                    });

                    const img = new Image();
                    img.decoding = 'async';
                    img.src = dataUrl;
                    try {
                        // @ts-ignore
                        await img.decode?.();
                    } catch {
                        await new Promise<void>((resolve, reject) => {
                            img.onload = () => resolve();
                            img.onerror = () => reject(new Error('Failed to load export image'));
                        });
                    }

                    const out = document.createElement('canvas');
                    out.width = dims.width;
                    out.height = dims.height;
                    const ctx = out.getContext('2d');
                    if (!ctx) throw new Error('Canvas 2D context unavailable');

                    const bg = screen.settings.backgroundColor;
                    if (downloadFormat === 'jpg') {
                        ctx.fillStyle = bg && bg !== 'transparent' ? bg : '#ffffff';
                        ctx.fillRect(0, 0, out.width, out.height);
                    } else if (bg && bg !== 'transparent') {
                        ctx.fillStyle = bg;
                        ctx.fillRect(0, 0, out.width, out.height);
                    }

                    const s = Math.min(out.width / img.width, out.height / img.height);
                    const dw = Math.round(img.width * s);
                    const dh = Math.round(img.height * s);
                    const dx = Math.round((out.width - dw) / 2);
                    const dy = Math.round((out.height - dh) / 2);
                    ctx.drawImage(img, dx, dy, dw, dh);

                    const outMime = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
                    const outExt = downloadFormat === 'jpg' ? 'jpg' : 'png';
                    const blob = await new Promise<Blob>((resolve, reject) => {
                        out.toBlob(
                            (b) => (b ? resolve(b) : reject(new Error(`Failed to encode ${outExt.toUpperCase()}`))),
                            outMime,
                            downloadFormat === 'jpg' ? Math.max(0, Math.min(1, downloadJpegQuality / 100)) : undefined,
                        );
                    });
                    exportService.downloadBlob(blob, `${screen.name || `screen-${screenIndex + 1}`}-${Date.now()}.${outExt}`);
                } finally {
                    canvasElement.style.overflow = prevOverflow;
                    restoreBg?.();
                    delete document.body.dataset.appframesExporting;
                }

                if (selectedScreenIndices.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        } catch (error) {
            console.error('Download failed:', error);
            const msg = error instanceof Error ? error.message : String(error);
            notifications.show({
                title: 'Download failed',
                message: msg || 'Please try again.',
                color: 'red',
            });
        }
    };

    return { handleDownload };
}
