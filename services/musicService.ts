import * as MediaLibrary from 'expo-media-library';
import type { Song } from '@/types/Song';

const PAGE_SIZE = 100;

export async function fetchSongs(): Promise<Song[]> {
  const songs: Song[] = [];
  let hasNextPage = true;
  let after: string | undefined;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after,
    });

    hasNextPage = result.hasNextPage ?? false;
    after = result.endCursor ?? undefined;

    for (const asset of result.assets) {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
        if (assetInfo.uri) {
          const exists = songs.some((s) => s.uri === assetInfo.uri);
          if (!exists) {
            songs.push(normalizeSong(asset, assetInfo));
          }
        }
      } catch {
        // Skip assets that fail to load
      }
    }

    if (pageCount > 100) {
      break;
    }

    if (result.assets.length === 0) {
      break;
    }
  }

  return songs;
}

function normalizeSong(asset: MediaLibrary.Asset, assetInfo: MediaLibrary.AssetInfo): Song {
  const filename = asset.filename || assetInfo.filename || 'Unknown Title';
  const title = filename.replace(/\.[^.]+$/, '');

  return {
    id: asset.id,
    title: title || 'Unknown Title',
    artist: (asset as { artist?: string }).artist || (assetInfo as { artist?: string }).artist || 'Unknown Artist',
    album: (asset as { album?: string }).album || (assetInfo as { album?: string }).album || 'Unknown Album',
    duration: asset.duration ?? assetInfo.duration ?? 0,
    uri: assetInfo.uri || asset.uri || '',
    artwork: undefined,
  };
}
