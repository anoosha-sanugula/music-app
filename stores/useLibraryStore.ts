import { create } from 'zustand';
import type { Album } from '@/types/Library';
import { loadLibrary, saveLibrary } from '@/services/libraryPersistence';

interface LibraryState {
  likedSongIds: string[];
  albums: Album[];
  isLoaded: boolean;
  isLoading: boolean;
  loadLibrary: () => Promise<void>;
  toggleLike: (songId: string) => void;
  addAlbum: (name: string) => void;
  renameAlbum: (albumId: string, newName: string) => void;
  deleteAlbum: (albumId: string) => void;
  addSongToAlbum: (albumId: string, songId: string) => void;
  removeSongFromAlbum: (albumId: string, songId: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongIds: [],
  albums: [],
  isLoaded: false,
  isLoading: false,

  loadLibrary: async () => {
    set({ isLoading: true });
    const data = await loadLibrary();
    set({
      likedSongIds: data.likedSongIds,
      albums: data.albums,
      isLoaded: true,
      isLoading: false,
    });
  },

  toggleLike: (songId) => {
    const { likedSongIds, albums } = get();
    const newLikedSongIds = likedSongIds.includes(songId)
      ? likedSongIds.filter((id) => id !== songId)
      : [...likedSongIds, songId];

    set({ likedSongIds: newLikedSongIds });
    saveLibrary({ likedSongIds: newLikedSongIds, albums, version: 1 });
  },

  addAlbum: (name) => {
    const { albums, likedSongIds } = get();
    const newAlbum: Album = {
      id: generateId(),
      name,
      songIds: [],
      createdAt: new Date().toISOString(),
    };
    const newAlbums = [...albums, newAlbum];
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds, albums: newAlbums, version: 1 });
  },

  renameAlbum: (albumId, newName) => {
    const { albums, likedSongIds } = get();
    const newAlbums = albums.map((album) =>
      album.id === albumId ? { ...album, name: newName } : album
    );
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds, albums: newAlbums, version: 1 });
  },

  deleteAlbum: (albumId) => {
    const { albums, likedSongIds } = get();
    const newAlbums = albums.filter((album) => album.id !== albumId);
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds, albums: newAlbums, version: 1 });
  },

  addSongToAlbum: (albumId, songId) => {
    const { albums, likedSongIds } = get();
    const newAlbums = albums.map((album) =>
      album.id === albumId && !album.songIds.includes(songId)
        ? { ...album, songIds: [...album.songIds, songId] }
        : album
    );
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds, albums: newAlbums, version: 1 });
  },

  removeSongFromAlbum: (albumId, songId) => {
    const { albums, likedSongIds } = get();
    const newAlbums = albums.map((album) =>
      album.id === albumId
        ? { ...album, songIds: album.songIds.filter((id) => id !== songId) }
        : album
    );
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds, albums: newAlbums, version: 1 });
  },
}));
