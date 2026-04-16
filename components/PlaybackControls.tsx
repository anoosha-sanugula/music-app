import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';

interface Props {
  isPlaying: boolean;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
}

export function PlaybackControls({
  isPlaying,
  onPrevious,
  onPlayPause,
  onNext,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.controlButton} onPress={onPrevious}>
        <ThemedText style={styles.controlIcon}>⏮</ThemedText>
      </Pressable>
      <Pressable style={styles.playButton} onPress={onPlayPause}>
        <ThemedText style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</ThemedText>
      </Pressable>
      <Pressable style={styles.controlButton} onPress={onNext}>
        <ThemedText style={styles.controlIcon}>⏭</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
