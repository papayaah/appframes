import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const pexelsDir = path.join(process.cwd(), 'public', 'pexels_images');

  try {
    const files = fs.readdirSync(pexelsDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const stats = fs.statSync(path.join(pexelsDir, file));
        return {
          name: file,
          url: `/pexels_images/${file}`,
          size: stats.size,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading pexels_images directory:', error);
    return NextResponse.json({ images: [], error: 'Failed to read directory' }, { status: 500 });
  }
}
