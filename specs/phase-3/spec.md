# Phase 3 Spec: Core Playback Experience

**Objective**: Deliver the complete music playing experience on both platforms: browse, play, control, search.

**Prerequisite**: Phase 2 completed. expo-av already configured in `app.json`.

---

## 1. Audio Service

### `services/audioService.ts`

```typescript
import { Audio, type AVPlaybackStatus } from 'expo-av';
import type { Song } from '@/types/Song';

let sound: Audio.Sound | null = null;

export async function configureAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
}

export async function loadAndPlaySong(
  uri: string,
  onStatusUpdate: (status: AVPlaybackStatus) => void
): Promise<Audio.Sound> {
  if (sound) {
    await sound.unloadAsync();
  }

  const { sound: newSound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true },
    onStatusUpdate
  );

  sound = newSound;
  return sound;
}

export async function play(): Promise<void> {
  if (sound) {
    await sound.playAsync();
  }
}

export async function pause(): Promise<void> {
  if (sound) {
    await sound.pauseAsync();
  }
}

export async function seekTo(positionMs: number): Promise<void> {
  if (sound) {
    await sound.setPositionAsync(positionMs);
  }
}

export async function unload(): Promise<void> {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }
}
```

---

## 2. Update Zustand Store

### `stores/usePlayerStore.ts`

Add playback state and actions:

```typescript
import { create } from 'zustand';
import type { Song } from '@/types/Song';
import type { PermissionStatus } from '@/services/permissionService';

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
  setPermissionStatus: (status: PermissionStatus) => void;
  setSongs: (songs: Song[]) => void;
  setLoadingSongs: (loading: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: Song[], startIndex?: number) => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
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
  setPermissionStatus: (status) => set({ permissionStatus: status }),
  setSongs: (songs) => set({ songs }),
  setLoadingSongs: (loading) => set({ isLoadingSongs: loading }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setQueue: (queue, startIndex = 0) => set({ queue, queueIndex: startIndex }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  playNext: () => {
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
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;

    if (queueIndex > 0) {
      set({ queueIndex: queueIndex - 1 });
    }
  },
}));
```

---

## 3. Song List Item Component

### `components/SongListItem.tsx`

```typescript
import { Pressable, StyleSheet, View } from 'react-native';
import type { Song } from '@/types/Song';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';

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
      <ThemedText style={styles.duration}>
        {formatDuration(song.duration)}
      </ThemedText>
    </Pressable>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    marginBottom: 2,
  },
  active: {
    color: Colors.primary,
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: 13,
    marginLeft: 16,
  },
});
```

---

## 4. Update Songs Screen

### `app/(tabs)/index.tsx`

Add FlatList with song items and playback integration:

```typescript
import { useEffect, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { PermissionDeniedView } from '@/components/PermissionDeniedView';
import { SongListItem } from '@/components/SongListItem';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import type { Song } from '@/types/Song';
import {
  requestMediaPermission,
  getMediaPermission,
  openSettings,
  createPermissionListener,
} from '@/services/permissionService';
import { fetchSongs } from '@/services/musicService';
import { configureAudio, loadAndPlaySong, play, pause } from '@/services/audioService';

type SortOption = 'az' | 'za' | 'artist' | 'duration';

export default function SongsScreen() {
  const {
    permissionStatus,
    setPermissionStatus,
    songs,
    setSongs,
    isLoadingSongs,
    setLoadingSongs,
    currentSong,
    isPlaying,
    setCurrentSong,
    setIsPlaying,
    setPosition,
    setDuration,
    setQueue,
    queue,
    queueIndex,
  } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('az');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    configureAudio();
  }, []);

  const loadSongs = useCallback(async () => {
    setLoadingSongs(true);
    try {
      const fetchedSongs = await fetchSongs();
      setSongs(fetchedSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoadingSongs(false);
      setIsRefreshing(false);
    }
  }, [setSongs, setLoadingSongs]);

  const checkAndRequestPermission = useCallback(async () => {
    const current = await getMediaPermission();
    setPermissionStatus(current);

    if (current !== 'granted') {
      const result = await requestMediaPermission();
      setPermissionStatus(result);

      if (result === 'granted') {
        loadSongs();
      }
    } else {
      loadSongs();
    }
  }, [loadSongs, setPermissionStatus]);

  useEffect(() => {
    checkAndRequestPermission();
  }, [checkAndRequestPermission]);

  useEffect(() => {
    const removeListener = createPermissionListener(setPermissionStatus);
    return removeListener;
  }, [setPermissionStatus]);

  const handlePlaySong = useCallback(
    async (song: Song, index: number) => {
      setQueue(filteredAndSortedSongs, index);
      setCurrentSong(song);

      await loadAndPlaySong(song.uri, (status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying ?? false);
          setPosition(status.positionMillis ?? 0);
          setDuration(status.durationMillis ?? 0);

          if (status.didJustFinish) {
            // Handle track finished - play next
          }
        }
      });
    },
    [filteredAndSortedSongs]
  );

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      await pause();
      setIsPlaying(false);
    } else {
      await play();
      setIsPlaying(true);
    }
  }, [isPlaying, setIsPlaying]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSongs();
  }, [loadSongs]);

  const handleGrantAccess = () => {
    checkAndRequestPermission();
  };

  const handleOpenSettings = () => {
    openSettings();
  };

  const filteredAndSortedSongs = useMemo(() => {
    let result = [...songs];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortOption) {
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'artist':
        result.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'duration':
        result.sort((a, b) => a.duration - b.duration);
        break;
    }

    return result;
  }, [songs, searchQuery, sortOption]);

  if (permissionStatus !== 'granted') {
    return (
      <PermissionDeniedView
        status={permissionStatus}
        onGrantAccess={handleGrantAccess}
        onOpenSettings={handleOpenSettings}
      />
    );
  }

  if (isLoadingSongs && songs.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText style={styles.loadingText}>Loading songs...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredAndSortedSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SongListItem
            song={item}
            isPlaying={currentSong?.id === item.id && isPlaying}
            onPress={() => handlePlaySong(item, index)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              {songs.length === 0
                ? 'No songs found on your device'
                : 'No songs match your search'}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}
```

