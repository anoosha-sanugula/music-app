# Phase 2 Spec: Device Access & Music Discovery

**Objective**: Request media permissions and build the music dataset using `expo-media-library` consistently on both platforms.

**Prerequisite**: Phase 1 completed. `expo-media-library` already configured in `app.json`.

---

## 1. Permission Service

### `services/permissionService.ts`

```typescript
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined';

export async function requestMediaPermission(): Promise<PermissionStatus> {
  const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

  if (status === 'granted') return 'granted';
  if (status === 'denied' && !canAskAgain) return 'blocked';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getMediaPermission(): Promise<PermissionStatus> {
  const { status } = await MediaLibrary.getPermissionsAsync();

  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function openSettings(): Promise<void> {
  await Linking.openSettings();
}
```

### AppState Listener
- Re-check permission state when app returns to foreground
- Use `AppState.addEventListener('change', ...)` to detect foreground
- Update permission state in `usePlayerStore`

---

## 2. Permission Denied UI

### `components/PermissionDeniedView.tsx`

Full-screen empty state shown when permission is `denied` or `blocked`:

- **Icon**: Music note or permission icon
- **Explanation text**: "Music access required" / "Grant permission to see your music"
- **CTA button**:
  - `denied` → "Grant Access" (triggers request again)
  - `blocked` → "Open Settings" (opens system settings)

### Integration
- Import and use in Songs screen when permission is not `granted`
- Not an error state — use neutral styling from design system

---

## 3. Music Discovery Service

### `services/musicService.ts`

```typescript
import * as MediaLibrary from 'expo-media-library';
import type { Song } from '@/types/Song';

const MIN_DURATION_MS = 30000; // 30 seconds
const PAGE_SIZE = 100;

export async function fetchSongs(): Promise<Song[]> {
  const songs: Song[] = [];
  let hasNextPage = true;
  let after: string | null = null;

  while (hasNextPage) {
    const { assets, hasNextPage: next, endCursor } = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after: after ?? undefined,
    });

    hasNextPage = next;
    after = endCursor ?? null;

    // Batch fetch localUri for all assets
    const assetInfos = await Promise.all(
      assets
        .filter((asset) => asset.duration >= MIN_DURATION_MS)
        .map((asset) => MediaLibrary.getAssetInfoAsync(asset.id))
    );

    for (const assetInfo of assetInfos) {
      if (assetInfo.uri && !songs.some((s) => s.uri === assetInfo.uri)) {
        songs.push(normalizeSong(assetInfo));
      }
    }
  }

  return songs;
}

function normalizeSong(asset: MediaLibrary.Asset): Song {
  return {
    id: asset.id,
    title: asset.filename?.replace(/\.[^.]+$/, '') || 'Unknown Title',
    artist: asset.artist || 'Unknown Artist',
    album: asset.album || 'Unknown Album',
    duration: asset.duration,
    uri: asset.uri,
    artwork: asset.mediaType === 'image' ? asset.uri : undefined,
  };
}
```

### Key Rules
- **Pagination**: Always paginate, never assume all assets fit in one call
- **Duration filter**: Skip assets < 30 seconds (voice memos, ringtones)
- **Deduplication**: Skip if `localUri` already in results
- **Normalization**: Missing title → filename, missing artist/album → "Unknown"

---

## 4. Update Zustand Store

### `stores/usePlayerStore.ts`

Add permission state and songs array:

```typescript
import { create } from 'zustand';
import type { Song } from '@/types/Song';
import type { PermissionStatus } from '@/services/permissionService';

interface PlayerState {
  permissionStatus: PermissionStatus;
  songs: Song[];
  isLoadingSongs: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  setPermissionStatus: (status: PermissionStatus) => void;
  setSongs: (songs: Song[]) => void;
  setLoadingSongs: (loading: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  permissionStatus: 'undetermined',
  songs: [],
  isLoadingSongs: false,
  currentSong: null,
  isPlaying: false,
  queue: [],
  queueIndex: 0,
  setPermissionStatus: (status) => set({ permissionStatus: status }),
  setSongs: (songs) => set({ songs }),
  setLoadingSongs: (loading) => set({ isLoadingSongs: loading }),
}));
```

---

## 5. Update Songs Screen

### `app/(tabs)/index.tsx`

```typescript
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PermissionDeniedView } from '@/components/PermissionDeniedView';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/utils/colors';
import { usePlayerStore } from '@/stores';
import {
  requestMediaPermission,
  getMediaPermission,
} from '@/services/permissionService';
import { fetchSongs } from '@/services/musicService';

export default function SongsScreen() {
  const { permissionStatus, setPermissionStatus, songs, setSongs, isLoadingSongs, setLoadingSongs } = usePlayerStore();

  useEffect(() => {
    checkAndRequestPermission();
  }, []);

  const checkAndRequestPermission = async () => {
    // Check current status
    const current = await getMediaPermission();
    setPermissionStatus(current);

    if (current !== 'granted') {
      // Request permission
      const result = await requestMediaPermission();
      setPermissionStatus(result);

      if (result === 'granted') {
        loadSongs();
      }
    } else {
      loadSongs();
    }
  };

  const loadSongs = async () => {
    setLoadingSongs(true);
    try {
      const fetchedSongs = await fetchSongs();
      setSongs(fetchedSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleGrantAccess = () => {
    checkAndRequestPermission();
  };

  if (permissionStatus !== 'granted') {
    return <PermissionDeniedView status={permissionStatus} onGrantAccess={handleGrantAccess} />;
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
        <ThemedText type="subtitle">{songs.length} Songs</ThemedText>
        <ThemedText style={styles.hint}>
          {songs.length === 0 ? 'No songs found on your device' : 'Songs will appear here'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}
```

---

## 6. Error Types

### `types/errors.ts`

```typescript
export type AppError = {
  type: 'permission_denied' | 'asset_unavailable' | 'playback_failed' | 'store_corrupt' | 'unknown';
  message: string;
};
```

---

## Verification Checklist

- [ ] `services/permissionService.ts` created with all permission functions
- [ ] `services/musicService.ts` created with paginated song fetching
- [ ] `components/PermissionDeniedView.tsx` shows when permission not granted
- [ ] `stores/usePlayerStore.ts` updated with permission and songs state
- [ ] Songs screen handles: loading, permission denied, empty, populated states
- [ ] AppState listener re-checks permission on foreground
- [ ] Lint passes
- [ ] App builds and runs
