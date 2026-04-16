import { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useLibraryStore, usePlayerStore } from '@/stores';
import { Colors } from '@/utils/colors';
import type { Song } from '@/types/Song';

type AlbumItem = {
  type: 'user' | 'system';
  id?: string;
  name: string;
  icon?: string;
  songs: Song[];
};

export default function AlbumsScreen() {
  const router = useRouter();
  const {
    likedSongIds,
    albums,
    isLoaded,
    isLoading,
    loadLibrary,
    addAlbum,
    renameAlbum,
    deleteAlbum,
  } = useLibraryStore();
  const { songs } = usePlayerStore();

  const [systemAlbums, setSystemAlbums] = useState<AlbumItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    if (songs.length > 0) {
      const albumMap = new Map<string, Song[]>();
      const artistMap = new Map<string, Song[]>();

      songs.forEach((song) => {
        if (!albumMap.has(song.album)) albumMap.set(song.album, []);
        albumMap.get(song.album)!.push(song);

        if (!artistMap.has(song.artist)) artistMap.set(song.artist, []);
        artistMap.get(song.artist)!.push(song);
      });

      const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));

      const systemAlbumsData: AlbumItem[] = [
        { type: 'system', id: 'liked', name: 'Liked Songs', icon: '\u2764\uFE0F', songs: likedSongs },
        ...Array.from(albumMap.entries())
          .slice(0, 10)
          .map(([name, songs]) => ({ type: 'system' as const, name, icon: '\uD83C\uDFBC', songs })),
        ...Array.from(artistMap.entries())
          .slice(0, 10)
          .map(([name, songs]) => ({ type: 'system' as const, name, icon: '\uD83C\uDFB5', songs })),
      ];

      setSystemAlbums(systemAlbumsData);
    }
  }, [songs, likedSongIds]);

  const handleCreateAlbum = () => {
    Alert.prompt('New Album', 'Enter album name:', (name) => {
      if (name && name.trim()) {
        addAlbum(name.trim());
      }
    });
  };

  const handleAlbumPress = (item: AlbumItem) => {
    if (item.type === 'user' && item.id) {
      router.push(`/album/${item.id}`);
    } else if (item.type === 'system' && item.id === 'liked') {
      router.push('/liked');
    } else if (item.type === 'system') {
      const encodedName = encodeURIComponent(item.name);
      const isArtist = item.name.startsWith('Artist: ');
      const albumType = isArtist ? 'artist' : 'album';
      router.push(`/system-album/${encodedName}?type=${albumType}&name=${encodedName}`);
    }
  };

  const handleAlbumLongPress = (item: AlbumItem) => {
    if (item.type === 'user' && item.id) {
      setSelectedAlbum(item);
      setShowAlbumMenu(true);
    }
  };

  const handleRenameAlbum = () => {
    if (!selectedAlbum?.id) return;
    Alert.prompt('Rename Album', 'Enter new name:', (newName) => {
      if (newName && newName.trim()) {
        renameAlbum(selectedAlbum.id!, newName.trim());
      }
      setShowAlbumMenu(false);
      setSelectedAlbum(null);
    });
  };

  const handleDeleteAlbum = () => {
    if (!selectedAlbum?.id) return;
    Alert.alert(
      'Delete Album',
      `Are you sure you want to delete \u201C${selectedAlbum.name}\u201D? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          deleteAlbum(selectedAlbum.id!);
          setShowAlbumMenu(false);
          setSelectedAlbum(null);
        }},
      ]
    );
  };

  const handleCloseMenu = () => {
    setShowAlbumMenu(false);
    setSelectedAlbum(null);
  };

  if (isLoading || !isLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ThemedText>Loading library...</ThemedText>
        </View>
      </View>
    );
  }

  const allItems: AlbumItem[] = [
    ...albums.map((a) => ({ type: 'user' as const, id: a.id, name: a.name, songs: [] })),
    ...systemAlbums,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Library</ThemedText>
        <Pressable style={styles.addButton} onPress={handleCreateAlbum}>
          <ThemedText style={styles.addButtonText}>+ New Album</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item) => `${item.type}-${item.id || item.name}`}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.albumItem,
              item.type === 'system' && styles.systemAlbumItem,
            ]}
            onPress={() => handleAlbumPress(item)}
            onLongPress={() => handleAlbumLongPress(item)}
          >
            <View style={styles.albumInfo}>
              <ThemedText style={styles.albumIcon}>
                {item.type === 'user' ? '\uD83C\uDFB6' : (item.icon || '\uD83C\uDFBC')}
              </ThemedText>
              <View style={styles.albumTextContainer}>
                <ThemedText
                  style={[
                    styles.albumName,
                    item.type === 'system' && styles.systemAlbumName,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </ThemedText>
                <ThemedText style={styles.albumCount}>
                  {item.type === 'user'
                    ? `${item.songs.length || 0} songs`
                    : `${item.songs.length} songs`}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.chevron}>\u203A</ThemedText>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>\uD83C\uDFB6</ThemedText>
            <ThemedText style={styles.emptyText}>No user albums yet</ThemedText>
            <ThemedText style={styles.emptyHint}>
              Tap &quot;+ New Album&quot; to create one
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          systemAlbums.length > 0 ? (
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>SYSTEM</ThemedText>
            </View>
          ) : null
        }
        ListFooterComponent={
          albums.length > 0 && systemAlbums.length > 0 ? (
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>MY ALBUMS</ThemedText>
            </View>
          ) : null
        }
      />

      {showAlbumMenu && (
        <Modal
          visible={showAlbumMenu}
          transparent
          animationType="fade"
          onRequestClose={handleCloseMenu}
        >
          <Pressable style={styles.menuBackdrop} onPress={handleCloseMenu}>
            <View style={styles.menuContainer}>
              <ThemedText style={styles.menuTitle}>{selectedAlbum?.name}</ThemedText>
              <Pressable style={styles.menuOption} onPress={handleRenameAlbum}>
                <ThemedText style={styles.menuIcon}>\u270E\uFE0F</ThemedText>
                <ThemedText style={styles.menuText}>Rename</ThemedText>
              </Pressable>
              <Pressable style={styles.menuOption} onPress={handleDeleteAlbum}>
                <ThemedText style={styles.menuIcon}>\uD83D\uDDD1\uFE0F</ThemedText>
                <ThemedText style={styles.menuTextDanger}>Delete</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: Colors.background, fontWeight: '600' },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  systemAlbumItem: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  albumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  albumTextContainer: {
    flex: 1,
  },
  albumName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  systemAlbumName: {
    color: Colors.text,
    fontSize: 15,
  },
  albumCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 24,
    fontWeight: '300',
  },
  emptyContainer: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 8 },
  emptyHint: { color: Colors.textMuted, fontSize: 14 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  menuTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
  },
  menuText: {
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  menuTextDanger: {
    color: Colors.error,
    fontSize: 16,
    flex: 1,
  },
});
