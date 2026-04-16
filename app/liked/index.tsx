import { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { AVPlaybackStatus } from 'expo-av';

import { SongListItem } from '@/components/SongListItem';
import { SongOptionsMenu } from '@/components/SongOptionsMenu';
import { ThemedText } from '@/components/themed-text';
import { useLibraryStore, usePlayerStore } from '@/stores';
import { Colors } from '@/utils/colors';
import { loadAndPlaySong } from '@/services/audioService';
import { playNow } from '@/services/queueService';
import type { Song } from '@/types/Song';

export default function LikedSongsScreen() {
  const router = useRouter();
  const { likedSongIds } = useLibraryStore();
  const { songs: allSongs, setCurrentSong, setIsPlaying, setQueue, currentSong, isPlaying } = usePlayerStore();

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const likedSongs = allSongs.filter((s) => likedSongIds.includes(s.id));

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
    if (likedSongs.length === 0) return;
    playNow(likedSongs[0], likedSongs);
    setCurrentSong(likedSongs[0]);
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
        <ThemedText type="title">Liked Songs</ThemedText>
        <ThemedText style={styles.songCount}>{likedSongs.length} songs</ThemedText>
      </View>

      {likedSongs.length > 0 && (
        <Pressable style={styles.playAllButton} onPress={handlePlayAll}>
          <ThemedText style={styles.playAllText}>\u25B6\uFE0F Play All</ThemedText>
        </Pressable>
      )}

      <FlatList
        data={likedSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            isPlaying={currentSong?.id === item.id && isPlaying}
            onPress={() => handlePlaySong(item, likedSongs)}
            onLongPress={() => handleOpenOptions(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>\uD83E\uDD0D</ThemedText>
            <ThemedText style={styles.emptyText}>No liked songs yet</ThemedText>
            <ThemedText style={styles.emptyHint}>
              Tap the heart icon on any song to like it
            </ThemedText>
          </View>
        }
      />

      <SongOptionsMenu
        song={selectedSong}
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        allSongs={likedSongs}
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
  emptyContainer: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
});
