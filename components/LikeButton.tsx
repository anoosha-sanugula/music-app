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
        {isLiked ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 8 },
  icon: {},
});
