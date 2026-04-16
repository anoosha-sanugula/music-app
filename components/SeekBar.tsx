import { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import { seekTo } from '@/services/audioService';

export function SeekBar() {
  const { position, duration } = usePlayerStore();
  const [barWidth, setBarWidth] = useState(200);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  const handleLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    setBarWidth(event.nativeEvent.layout.width);
  }, []);

  const handlePress = useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      const seekPosition = (event.nativeEvent.locationX / barWidth) * duration;
      if (seekPosition >= 0 && seekPosition <= duration) {
        seekTo(seekPosition);
      }
    },
    [barWidth, duration]
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.progressBar} onPress={handlePress} onLayout={handleLayout}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </Pressable>
      <View style={styles.timeContainer}>
        <ThemedText style={styles.time}>{formatTime(position)}</ThemedText>
        <ThemedText style={styles.time}>{formatTime(duration)}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
