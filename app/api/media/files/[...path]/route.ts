/**
 * SIMPLIFIED VERSION - Download/Delete by path (no database needed)
 * 
 * Usage:
 * - GET /api/media/files/{userId}/filename.jpg
 * - DELETE /api/media/files/{userId}/filename.jpg
 * 
 * Security: Verifies the userId in the path matches the current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { readMediaFile, deleteMediaFile } from '@/lib/media-storage';

/**
 * GET /api/media/files/[...path]
 * Download a file by path
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path: pathArray } = await context.params;
    const relativePath = pathArray.join('/');

    // Security: Verify the path starts with the current user's ID
    if (!relativePath.startsWith(session.user.id + '/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Read file
    const fileBuffer = await readMediaFile(relativePath);

    // Extract filename from path
    const fileName = pathArray[pathArray.length - 1];

    // Determine MIME type from extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      pdf: 'application/pdf',
    };
    const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    if (error.message === 'File not found') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('[Media Download API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download media', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/files/[...path]
 * Delete a file by path
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path: pathArray } = await context.params;
    const relativePath = pathArray.join('/');

    // Security: Verify the path starts with the current user's ID
    if (!relativePath.startsWith(session.user.id + '/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete file
    await deleteMediaFile(relativePath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Media Delete API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media', details: error?.message },
      { status: 500 }
    );
  }
}
