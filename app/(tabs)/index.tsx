import { useEffect, useCallback } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';

import { PermissionDeniedView } from '@/components/PermissionDeniedView';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import {
  requestMediaPermission,
  getMediaPermission,
  openSettings,
} from '@/services/permissionService';
import { fetchSongs } from '@/services/musicService';

export default function SongsScreen() {
  const { permissionStatus, setPermissionStatus, songs, setSongs, isLoadingSongs, setLoadingSongs } =
    usePlayerStore();

  const loadSongs = useCallback(async () => {
    setLoadingSongs(true);
    try {
      const fetchedSongs = await fetchSongs();
      setSongs(fetchedSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  }, [setSongs, setLoadingSongs]);

  const checkAndRequestPermission = useCallback(async () => {
    const current = await getMediaPermission();
    setPermissionStatus(current);

    if (current !== 'granted') {
      const result = await requestMediaPermission();
      setPermissionStatus(result);

      if (result === 'granted') {
        loadSongs();
      }
    } else {
      loadSongs();
    }
  }, [loadSongs, setPermissionStatus]);

  useEffect(() => {
    checkAndRequestPermission();
  }, [checkAndRequestPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        getMediaPermission().then(setPermissionStatus);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [setPermissionStatus]);

  const handleGrantAccess = () => {
    checkAndRequestPermission();
  };

  const handleOpenSettings = () => {
    openSettings();
  };

  if (permissionStatus !== 'granted') {
    return (
      <PermissionDeniedView
        status={permissionStatus}
        onGrantAccess={handleGrantAccess}
        onOpenSettings={handleOpenSettings}
      />
    );
  }

  if (isLoadingSongs) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText style={styles.loadingText}>Loading songs...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          {songs.length} Songs
        </ThemedText>
        <ThemedText style={styles.hint}>
          {songs.length === 0
            ? 'No songs found on your device'
            : 'Tap a song to start playing'}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    marginBottom: 8,
  },
  hint: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
