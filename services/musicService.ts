import * as MediaLibrary from 'expo-media-library';
import type { Song } from '@/types/Song';

const MIN_DURATION_MS = 30000;
const PAGE_SIZE = 100;

export async function fetchSongs(): Promise<Song[]> {
  const songs: Song[] = [];
  let hasNextPage = true;
  let after: string | undefined;

  while (hasNextPage) {
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after,
    });

    hasNextPage = result.hasNextPage;
    after = result.endCursor ?? undefined;

    const validAssets = result.assets.filter(
      (asset) => asset.duration >= MIN_DURATION_MS
    );

    const assetInfos = await Promise.all(
      validAssets.map((asset) => MediaLibrary.getAssetInfoAsync(asset.id))
    );

    for (const assetInfo of assetInfos) {
      if (assetInfo.uri && !songs.some((s) => s.uri === assetInfo.uri)) {
        songs.push(normalizeSong(assetInfo));
      }
    }
  }

  return songs;
}

function normalizeSong(asset: MediaLibrary.AssetInfo): Song {
  const filename = asset.filename || 'Unknown Title';
  const title = filename.replace(/\.[^.]+$/, '');

  return {
    id: asset.id,
    title: title || 'Unknown Title',
    artist: (asset as { artist?: string }).artist || 'Unknown Artist',
    album: (asset as { album?: string }).album || 'Unknown Album',
    duration: asset.duration,
    uri: asset.uri,
    artwork: undefined,
  };
}
