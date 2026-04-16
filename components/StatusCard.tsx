import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/utils/colors';

interface Props {
  type: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
}

export function StatusCard({ type, message, onRetry }: Props) {
  const getContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: null,
          text: message || 'Loading...',
        };
      case 'error':
        return {
          icon: '⚠️',
          text: message || 'An error occurred',
        };
      case 'empty':
        return {
          icon: '🎵',
          text: message || 'No songs found',
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      {content.icon && <ThemedText style={styles.icon}>{content.icon}</ThemedText>}
      {type === 'loading' && (
        <ActivityIndicator size="large" color={Colors.primary} />
      )}
      <ThemedText style={styles.text}>{content.text}</ThemedText>
      {type === 'error' && onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  text: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
