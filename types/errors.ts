export type AppError = {
  type: 'permission_denied' | 'asset_unavailable' | 'playback_failed' | 'store_corrupt' | 'unknown';
  message: string;
};
