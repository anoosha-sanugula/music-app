import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';

export default function LibraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.placeholder}>
          Library
        </ThemedText>
        <ThemedText style={styles.hint}>
          Your liked songs and albums will appear here.
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
  placeholder: {
    color: Colors.text,
    marginBottom: 8,
  },
  hint: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
