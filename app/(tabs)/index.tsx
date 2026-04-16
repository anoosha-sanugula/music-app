import { useEffect, useCallback, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  TextInput,
  Pressable,
} from 'react-native';
import type { AVPlaybackStatus } from 'expo-av';

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
import {
  configureAudio,
  loadAndPlaySong,
} from '@/services/audioService';

type SortOption = 'az' | 'za' | 'artist' | 'duration';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'A-Z', value: 'az' },
  { label: 'Z-A', value: 'za' },
  { label: 'Artist', value: 'artist' },
  { label: 'Duration', value: 'duration' },
];

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
  } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('az');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureAudio();
  }, []);

  const loadSongs = useCallback(async () => {
    setLoadingSongs(true);
    setError(null);
    try {
      const fetchedSongs = await fetchSongs();
      setSongs(fetchedSongs);
    } catch (err) {
      console.error('Failed to load songs:', err);
      setError('Failed to load songs. Please try again.');
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

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying ?? false);
        setPosition(status.positionMillis ?? 0);
        setDuration(status.durationMillis ?? 0);
      }
    },
    [setIsPlaying, setPosition, setDuration]
  );

  const handlePlaySong = useCallback(
    async (song: Song, allSongs: Song[]) => {
      const songIndex = allSongs.findIndex((s) => s.id === song.id);
      setQueue(allSongs, songIndex);
      setCurrentSong(song);

      await loadAndPlaySong(song.uri, handlePlaybackStatusUpdate);
    },
    [handlePlaybackStatusUpdate, setQueue, setCurrentSong]
  );

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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query)
      );
    }

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

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={loadSongs}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.sortContainer}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.sortButton,
                sortOption === option.value && styles.sortButtonActive,
              ]}
              onPress={() => setSortOption(option.value)}
            >
              <ThemedText
                style={[
                  styles.sortButtonText,
                  sortOption === option.value && styles.sortButtonTextActive,
                ]}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={filteredAndSortedSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            isPlaying={currentSong?.id === item.id && isPlaying}
            onPress={() => handlePlaySong(item, filteredAndSortedSongs)}
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
        contentContainerStyle={songs.length === 0 ? styles.emptyList : undefined}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  sortButtonTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
