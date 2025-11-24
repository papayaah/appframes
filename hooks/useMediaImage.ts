import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { OPFSManager } from '../lib/opfs';

export function useMediaImage(mediaId: number | undefined) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mediaId) {
      setImageUrl(undefined);
      setLoading(false);
      return;
    }

    let objectUrl: string | undefined;

    const loadImage = async () => {
      try {
        const media = await db.mediaFiles.get(mediaId);
        if (!media) {
          setImageUrl(undefined);
          setLoading(false);
          return;
        }

        const file = await OPFSManager.getFile(media.fileHandle);
        if (file) {
          objectUrl = URL.createObjectURL(file);
          setImageUrl(objectUrl);
        }
      } catch (error) {
        console.error('Error loading media:', error);
        setImageUrl(undefined);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [mediaId]);

  return { imageUrl, loading };
}
