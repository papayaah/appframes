import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { OPFSManager } from '../lib/opfs';
import { useFrames } from '../components/AppFrames/FramesContext';

export function useMediaImage(mediaId: number | undefined) {
  const { mediaCache, setCachedMedia } = useFrames();
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

        const media = await db.mediaFiles.get(mediaId);
        if (!media) {
          if (active) {
            setImageUrl(undefined);
            setLoading(false);
          }
          return;
        }

        const file = await OPFSManager.getFile(media.fileHandle);
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
