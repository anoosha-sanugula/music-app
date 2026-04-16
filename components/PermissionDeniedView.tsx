import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';
import type { PermissionStatus } from '@/services/permissionService';

interface Props {
  status: PermissionStatus;
  onGrantAccess: () => void;
  onOpenSettings?: () => void;
}

export function PermissionDeniedView({ status, onGrantAccess, onOpenSettings }: Props) {
  const isBlocked = status === 'blocked';

  const handlePress = isBlocked ? onOpenSettings : onGrantAccess;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.icon}>🎵</ThemedText>
        </View>
        <ThemedText type="title" style={styles.title}>
          Music Access Required
        </ThemedText>
        <ThemedText style={styles.description}>
          {isBlocked
            ? 'Permission was denied. Please open Settings to grant access to your music library.'
            : 'Grant permission to see your music library on this device.'}
        </ThemedText>
        <Pressable
          style={styles.button}
          onPress={handlePress}
        >
          <ThemedText style={styles.buttonText}>
            {isBlocked ? 'Open Settings' : 'Grant Access'}
          </ThemedText>
        </Pressable>
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
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
