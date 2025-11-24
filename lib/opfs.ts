// OPFS (Origin Private File System) utilities

export class OPFSManager {
  private static root: FileSystemDirectoryHandle | null = null;

  static async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      this.root = await navigator.storage.getDirectory();
    }
    return this.root;
  }

  static async saveFile(fileName: string, blob: Blob): Promise<string> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return fileName;
  }

  static async getFile(fileName: string): Promise<File | null> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle(fileName);
      return await fileHandle.getFile();
    } catch (error) {
      console.error('Error getting file from OPFS:', error);
      return null;
    }
  }

  static async deleteFile(fileName: string): Promise<void> {
    try {
      const root = await this.getRoot();
      await root.removeEntry(fileName);
    } catch (error) {
      console.error('Error deleting file from OPFS:', error);
    }
  }

  static async listFiles(): Promise<string[]> {
    const root = await this.getRoot();
    const files: string[] = [];
    // @ts-ignore - TypeScript doesn't have full OPFS types yet
    for await (const entry of root.values()) {
      if (entry.kind === 'file') {
        files.push(entry.name);
      }
    }
    return files;
  }
}
