import { useCallback } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import { play, pause } from '@/services/audioService';
import { SafeAreaView } from 'react-native-safe-area-context';

export function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentSong, isPlaying, setIsPlaying } = usePlayerStore();

  const handleTogglePlay = useCallback(
    async (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (isPlaying) {
        await pause();
        setIsPlaying(false);
      } else {
        await play();
        setIsPlaying(true);
      }
    },
    [isPlaying, setIsPlaying]
  );

  if (!currentSong || pathname === '/modal') {
    return null;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface,
  },
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
