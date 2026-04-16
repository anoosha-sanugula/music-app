import { Pressable, StyleSheet, View } from 'react-native';
import type { Song } from '@/types/Song';
import { ThemedText } from '@/components/themed-text';
import { LikeButton } from '@/components/LikeButton';
import { Colors } from '@/utils/colors';

interface Props {
  song: Song;
  isPlaying: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function SongListItem({ song, isPlaying, onPress, onLongPress }: Props) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
    >
      <View style={styles.info}>
        <ThemedText
          style={[styles.title, isPlaying && styles.active]}
          numberOfLines={1}
        >
          {song.title}
        </ThemedText>
        <ThemedText style={styles.artist} numberOfLines={1}>
          {song.artist}
        </ThemedText>
      </View>
      <LikeButton songId={song.id} />
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
