/**
 * Media Assets API Routes
 * 
 * Uses the media library package's Next.js route handlers.
 * Just import and re-export - no custom code needed!
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { createMediaAssetsRoutes } from '@reactkits.dev/react-media-library/server/nextjs/routes';

export const { POST, GET } = createMediaAssetsRoutes({
    getUserId: async () => {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session?.user?.id || null;
    },
    db,
    mediaAssetsTable: mediaAssets,
});
