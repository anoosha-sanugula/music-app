import type { Song } from '@/types/Song';
import { usePlayerStore } from '@/stores';

let originalQueue: Song[] = [];

export function playNow(song: Song, allSongs: Song[]) {
  const { setQueue } = usePlayerStore.getState();
  const songIndex = allSongs.findIndex((s) => s.id === song.id);
  originalQueue = [...allSongs];
  setQueue(allSongs, songIndex);
}

export function playNext(song: Song) {
  const { queue, queueIndex, setQueue } = usePlayerStore.getState();
  const newQueue = [
    ...queue.slice(0, queueIndex + 1),
    song,
    ...queue.slice(queueIndex + 1),
  ];
  setQueue(newQueue, queueIndex);
}

export function addToQueue(song: Song) {
  const { queue, setQueue } = usePlayerStore.getState();
  setQueue([...queue, song]);
}

export function toggleShuffle() {
  const { isShuffled, queue, queueIndex, setQueue, toggleShuffle: storeToggleShuffle } = usePlayerStore.getState();

  if (!isShuffled) {
    originalQueue = [...queue];
    const currentSong = queue[queueIndex];
    const remaining = queue.filter((_, i) => i !== queueIndex);
    const shuffled = shuffleArray(remaining);
    setQueue([currentSong, ...shuffled], 0);
  } else {
    const currentSong = usePlayerStore.getState().queue[0];
    const newIndex = originalQueue.findIndex((s) => s.id === currentSong?.id);
    setQueue(originalQueue, newIndex >= 0 ? newIndex : 0);
  }

  storeToggleShuffle();
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
