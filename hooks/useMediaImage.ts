import { useContext, useEffect, useState } from 'react';
import { getFileFromOpfs, initDB } from '@reactkits.dev/react-media-library';
import { FramesContextInternal } from '../components/AppFrames/FramesContext';

// Fallback cache used when `FramesProvider` is not present (e.g. off-screen export rendering).
// This is intentionally simple; it mainly prevents repeated OPFS reads during a single export.
const fallbackMediaCache: Record<number, string> = {};

export function useMediaImage(mediaId: number | undefined) {
  const frames = useContext(FramesContextInternal);
  const mediaCache = frames?.mediaCache ?? fallbackMediaCache;
  const setCachedMedia = frames?.setCachedMedia ?? ((id: number, url: string) => {
    fallbackMediaCache[id] = url;
  });
  // Initialize local URL from cache synchronously to prevent flash
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    mediaId ? mediaCache[mediaId] : undefined
  );
  const [loading, setLoading] = useState(!imageUrl && !!mediaId);

  useEffect(() => {
    if (!mediaId) {
      setImageUrl(undefined);
      setLoading(false);
      return;
    }

    // Check cache first
    if (mediaCache[mediaId]) {
      setImageUrl(mediaCache[mediaId]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let active = true;

    const loadImage = async () => {
      try {
        // Double check cache in case it was populated while we were waiting
        if (mediaCache[mediaId]) {
          if (active) {
            setImageUrl(mediaCache[mediaId]);
            setLoading(false);
          }
          return;
        }

        const db = await initDB();
        const asset = await db.get('assets', mediaId);
        if (!asset) {
          if (active) {
            setImageUrl(undefined);
            setLoading(false);
          }
          return;
        }

        const file = await getFileFromOpfs(asset.handleName);
        if (file) {
          const objectUrl = URL.createObjectURL(file);
          
          // Update global cache
          setCachedMedia(mediaId, objectUrl);
          
          if (active) {
            setImageUrl(objectUrl);
          }
        }
      } catch (error) {
        console.error('Error loading media:', error);
        if (active) {
          setImageUrl(undefined);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      active = false;
    };
  }, [mediaId, mediaCache, setCachedMedia]);

  // Sync state if cache updates from elsewhere
  useEffect(() => {
    if (mediaId && mediaCache[mediaId] && mediaCache[mediaId] !== imageUrl) {
      setImageUrl(mediaCache[mediaId]);
    }
  }, [mediaCache, mediaId, imageUrl]);

  return { imageUrl, loading };
}
