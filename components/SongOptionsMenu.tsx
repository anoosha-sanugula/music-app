import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useLibraryStore, usePlayerStore } from '@/stores';
import { Colors } from '@/utils/colors';
import { playNow, playNext, addToQueue } from '@/services/queueService';
import type { Song } from '@/types/Song';

interface Props {
  song: Song | null;
  visible: boolean;
  onClose: () => void;
  allSongs: Song[];
}

export function SongOptionsMenu({ song, visible, onClose, allSongs }: Props) {
  const { likedSongIds, albums, toggleLike, addSongToAlbum, removeSongFromAlbum } = useLibraryStore();
  const { setCurrentSong, setIsPlaying } = usePlayerStore();

  if (!song) return null;

  const isLiked = likedSongIds.includes(song.id);
  const songsInAlbum = (albumId: string) => {
    const album = albums.find((a) => a.id === albumId);
    return album?.songIds.includes(song.id) ?? false;
  };

  const handlePlayNow = () => {
    playNow(song, allSongs);
    setCurrentSong(song);
    setIsPlaying(true);
    onClose();
  };

  const handlePlayNext = () => {
    playNext(song);
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    onClose();
  };

  const handleToggleLike = () => {
    toggleLike(song.id);
  };

  const handleAddToAlbum = (albumId: string) => {
    if (songsInAlbum(albumId)) {
      removeSongFromAlbum(albumId, song.id);
    } else {
      addSongToAlbum(albumId, song.id);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.menuContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ThemedText style={styles.songTitle} numberOfLines={1}>
            {song.title}
          </ThemedText>
          <ThemedText style={styles.songArtist} numberOfLines={1}>
            {song.artist}
          </ThemedText>

          <ScrollView style={styles.optionsList}>
            <Pressable style={styles.optionRow} onPress={handlePlayNow}>
              <ThemedText style={styles.optionIcon}>\u25B6\uFE0F</ThemedText>
              <ThemedText style={styles.optionText}>Play Now</ThemedText>
            </Pressable>

            <Pressable style={styles.optionRow} onPress={handlePlayNext}>
              <ThemedText style={styles.optionIcon}>\u23ED\uFE0F</ThemedText>
              <ThemedText style={styles.optionText}>Play Next</ThemedText>
            </Pressable>

            <Pressable style={styles.optionRow} onPress={handleAddToQueue}>
              <ThemedText style={styles.optionIcon}>\u2795</ThemedText>
              <ThemedText style={styles.optionText}>Add to Queue</ThemedText>
            </Pressable>

            <View style={styles.separator} />

            <Pressable style={styles.optionRow} onPress={handleToggleLike}>
              <ThemedText style={styles.optionIcon}>
                {isLiked ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
              </ThemedText>
              <ThemedText style={styles.optionText}>
                {isLiked ? 'Unlike' : 'Like'}
              </ThemedText>
            </Pressable>

            {albums.length > 0 && (
              <>
                <View style={styles.separator} />
                <ThemedText style={styles.sectionTitle}>Add to Album</ThemedText>
                {albums.map((album) => (
                  <Pressable
                    key={album.id}
                    style={styles.optionRow}
                    onPress={() => handleAddToAlbum(album.id)}
                  >
                    <ThemedText style={styles.optionIcon}>
                      {songsInAlbum(album.id) ? '\u2611\uFE0F' : '\u2610\uFE0F'}
                    </ThemedText>
                    <ThemedText style={styles.optionText}>{album.name}</ThemedText>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  songTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  songArtist: {
    color: Colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
    textAlign: 'center',
  },
  optionText: {
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
});
