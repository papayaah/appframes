import Dexie, { Table } from 'dexie';

export interface MediaFile {
  id?: number;
  name: string;
  fileHandle: string; // OPFS file path
  thumbnail: string; // Base64 thumbnail for quick display
  width: number;
  height: number;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AppFramesDB extends Dexie {
  mediaFiles!: Table<MediaFile>;

  constructor() {
    super('AppFrames');
    this.version(1).stores({
      mediaFiles: '++id, name, createdAt',
    });
  }
}

export const db = new AppFramesDB();
