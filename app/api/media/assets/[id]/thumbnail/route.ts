import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readMediaFile } from '@/lib/media-storage';

/**
 * GET /api/media/assets/[id]/thumbnail
 * Get thumbnail for a media file
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Get asset from database
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Verify ownership
    if (asset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use thumbnail if available, otherwise fall back to original
    const path = asset.thumbnailPath || asset.path;
    const fileBuffer = await readMediaFile(path);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': asset.thumbnailPath ? 'image/jpeg' : asset.mimeType,
        'Content-Disposition': `inline; filename="thumb-${asset.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Media Thumbnail API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get thumbnail', details: error?.message },
      { status: 500 }
    );
  }
}
