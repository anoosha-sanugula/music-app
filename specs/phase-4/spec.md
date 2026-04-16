# Phase 4 Spec: Personalization & Advanced Features

**Objective**: Enhance user experience with persistence, likes, albums, and advanced playback controls — consistent across both platforms.

**Prerequisite**: Phase 3 completed. expo-file-system already configured in `app.json`.

---

## 1. Library Persistence Service

### `services/libraryPersistence.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import type { LibraryData } from '@/types/Library';

const LIBRARY_FILE = FileSystem.documentDirectory + 'library-store.json';
const LIBRARY_VERSION = 1;

interface StoredLibrary {
  likedSongIds: string[];
  albums: Album[];
  version: number;
}

interface Album {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
}

export async function loadLibrary(): Promise<LibraryData> {
  try {
    const file = await FileSystem.getInfoAsync(LIBRARY_FILE);

    if (!file.exists) {
      return getDefaultLibrary();
    }

    const content = await FileSystem.readAsStringAsync(LIBRARY_FILE);
    const data: StoredLibrary = JSON.parse(content);

    if (!data || typeof data !== 'object') {
      return getDefaultLibrary();
    }

    return {
      likedSongIds: Array.isArray(data.likedSongIds) ? data.likedSongIds : [],
      albums: Array.isArray(data.albums) ? data.albums : [],
      version: data.version || 1,
    };
  } catch (error) {
    console.error('Failed to load library:', error);
    return getDefaultLibrary();
  }
}

export async function saveLibrary(data: LibraryData): Promise<void> {
  const content = JSON.stringify({
    likedSongIds: data.likedSongIds,
    albums: data.albums,
    version: LIBRARY_VERSION,
  });

  await FileSystem.writeAsStringAsync(LIBRARY_FILE, content);
}

function getDefaultLibrary(): LibraryData {
  return {
    likedSongIds: [],
    albums: [],
    version: LIBRARY_VERSION,
  };
}
```

### `types/Library.ts`

```typescript
export interface Album {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
}

export interface LibraryData {
  likedSongIds: string[];
  albums: Album[];
  version: number;
}
```

---

## 2. Update Library Store

### `stores/useLibraryStore.ts`

```typescript
import { create } from 'zustand';
import type { Album } from '@/types/Library';
import type { Song } from '@/types/Song';
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
    const { likedSongIds } = get();
    const newLikedSongIds = likedSongIds.includes(songId)
      ? likedSongIds.filter((id) => id !== songId)
      : [...likedSongIds, songId];

    set({ likedSongIds: newLikedSongIds });
    saveLibrary({ likedSongIds: newLikedSongIds, albums: get().albums, version: 1 });
  },

  addAlbum: (name) => {
    const { albums } = get();
    const newAlbum: Album = {
      id: generateId(),
      name,
      songIds: [],
      createdAt: new Date().toISOString(),
    };
    const newAlbums = [...albums, newAlbum];
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds: get().likedSongIds, albums: newAlbums, version: 1 });
  },

  renameAlbum: (albumId, newName) => {
    const { albums } = get();
    const newAlbums = albums.map((album) =>
      album.id === albumId ? { ...album, name: newName } : album
    );
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds: get().likedSongIds, albums: newAlbums, version: 1 });
  },

  deleteAlbum: (albumId) => {
    const { albums } = get();
    const newAlbums = albums.filter((album) => album.id !== albumId);
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds: get().likedSongIds, albums: newAlbums, version: 1 });
  },

  addSongToAlbum: (albumId, songId) => {
    const { albums } = get();
    const newAlbums = albums.map((album) =>
      album.id === albumId && !album.songIds.includes(songId)
        ? { ...album, songIds: [...album.songIds, songId] }
        : album
    );
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds: get().likedSongIds, albums: newAlbums, version: 1 });
  },

  removeSongFromAlbum: (albumId, songId) => {
    const { albums } = get();
    const newAlbums = albums.map((album) =>
      album.id === albumId
        ? { ...album, songIds: album.songIds.filter((id) => id !== songId) }
        : album
    );
    set({ albums: newAlbums });
    saveLibrary({ likedSongIds: get().likedSongIds, albums: newAlbums, version: 1 });
  },
}));

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
```

---

## 3. Update Library Screen

### `app/(tabs)/library.tsx`

```typescript
import { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLibraryStore } from '@/stores';
import { usePlayerStore } from '@/stores';
import { Colors } from '@/utils/colors';

