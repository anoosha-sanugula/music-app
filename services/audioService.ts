import { Audio, type AVPlaybackStatus } from 'expo-av';
import type { Song } from '@/types/Song';

let sound: Audio.Sound | null = null;

export async function loadAndPlaySong(
  uri: string,
  onStatusUpdate: (status: AVPlaybackStatus) => void
): Promise<Audio.Sound | null> {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }

  const { sound: newSound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true }
  );

  newSound.setOnPlaybackStatusUpdate(onStatusUpdate);
  sound = newSound;
  return sound;
}

export async function play(): Promise<void> {
  if (sound) {
    await sound.playAsync();
  }
}

export async function pause(): Promise<void> {
  if (sound) {
    await sound.pauseAsync();
  }
}

export async function seekTo(positionMs: number): Promise<void> {
  if (sound) {
    await sound.setPositionAsync(positionMs);
  }
}

export async function unload(): Promise<void> {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }
}

export function getSound(): Audio.Sound | null {
  return sound;
}
