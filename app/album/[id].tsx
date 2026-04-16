import { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { AVPlaybackStatus } from 'expo-av';

import { SongListItem } from '@/components/SongListItem';
import { SongOptionsMenu } from '@/components/SongOptionsMenu';
import { ThemedText } from '@/components/themed-text';
import { useLibraryStore, usePlayerStore } from '@/stores';
import { Colors } from '@/utils/colors';
import { loadAndPlaySong } from '@/services/audioService';
import { playNow } from '@/services/queueService';
import type { Song } from '@/types/Song';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { albums, removeSongFromAlbum, addSongToAlbum } = useLibraryStore();
  const { songs: allSongs, setCurrentSong, setIsPlaying, setQueue, currentSong, isPlaying } = usePlayerStore();

  const album = albums.find((a) => a.id === id);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showAddSongs, setShowAddSongs] = useState(false);

  const albumSongs = album?.songIds
    .map((songId) => allSongs.find((s) => s.id === songId))
    .filter((s): s is Song => s !== undefined) ?? [];

  const availableSongs = allSongs.filter(
    (s) => !album?.songIds.includes(s.id)
  );

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
    if (albumSongs.length === 0) return;
    playNow(albumSongs[0], albumSongs);
    setCurrentSong(albumSongs[0]);
    setIsPlaying(true);
  };

  const handleOpenOptions = (song: Song) => {
    setSelectedSong(song);
    setShowOptionsMenu(true);
  };

  const handleRemoveFromAlbum = (songId: string) => {
    if (!album) return;
    Alert.alert('Remove Song', 'Remove this song from the album?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSongFromAlbum(album.id, songId) },
    ]);
  };

  const handleAddSongToAlbum = (song: Song) => {
    if (!album) return;
    addSongToAlbum(album.id, song.id);
  };

  if (!album) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ThemedText>Album not found</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backText}>\u2190 Back</ThemedText>
        </Pressable>
        <ThemedText type="title" numberOfLines={1}>{album.name}</ThemedText>
        <ThemedText style={styles.songCount}>{albumSongs.length} songs</ThemedText>
      </View>

      {albumSongs.length > 0 && (
        <Pressable style={styles.playAllButton} onPress={handlePlayAll}>
          <ThemedText style={styles.playAllText}>\u25B6\uFE0F Play All</ThemedText>
        </Pressable>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => setShowAddSongs(true)}>
          <ThemedText style={styles.actionText}>+ Add Songs</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={albumSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <SongListItem
              song={item}
              isPlaying={currentSong?.id === item.id && isPlaying}
              onPress={() => handlePlaySong(item, albumSongs)}
              onLongPress={() => handleOpenOptions(item)}
            />
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemoveFromAlbum(item.id)}
            >
              <ThemedText style={styles.removeText}>Remove</ThemedText>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No songs in this album</ThemedText>
            <ThemedText style={styles.emptyHint}>Tap &quot;Add Songs&quot; to add songs</ThemedText>
          </View>
        }
      />

      <Modal
        visible={showAddSongs}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSongs(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddSongs(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">Add Songs</ThemedText>
              <Pressable onPress={() => setShowAddSongs(false)}>
                <ThemedText style={styles.closeText}>Done</ThemedText>
              </Pressable>
            </View>
            <FlatList
              data={availableSongs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SongListItem
                  song={item}
                  isPlaying={false}
                  onPress={() => handleAddSongToAlbum(item)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>All songs added</ThemedText>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>

      <SongOptionsMenu
        song={selectedSong}
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        allSongs={albumSongs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionButton: {
    paddingVertical: 8,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 16,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  removeText: {
    color: Colors.error,
    fontSize: 12,
  },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  emptyHint: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  closeText: {
    color: Colors.primary,
    fontSize: 16,
  },
});
