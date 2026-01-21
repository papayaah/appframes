/**
 * Media Asset Thumbnail API Route
 * 
 * Uses the media library package's Next.js route handlers.
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { createMediaThumbnailRoute } from '@reactkits.dev/react-media-library/server/nextjs/routes';

export const { GET } = createMediaThumbnailRoute({
    getUserId: async () => {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session?.user?.id || null;
    },
    db,
    mediaAssetsTable: mediaAssets,
});
