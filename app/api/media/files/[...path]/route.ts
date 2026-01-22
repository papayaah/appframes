/**
 * Media Files by Path API Routes
 * 
 * Simplified version - Download/Delete by path (no database needed)
 * Uses the media library package's Next.js route handlers.
 * 
 * Usage:
 * - GET /api/media/files/{userId}/filename.jpg
 * - DELETE /api/media/files/{userId}/filename.jpg
 * 
 * Security: Verifies the userId in the path matches the current session
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createMediaFileByPathRoutes } from '@reactkits.dev/react-media-library/server/nextjs/routes';

export const { GET, DELETE } = createMediaFileByPathRoutes({
    getUserId: async () => {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session?.user?.id || null;
    },
});
