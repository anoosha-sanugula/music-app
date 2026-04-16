import { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import { play, pause } from '@/services/audioService';

export default function ModalScreen() {
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    queue,
    queueIndex,
    setIsPlaying,
    playNext,
    playPrevious,
  } = usePlayerStore();

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      await pause();
      setIsPlaying(false);
    } else {
      await play();
      setIsPlaying(true);
    }
  }, [isPlaying, setIsPlaying]);

  const handlePrevious = useCallback(() => {
    playPrevious();
  }, [playPrevious]);

  const handleNext = useCallback(() => {
    playNext();
  }, [playNext]);

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
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <View style={styles.timeContainer}>
          <ThemedText style={styles.time}>{formatTime(position)}</ThemedText>
          <ThemedText style={styles.time}>{formatTime(duration)}</ThemedText>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={handlePrevious}>
          <ThemedText style={styles.controlIcon}>⏮</ThemedText>
        </Pressable>
        <Pressable style={styles.playButton} onPress={handleTogglePlay}>
          <ThemedText style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶'}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={handleNext}>
          <ThemedText style={styles.controlIcon}>⏭</ThemedText>
        </Pressable>
      </View>

      <View style={styles.queueInfo}>
        <ThemedText style={styles.queueText}>
          {queue.length > 0
            ? `Track ${queueIndex + 1} of ${queue.length}`
            : ''}
        </ThemedText>
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
    marginTop: 20,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 8,
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
    marginBottom: 24,
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
  queueInfo: {
    alignItems: 'center',
  },
  queueText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
