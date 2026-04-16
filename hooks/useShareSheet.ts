import { useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { usePlayerStore } from '@/stores';

export function useShareSheet() {
  const { setCurrentSong, setQueue } = usePlayerStore();

  const handleIncomingUrl = useCallback(async (url: string) => {
    try {
      if (!url) return;

      const parsedUrl = Linking.parse(url);

      if (parsedUrl.scheme === 'musicapp' || parsedUrl.scheme === 'com.anonymous.musicapp') {
        return;
      }

      let audioUri = url;

      if (url.startsWith('file://') || url.startsWith('content://') || url.startsWith('/')) {
        if (url.startsWith('/')) {
          audioUri = `file://${url}`;
        } else {
          audioUri = url;
        }
      }

      const filename = decodeURIComponent(url.split('/').pop() || 'Shared Audio');
      const title = filename.replace(/\.[^.]+$/, '');

      const song = {
        id: `shared-${Date.now()}`,
        title,
        artist: 'Unknown Artist',
        album: 'Shared',
        duration: 0,
        uri: audioUri,
        artwork: undefined,
      };

      setQueue([song], 0);
      setCurrentSong(song);
    } catch (error) {
      console.error('Error handling incoming audio:', error);
    }
  }, [setCurrentSong, setQueue]);

  useEffect(() => {
    const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleIncomingUrl(initialUrl);
      }
    };

    checkInitialUrl();

    const subscription = Linking.addEventListener('url', (event) => {
      handleIncomingUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleIncomingUrl]);
}
