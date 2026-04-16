import { create } from 'zustand';
import type { Song } from '@/types/Song';
import type { PermissionStatus } from '@/services/permissionService';

interface PlayerState {
  permissionStatus: PermissionStatus;
  songs: Song[];
  isLoadingSongs: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  setPermissionStatus: (status: PermissionStatus) => void;
  setSongs: (songs: Song[]) => void;
  setLoadingSongs: (loading: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  permissionStatus: 'undetermined',
  songs: [],
  isLoadingSongs: false,
  currentSong: null,
  isPlaying: false,
  queue: [],
  queueIndex: 0,
  setPermissionStatus: (status) => set({ permissionStatus: status }),
  setSongs: (songs) => set({ songs }),
  setLoadingSongs: (loading) => set({ isLoadingSongs: loading }),
}));