---

## 5. Update Now Playing Modal

### `app/modal.tsx`

Full Now Playing screen with controls:

```typescript
import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import { play, pause, seekTo } from '@/services/audioService';

export default function ModalScreen() {
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    setIsPlaying,
    playNext,
  } = usePlayerStore();

  const handleTogglePlay = async () => {
    if (isPlaying) {
      await pause();
      setIsPlaying(false);
    } else {
      await play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (progress: number) => {
    seekTo(progress * duration);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.artworkContainer}>
        <View style={styles.artworkPlaceholder}>
          <ThemedText style={styles.artworkText}>Album Art</ThemedText>
        </View>
      </View>

      <View style={styles.songInfo}>
        <ThemedText type="title" style={styles.title}>
          {currentSong?.title || 'No song playing'}
        </ThemedText>
        <ThemedText style={styles.artist}>
          {currentSong?.artist || 'Select a song'}
        </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <ThemedText style={styles.time}>{formatTime(position)}</ThemedText>
          <ThemedText style={styles.time}>{formatTime(duration)}</ThemedText>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={playNext}>
          <ThemedText style={styles.controlIcon}>⏮</ThemedText>
        </Pressable>
        <Pressable style={styles.playButton} onPress={handleTogglePlay}>
          <ThemedText style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶'}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={playNext}>
          <ThemedText style={styles.controlIcon}>⏭</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  artworkPlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 16,
  },
  controlIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: Colors.background,
  },
});
```

---

## 6. Update Mini Player

### `components/MiniPlayer.tsx`

Connect to playback state:

```typescript
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import { play, pause } from '@/services/audioService';

export function MiniPlayer() {
  const router = useRouter();
  const { currentSong, isPlaying, setIsPlaying } = usePlayerStore();

  if (!currentSong) {
    return null;
  }

  const handleTogglePlay = async () => {
    if (isPlaying) {
      await pause();
      setIsPlaying(false);
    } else {
      await play();
      setIsPlaying(true);
    }
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/modal')}
    >
      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {currentSong.title}
        </ThemedText>
        <ThemedText style={styles.artist} numberOfLines={1}>
          {currentSong.artist}
        </ThemedText>
      </View>
      <Pressable style={styles.playButton} onPress={handleTogglePlay}>
        <ThemedText style={styles.playIcon}>
          {isPlaying ? '⏸' : '▶'}
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: Colors.text,
  },
});
```

---

## Verification Checklist

- [ ] `services/audioService.ts` created with audio configuration and playback functions
- [ ] `stores/usePlayerStore.ts` updated with full playback state and actions
- [ ] `components/SongListItem.tsx` created for song list rows
- [ ] Songs screen updated with FlatList, search, sort, and pull-to-refresh
- [ ] `app/modal.tsx` updated with Now Playing UI and controls
- [ ] `components/MiniPlayer.tsx` connected to playback state
- [ ] Audio mode configured on app startup
- [ ] Playback handles: play, pause, seek, next, previous, auto-advance
- [ ] Queue initialization works when tapping a song
- [ ] Lint passes
- [ ] App builds and runs