export default function LibraryScreen() {
  const router = useRouter();
  const {
    likedSongIds,
    albums,
    isLoaded,
    isLoading,
    loadLibrary,
    addAlbum,
    deleteAlbum,
  } = useLibraryStore();
  const { songs } = usePlayerStore();

  const [systemAlbums, setSystemAlbums] = useState<{ name: string; songs: Song[] }[]>([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      const albumMap = new Map<string, Song[]>();
      const artistMap = new Map<string, Song[]>();

      songs.forEach((song) => {
        if (!albumMap.has(song.album)) albumMap.set(song.album, []);
        albumMap.get(song.album)!.push(song);

        if (!artistMap.has(song.artist)) artistMap.set(song.artist, []);
        artistMap.get(song.artist)!.push(song);
      });

      const systemAlbumsData = [
        { name: 'Liked Songs', songs: songs.filter((s) => likedSongIds.includes(s.id)) },
        ...Array.from(albumMap.entries())
          .slice(0, 10)
          .map(([name, songs]) => ({ name, songs })),
        ...Array.from(artistMap.entries())
          .slice(0, 10)
          .map(([name, songs]) => ({ name: `Artist: ${name}`, songs })),
      ];

      setSystemAlbums(systemAlbumsData);
    }
  }, [songs, likedSongIds]);

  const handleCreateAlbum = () => {
    Alert.prompt('New Album', 'Enter album name:', (name) => {
      if (name && name.trim()) {
        addAlbum(name.trim());
      }
    });
  };

  const handleDeleteAlbum = (albumId: string, albumName: string) => {
    Alert.alert('Delete Album', `Delete "${albumName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAlbum(albumId) },
    ]);
  };

  if (isLoading || !isLoaded) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ThemedText>Loading library...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Library</ThemedText>
        <Pressable style={styles.addButton} onPress={handleCreateAlbum}>
          <ThemedText style={styles.addButtonText}>+ New Album</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={[
          ...albums.map((a) => ({ type: 'user' as const, ...a })),
          ...systemAlbums.map((a) => ({ type: 'system' as const, ...a })),
        ]}
        keyExtractor={(item) => `${item.type}-${item.id || item.name}`}
        renderItem={({ item }) => (
          <Pressable style={styles.albumItem}>
            <ThemedText style={styles.albumName}>
              {item.type === 'user' ? item.name : `📀 ${item.name}`}
            </ThemedText>
            <ThemedText style={styles.albumCount}>
              {item.songIds?.length || item.songs?.length || 0} songs
            </ThemedText>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No albums yet</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: Colors.background, fontWeight: '600' },
  albumItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  albumName: { color: Colors.text, fontSize: 16 },
  albumCount: { color: Colors.textSecondary, fontSize: 14 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },
});
```

---

## 4. Like Button Component

### `components/LikeButton.tsx`

```typescript
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useLibraryStore } from '@/stores';

interface Props {
  songId: string;
  size?: number;
}

export function LikeButton({ songId, size = 24 }: Props) {
  const { likedSongIds, toggleLike } = useLibraryStore();
  const isLiked = likedSongIds.includes(songId);

  return (
    <Pressable onPress={() => toggleLike(songId)} style={styles.button}>
      <ThemedText style={[styles.icon, { fontSize: size }]}>
        {isLiked ? '❤️' : '🤍'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 8 },
  icon: {},
});
```

---

## 5. Update SongListItem with Like

### `components/SongListItem.tsx`

Add like button to the component:

```typescript
import { LikeButton } from './LikeButton';

interface Props {
  song: Song;
  isPlaying: boolean;
  onPress: () => void;
}

export function SongListItem({ song, isPlaying, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.info}>
        <ThemedText style={[styles.title, isPlaying && styles.active]} numberOfLines={1}>
          {song.title}
        </ThemedText>
        <ThemedText style={styles.artist} numberOfLines={1}>
          {song.artist}
        </ThemedText>
      </View>
      <LikeButton songId={song.id} />
      <ThemedText style={styles.duration}>{formatDuration(song.duration)}</ThemedText>
    </Pressable>
  );
}
```

---

## 6. Advanced Queue Actions

### `services/queueService.ts`

```typescript
import type { Song } from '@/types/Song';
import { usePlayerStore } from '@/stores';

let originalQueue: Song[] = [];

export function playNow(song: Song, allSongs: Song[]) {
  const { setQueue, setCurrentSong } = usePlayerStore.getState();
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
  const { isShuffled, queue, queueIndex, setQueue } = usePlayerStore.getState();

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

  usePlayerStore.getState().toggleShuffle();
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## 7. Debounce Track Changes

### `stores/usePlayerStore.ts`

Add debounce for rapid track changes:

```typescript
let lastTrackChange = 0;
const DEBOUNCE_MS = 300;

playNext: () => {
  const now = Date.now();
  if (now - lastTrackChange < DEBOUNCE_MS) return;
  lastTrackChange = now;
  // ... existing logic
},
```

---

## 8. Update Now Playing with Like and Repeat

### `screens/NowPlayingScreen.tsx`

```typescript
import { LikeButton } from '@/components/LikeButton';

export default function NowPlayingScreen() {
  const { repeatMode, cycleRepeatMode } = usePlayerStore();

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one': return '🔂';
      case 'all': return '🔁';
      default: return '🔁';
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* ... existing UI ... */}
      <View style={styles.actions}>
        <LikeButton songId={currentSong?.id || ''} size={32} />
        <Pressable onPress={cycleRepeatMode}>
          <ThemedText style={styles.repeatIcon}>{getRepeatIcon()}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
```

---

## Verification Checklist

- [ ] `services/libraryPersistence.ts` with load/save using expo-file-system
- [ ] `types/Library.ts` with Album and LibraryData types
- [ ] `stores/useLibraryStore.ts` updated with persistence and actions
- [ ] Library screen loads on startup with loading state
- [ ] `components/LikeButton.tsx` for like toggle
- [ ] SongListItem updated to show like button
- [ ] Library screen shows user albums and system albums (by album/artist)
- [ ] Create/rename/delete album functionality
- [ ] `services/queueService.ts` with playNow, playNext, addToQueue, toggleShuffle
- [ ] Debounce track changes by 300ms
- [ ] Now Playing screen shows like button and repeat mode
- [ ] Lint passes
- [ ] App builds and runs
