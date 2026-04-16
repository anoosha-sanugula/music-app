import { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { AVPlaybackStatus } from 'expo-av';
import { usePlayerStore } from '@/stores';

import { SongListItem } from '@/components/SongListItem';
import { SongOptionsMenu } from '@/components/SongOptionsMenu';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';
import { loadAndPlaySong } from '@/services/audioService';
import { playNow } from '@/services/queueService';
import type { Song } from '@/types/Song';

export default function SystemAlbumScreen() {
  const router = useRouter();
  const { name, type } = useLocalSearchParams<{ name: string; type: string }>();
  const { songs: allSongs, setCurrentSong, setIsPlaying, setQueue, currentSong, isPlaying } = usePlayerStore();

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const displayName = decodeURIComponent(name || 'Unknown');

  const systemSongs = allSongs.filter((song) => {
    if (type === 'artist') {
      return song.artist === displayName;
    }
    return song.album === displayName;
  });

  const handlePlaySong = useCallback(async (song: Song, songs: Song[]) => {
    const songIndex = songs.findIndex((s) => s.id === song.id);
    setQueue(songs, songIndex);
    setCurrentSong(song);

    await loadAndPlaySong(song.uri, (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying ?? false);
      }
    });
  }, [setQueue, setCurrentSong, setIsPlaying]);

  const handlePlayAll = () => {
    if (systemSongs.length === 0) return;
    playNow(systemSongs[0], systemSongs);
    setCurrentSong(systemSongs[0]);
    setIsPlaying(true);
  };

  const handleOpenOptions = (song: Song) => {
    setSelectedSong(song);
    setShowOptionsMenu(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backText}>\u2190 Back</ThemedText>
        </Pressable>
        <ThemedText type="title" numberOfLines={1}>
          {type === 'artist' ? `Artist: ${displayName}` : displayName}
        </ThemedText>
        <ThemedText style={styles.songCount}>{systemSongs.length} songs</ThemedText>
      </View>

      {systemSongs.length > 0 && (
        <Pressable style={styles.playAllButton} onPress={handlePlayAll}>
          <ThemedText style={styles.playAllText}>\u25B6\uFE0F Play All</ThemedText>
        </Pressable>
      )}

      <FlatList
        data={systemSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            isPlaying={currentSong?.id === item.id && isPlaying}
            onPress={() => handlePlaySong(item, systemSongs)}
            onLongPress={() => handleOpenOptions(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No songs found</ThemedText>
          </View>
        }
      />

      <SongOptionsMenu
        song={selectedSong}
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        allSongs={systemSongs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
  },
  songCount: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  playAllButton: {
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  playAllText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
