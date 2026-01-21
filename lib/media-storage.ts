/**
 * Local file storage utility for media assets
 * 
 * Stores files on the server's filesystem instead of S3.
 * Files are organized by user ID and date for easier management.
 */

import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const MEDIA_STORAGE_PATH = process.env.MEDIA_STORAGE_PATH || '/srv/appframes/media';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB default max

/**
 * Get the storage path for a user's media files
 */
export function getUserMediaPath(userId: string): string {
  return join(MEDIA_STORAGE_PATH, userId);
}

/**
 * Generate a unique filename with extension
 */
export function generateMediaFilename(
  originalFileName: string,
  userId: string,
  timestamp: number = Date.now()
): string {
  const ext = originalFileName.split('.').pop() || 'bin';
  const sanitized = originalFileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);
  return `${timestamp}-${sanitized}.${ext}`;
}

/**
 * Save a file to local storage
 * Returns the relative path (from MEDIA_STORAGE_PATH)
 */
export async function saveMediaFile(
  userId: string,
  file: File | Buffer,
  originalFileName: string
): Promise<string> {
  const userPath = getUserMediaPath(userId);
  await mkdir(userPath, { recursive: true });

  const filename = generateMediaFilename(originalFileName, userId);
  const filePath = join(userPath, filename);
  const relativePath = `${userId}/${filename}`;

  // Convert File to Buffer if needed
  const buffer = file instanceof File
    ? Buffer.from(await file.arrayBuffer())
    : file;

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  await writeFile(filePath, buffer);
  return relativePath;
}

/**
 * Read a media file from storage
 */
export async function readMediaFile(relativePath: string): Promise<Buffer> {
  const fullPath = join(MEDIA_STORAGE_PATH, relativePath);
  
  // Security: ensure path is within MEDIA_STORAGE_PATH
  const resolvedPath = join(MEDIA_STORAGE_PATH, relativePath);
  if (!resolvedPath.startsWith(MEDIA_STORAGE_PATH)) {
    throw new Error('Invalid file path');
  }

  if (!existsSync(fullPath)) {
    throw new Error('File not found');
  }

  return readFile(fullPath);
}

/**
 * Delete a media file from storage
 */
export async function deleteMediaFile(relativePath: string): Promise<void> {
  const fullPath = join(MEDIA_STORAGE_PATH, relativePath);
  
  // Security: ensure path is within MEDIA_STORAGE_PATH
  const resolvedPath = join(MEDIA_STORAGE_PATH, relativePath);
  if (!resolvedPath.startsWith(MEDIA_STORAGE_PATH)) {
    throw new Error('Invalid file path');
  }

  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

/**
 * Get file stats (size, etc.)
 */
export async function getMediaFileStats(relativePath: string) {
  const fullPath = join(MEDIA_STORAGE_PATH, relativePath);
  
  // Security: ensure path is within MEDIA_STORAGE_PATH
  const resolvedPath = join(MEDIA_STORAGE_PATH, relativePath);
  if (!resolvedPath.startsWith(MEDIA_STORAGE_PATH)) {
    throw new Error('Invalid file path');
  }

  return stat(fullPath);
}

/**
 * Save a thumbnail file
 */
export async function saveThumbnail(
  userId: string,
  thumbnail: Buffer,
  originalFileName: string
): Promise<string> {
  const userPath = getUserMediaPath(userId);
  await mkdir(userPath, { recursive: true });

  const ext = 'jpg'; // Thumbnails are always JPG
  const timestamp = Date.now();
  const filename = `thumb-${timestamp}-${originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 30)}.${ext}`;
  const filePath = join(userPath, filename);
  const relativePath = `${userId}/${filename}`;

  await writeFile(filePath, thumbnail);
  return relativePath;
}
