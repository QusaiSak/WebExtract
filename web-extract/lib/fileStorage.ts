// Simple file storage utility for downloads
// In production, this should use a proper database or cloud storage

interface StoredFile {
  content: string;
  contentType: string;
  fileName: string;
  createdAt: Date;
}

// In-memory storage (replace with database in production)
// Persist across HMR and route module reloads by attaching to globalThis
const globalAny = globalThis as any;
const fileStorage: Map<string, StoredFile> =
  globalAny.__webextract_file_storage || new Map<string, StoredFile>();

// Ensure single instance
globalAny.__webextract_file_storage = fileStorage;

export function storeFile(id: string, content: string, contentType: string, fileName: string): void {
  fileStorage.set(id, {
    content,
    contentType,
    fileName,
    createdAt: new Date()
  });

  // Clean up old files after 24 hours
  setTimeout(() => {
    fileStorage.delete(id);
  }, 24 * 60 * 60 * 1000);
}

export function getFile(id: string): StoredFile | null {
  const file = fileStorage.get(id);
  if (!file) return null;

  // Check if file is expired (older than 24 hours)
  const hoursSinceCreation = (Date.now() - file.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation > 24) {
    fileStorage.delete(id);
    return null;
  }

  return file;
}

export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
