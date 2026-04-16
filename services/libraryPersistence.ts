import { Paths, File } from 'expo-file-system';
import type { LibraryData } from '@/types/Library';

const LIBRARY_VERSION = 1;

interface StoredLibrary {
  likedSongIds: string[];
  albums: LibraryData['albums'];
  version: number;
}

function getLibraryFile(): File {
  return new File(Paths.document, 'library-store.json');
}

export async function loadLibrary(): Promise<LibraryData> {
  try {
    const file = getLibraryFile();

    if (!file.exists) {
      return getDefaultLibrary();
    }

    const content = await file.text();
    const data: StoredLibrary = JSON.parse(content);

    if (!data || typeof data !== 'object') {
      return getDefaultLibrary();
    }

    return {
      likedSongIds: Array.isArray(data.likedSongIds) ? data.likedSongIds : [],
      albums: Array.isArray(data.albums) ? data.albums : [],
      version: data.version || 1,
    };
  } catch {
    return getDefaultLibrary();
  }
}

export async function saveLibrary(data: LibraryData): Promise<void> {
  const file = getLibraryFile();
  const content = JSON.stringify({
    likedSongIds: data.likedSongIds,
    albums: data.albums,
    version: LIBRARY_VERSION,
  });

  await file.write(content);
}

function getDefaultLibrary(): LibraryData {
  return {
    likedSongIds: [],
    albums: [],
    version: LIBRARY_VERSION,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
