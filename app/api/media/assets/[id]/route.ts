/**
 * Media Asset by ID API Routes
 * 
 * Uses the media library package's Next.js route handlers.
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { createMediaAssetByIdRoutes } from '@reactkits.dev/react-media-library/server/nextjs/routes';

export const { GET, DELETE } = createMediaAssetByIdRoutes({
    getUserId: async () => {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session?.user?.id || null;
    },
    db,
    mediaAssetsTable: mediaAssets,
});
