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
