import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { saveMediaFile, saveThumbnail } from '@/lib/media-storage';

/**
 * POST /api/media/assets
 * Upload a new media file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type from MIME type
    const mimeType = file.type;
    const fileType = mimeType.startsWith('image/') ? 'image'
      : mimeType.startsWith('video/') ? 'video'
      : mimeType.startsWith('audio/') ? 'audio'
      : mimeType.includes('pdf') || mimeType.includes('document') ? 'document'
      : 'other';

    // Save file to local storage
    const relativePath = await saveMediaFile(session.user.id, file, file.name);

    // Extract dimensions for images (optional - can be added later with sharp or similar)
    // For now, we'll skip dimension extraction and thumbnail generation
    // These can be added later if needed using a server-side image library like 'sharp'
    let width: number | undefined;
    let height: number | undefined;
    let thumbnailPath: string | undefined;

    // TODO: Add image dimension extraction and thumbnail generation using 'sharp' if needed
    // Example:
    // if (fileType === 'image') {
    //   const sharp = await import('sharp');
    //   const metadata = await sharp(buffer).metadata();
    //   width = metadata.width;
    //   height = metadata.height;
    //   const thumb = await sharp(buffer).resize(200, 200, { fit: 'inside' }).jpeg().toBuffer();
    //   thumbnailPath = await saveThumbnail(session.user.id, thumb, file.name);
    // }

    // Save metadata to database
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        userId: session.user.id,
        fileName: file.name,
        fileType,
        mimeType,
        size: file.size,
        width,
        height,
        path: relativePath,
        thumbnailPath,
      })
      .returning();

    return NextResponse.json({
      id: asset.id,
      fileName: asset.fileName,
      fileType: asset.fileType,
      mimeType: asset.mimeType,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      path: asset.path,
      thumbnailPath: asset.thumbnailPath,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });
  } catch (error: any) {
    console.error('[Media Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload media', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/assets
 * List all media assets for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.userId, session.user.id))
      .orderBy(desc(mediaAssets.createdAt));

    return NextResponse.json(
      assets.map((asset) => ({
        id: asset.id,
        fileName: asset.fileName,
        fileType: asset.fileType,
        mimeType: asset.mimeType,
        size: asset.size,
        width: asset.width,
        height: asset.height,
        path: asset.path,
        thumbnailPath: asset.thumbnailPath,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      }))
    );
  } catch (error: any) {
    console.error('[Media List API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list media', details: error?.message },
      { status: 500 }
    );
  }
}
