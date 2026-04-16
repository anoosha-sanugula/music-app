export const Colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  primary: '#1DB954',
  primaryMuted: '#1DB95480',
  border: '#333333',
  separator: '#2A2A2A',
  error: '#FF4444',
  success: '#1DB954',
} as const;

export type ColorKey = keyof typeof Colors;
