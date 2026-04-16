import { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SeekBar } from '@/components/SeekBar';
import { PlaybackControls } from '@/components/PlaybackControls';
import { LikeButton } from '@/components/LikeButton';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import { play, pause } from '@/services/audioService';

export default function NowPlayingScreen() {
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
    repeatMode,
    cycleRepeatMode,
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

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return '\uD83C\uDD82\uFE0F';
      case 'all':
        return '\uD83D\uDD01';
      default:
        return '\uD83D\uDD01';
    }
  };

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

      <SeekBar position={position} duration={duration} />

      <View style={styles.actions}>
        {currentSong && <LikeButton songId={currentSong.id} size={32} />}
        <Pressable onPress={cycleRepeatMode} style={styles.repeatButton}>
          <ThemedText style={styles.repeatIcon}>{getRepeatIcon()}</ThemedText>
        </Pressable>
      </View>

      <PlaybackControls
        isPlaying={isPlaying}
        onPrevious={playPrevious}
        onPlayPause={handleTogglePlay}
        onNext={playNext}
      />

      <View style={styles.queueInfo}>
        <ThemedText style={styles.queueText}>
          {queue.length > 0 ? `Track ${queueIndex + 1} of ${queue.length}` : ''}
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 32,
  },
  repeatButton: {
    padding: 8,
  },
  repeatIcon: {
    fontSize: 32,
  },
  queueInfo: {
    alignItems: 'center',
  },
  queueText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
