import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';

export function MiniPlayer() {
  const router = useRouter();
  const { currentSong } = usePlayerStore();

  if (!currentSong) {
    return null;
  }

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
});
