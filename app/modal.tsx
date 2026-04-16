import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.artworkPlaceholder}>
          <ThemedText style={styles.artworkText}>Album Artwork</ThemedText>
        </View>
        <ThemedText type="title" style={styles.songTitle}>
          No song playing
        </ThemedText>
        <ThemedText style={styles.artist}>
          Select a song to play
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: Colors.text,
    marginBottom: 24,
  },
  artworkPlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkText: {
    color: Colors.textMuted,
  },
  songTitle: {
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  artist: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  link: {
    marginBottom: 40,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
