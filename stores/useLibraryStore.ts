import { create } from 'zustand';

interface LibraryState {
  likedSongIds: string[];
  albums: Album[];
}

interface Album {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  likedSongIds: [],
  albums: [],
}));
