import { create } from 'zustand';
import { Audio } from 'expo-av';
import type { Song } from '@/types/Song';
import type { PermissionStatus } from '@/services/permissionService';

let lastTrackChange = 0;
const DEBOUNCE_MS = 300;

interface PlayerState {
  permissionStatus: PermissionStatus;
  songs: Song[];
  isLoadingSongs: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Song[];
  queueIndex: number;
  repeatMode: 'off' | 'all' | 'one';
  isShuffled: boolean;
  isAudioConfigured: boolean;
  setPermissionStatus: (status: PermissionStatus) => void;
  setSongs: (songs: Song[]) => void;
  setLoadingSongs: (loading: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: Song[], startIndex?: number) => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
  initializeAudio: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  permissionStatus: 'undetermined',
  songs: [],
  isLoadingSongs: false,
  currentSong: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  repeatMode: 'off',
  isShuffled: false,
  isAudioConfigured: false,
  setPermissionStatus: (status) => set({ permissionStatus: status }),
  setSongs: (songs) => set({ songs }),
  setLoadingSongs: (loading) => set({ isLoadingSongs: loading }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setQueue: (queue, startIndex = 0) => set({ queue, queueIndex: startIndex }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  cycleRepeatMode: () =>
    set((state) => {
      const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeatMode: modes[nextIndex] };
    }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  playNext: () => {
    const now = Date.now();
    if (now - lastTrackChange < DEBOUNCE_MS) return;
    lastTrackChange = now;

    const { queue, queueIndex, repeatMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      set({ queueIndex });
    } else if (queueIndex < queue.length - 1) {
      set({ queueIndex: queueIndex + 1 });
    } else if (repeatMode === 'all') {
      set({ queueIndex: 0 });
    }
  },
  playPrevious: () => {
    const now = Date.now();
    if (now - lastTrackChange < DEBOUNCE_MS) return;
    lastTrackChange = now;

    const { queue, queueIndex } = get();
    if (queue.length === 0) return;

    if (queueIndex > 0) {
      set({ queueIndex: queueIndex - 1 });
    }
  },
  initializeAudio: async () => {
    if (get().isAudioConfigured) return;
    
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    set({ isAudioConfigured: true });
  },
}));
